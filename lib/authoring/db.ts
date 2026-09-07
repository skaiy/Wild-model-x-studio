import initSqlJs, {type Database, type SqlJsStatic} from 'sql.js';
import {OEM_SYSTEM_TEMPLATE} from './oem-systems';
import {AUTHORING_SCHEMA} from './schema';
import type {PackRow, PieceRow, SystemRow, VehiclePackManifest} from './types';

/** 旧演示系统 id / 常见别名 → 主机厂模板 id */
export const SYSTEM_ALIASES: Record<string, string> = {
  cabin: 'interior',
  doors: 'closures',
  glass: 'exterior',
  battery: 'edrive',
  drive: 'edrive',
  suspension: 'chassis',
};

export function resolveSystemId(raw: string | null | undefined, known: Set<string>): string | null {
  if (!raw) return null;
  if (known.has(raw)) return raw;
  const aliased = SYSTEM_ALIASES[raw];
  if (aliased && known.has(aliased)) return aliased;
  return null;
}

const IDB_NAME = 'wild-authoring';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'authoring-db-v1';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function loadSql(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: (file) => {
      // Vite may resolve either sql-wasm.wasm or sql-wasm-browser.wasm.
      if (file.endsWith('.wasm')) return `/${file.split('/').pop()}`;
      return `/${file}`;
    },
  });
  return SQL;
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains(IDB_STORE)) idb.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readPersisted(): Promise<Uint8Array | null> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => {
      const value = req.result;
      resolve(value instanceof Uint8Array ? value : null);
    };
    req.onerror = () => reject(req.error);
  });
}

async function writePersisted(data: Uint8Array): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(data, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function seedSystems(database: Database) {
  const count = database.exec('SELECT COUNT(*) AS c FROM systems')[0]?.values[0]?.[0] ?? 0;
  if (Number(count) > 0) return;
  const stmt = database.prepare(
    `INSERT INTO systems (id, name_zh, name_en, sort_order, color, description_zh, description_en)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const s of OEM_SYSTEM_TEMPLATE) {
    stmt.run([s.id, s.nameZh, s.nameEn, s.sortOrder, s.color, s.descriptionZh, s.descriptionEn]);
  }
  stmt.free();
  database.run(`INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '1')`);
}

export async function getDb(): Promise<Database> {
  if (db) return db;
  const sql = await loadSql();
  const saved = await readPersisted();
  db = saved ? new sql.Database(saved) : new sql.Database();
  db.run(AUTHORING_SCHEMA);
  seedSystems(db);
  await persistNow();
  return db;
}

export async function persistNow(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await writePersisted(data);
}

export function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistNow();
  }, 250);
}

function mapSystem(row: Record<string, unknown>): SystemRow {
  return {
    id: String(row.id),
    nameZh: String(row.name_zh),
    nameEn: String(row.name_en),
    sortOrder: Number(row.sort_order),
    color: String(row.color),
    descriptionZh: String(row.description_zh ?? ''),
    descriptionEn: String(row.description_en ?? ''),
  };
}

function mapPack(row: Record<string, unknown>): PackRow {
  return {
    id: String(row.id),
    name: String(row.name),
    sourceFilename: String(row.source_filename ?? ''),
    sourceFormat: String(row.source_format ?? ''),
    notes: String(row.notes ?? ''),
    faceCount: Number(row.face_count ?? 0),
    meshCount: Number(row.mesh_count ?? 0),
    warningSolid: Boolean(Number(row.warning_solid ?? 0)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapPiece(row: Record<string, unknown>): PieceRow {
  return {
    id: String(row.id),
    packId: String(row.pack_id),
    systemId: row.system_id == null || row.system_id === '' ? null : String(row.system_id),
    label: String(row.label ?? ''),
    businessKey: String(row.business_key ?? ''),
    source: String(row.source ?? ''),
    centerX: Number(row.center_x ?? 0),
    centerY: Number(row.center_y ?? 0),
    centerZ: Number(row.center_z ?? 0),
    sizeX: Number(row.size_x ?? 0),
    sizeY: Number(row.size_y ?? 0),
    sizeZ: Number(row.size_z ?? 0),
    faces: Number(row.faces ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function queryAll(database: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = database.prepare(sql);
  stmt.bind(params as never[]);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export async function listSystems(): Promise<SystemRow[]> {
  const database = await getDb();
  return queryAll(database, 'SELECT * FROM systems ORDER BY sort_order, id').map(mapSystem);
}

export async function upsertSystem(system: SystemRow): Promise<void> {
  const database = await getDb();
  database.run(
    `INSERT INTO systems (id, name_zh, name_en, sort_order, color, description_zh, description_en)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name_zh=excluded.name_zh,
       name_en=excluded.name_en,
       sort_order=excluded.sort_order,
       color=excluded.color,
       description_zh=excluded.description_zh,
       description_en=excluded.description_en`,
    [
      system.id,
      system.nameZh,
      system.nameEn,
      system.sortOrder,
      system.color,
      system.descriptionZh,
      system.descriptionEn,
    ],
  );
  schedulePersist();
}

export async function deleteSystem(id: string): Promise<void> {
  const database = await getDb();
  database.run('UPDATE pieces SET system_id = NULL WHERE system_id = ?', [id]);
  database.run('DELETE FROM systems WHERE id = ?', [id]);
  schedulePersist();
}

export async function resetSystemsToOemTemplate(): Promise<void> {
  const database = await getDb();
  database.run('UPDATE pieces SET system_id = NULL');
  database.run('DELETE FROM systems');
  seedSystems(database);
  schedulePersist();
}

export async function listPacks(): Promise<PackRow[]> {
  const database = await getDb();
  return queryAll(
    database,
    'SELECT id, name, source_filename, source_format, notes, face_count, mesh_count, warning_solid, created_at, updated_at FROM packs ORDER BY updated_at DESC',
  ).map(mapPack);
}

export async function getPack(id: string): Promise<PackRow | null> {
  const database = await getDb();
  const rows = queryAll(
    database,
    'SELECT id, name, source_filename, source_format, notes, face_count, mesh_count, warning_solid, created_at, updated_at FROM packs WHERE id = ?',
    [id],
  );
  return rows[0] ? mapPack(rows[0]) : null;
}

export async function getPackGlb(id: string): Promise<Uint8Array | null> {
  const database = await getDb();
  const rows = queryAll(database, 'SELECT glb FROM packs WHERE id = ?', [id]);
  const blob = rows[0]?.glb;
  if (blob instanceof Uint8Array) return blob;
  if (blob instanceof ArrayBuffer) return new Uint8Array(blob);
  return null;
}

export async function listPieces(packId: string): Promise<PieceRow[]> {
  const database = await getDb();
  return queryAll(database, 'SELECT * FROM pieces WHERE pack_id = ? ORDER BY sort_order, id', [packId]).map(mapPiece);
}

export async function createPackFromParse(input: {
  name: string;
  sourceFilename: string;
  sourceFormat: string;
  glbBytes: Uint8Array;
  faceCount: number;
  meshCount: number;
  warningSolid: boolean;
  pieces: Array<{
    id: string;
    systemId: string | null;
    label: string;
    businessKey: string;
    source: string;
    center: [number, number, number];
    size: [number, number, number];
    faces: number;
  }>;
}): Promise<string> {
  const database = await getDb();
  const id = `pack_${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  database.run(
    `INSERT INTO packs (id, name, source_filename, source_format, notes, face_count, mesh_count, warning_solid, glb, created_at, updated_at)
     VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.sourceFilename,
      input.sourceFormat,
      input.faceCount,
      input.meshCount,
      input.warningSolid ? 1 : 0,
      input.glbBytes,
      now,
      now,
    ],
  );
  const stmt = database.prepare(
    `INSERT INTO pieces (id, pack_id, system_id, label, business_key, source, center_x, center_y, center_z, size_x, size_y, size_z, faces, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  input.pieces.forEach((piece, index) => {
    stmt.run([
      piece.id,
      id,
      piece.systemId,
      piece.label,
      piece.businessKey,
      piece.source,
      piece.center[0],
      piece.center[1],
      piece.center[2],
      piece.size[0],
      piece.size[1],
      piece.size[2],
      piece.faces,
      index,
    ]);
  });
  stmt.free();
  schedulePersist();
  return id;
}

export async function updatePackMeta(id: string, patch: {name?: string; notes?: string}): Promise<void> {
  const database = await getDb();
  const current = await getPack(id);
  if (!current) return;
  database.run('UPDATE packs SET name = ?, notes = ?, updated_at = ? WHERE id = ?', [
    patch.name ?? current.name,
    patch.notes ?? current.notes,
    new Date().toISOString(),
    id,
  ]);
  schedulePersist();
}

export async function deletePack(id: string): Promise<void> {
  const database = await getDb();
  database.run('DELETE FROM pieces WHERE pack_id = ?', [id]);
  database.run('DELETE FROM packs WHERE id = ?', [id]);
  schedulePersist();
}

export async function updatePiece(
  packId: string,
  pieceId: string,
  patch: Partial<Pick<PieceRow, 'systemId' | 'label' | 'businessKey'>>,
): Promise<void> {
  const database = await getDb();
  const rows = queryAll(database, 'SELECT * FROM pieces WHERE pack_id = ? AND id = ?', [packId, pieceId]);
  if (!rows[0]) return;
  const current = mapPiece(rows[0]);
  database.run(
    `UPDATE pieces SET system_id = ?, label = ?, business_key = ? WHERE pack_id = ? AND id = ?`,
    [
      patch.systemId === undefined ? current.systemId : patch.systemId,
      patch.label ?? current.label,
      patch.businessKey ?? current.businessKey,
      packId,
      pieceId,
    ],
  );
  database.run('UPDATE packs SET updated_at = ? WHERE id = ?', [new Date().toISOString(), packId]);
  schedulePersist();
}

export async function bulkUpdatePieces(
  packId: string,
  rows: Array<{id: string; systemId?: string | null; label?: string; businessKey?: string}>,
): Promise<number> {
  const database = await getDb();
  let updated = 0;
  for (const row of rows) {
    const existing = queryAll(database, 'SELECT * FROM pieces WHERE pack_id = ? AND id = ?', [packId, row.id]);
    if (!existing[0]) continue;
    const current = mapPiece(existing[0]);
    database.run(`UPDATE pieces SET system_id = ?, label = ?, business_key = ? WHERE pack_id = ? AND id = ?`, [
      row.systemId === undefined ? current.systemId : row.systemId,
      row.label ?? current.label,
      row.businessKey ?? current.businessKey,
      packId,
      row.id,
    ]);
    updated += 1;
  }
  database.run('UPDATE packs SET updated_at = ? WHERE id = ?', [new Date().toISOString(), packId]);
  schedulePersist();
  return updated;
}

export async function assignUnclassified(packId: string, systemId: string): Promise<number> {
  const database = await getDb();
  database.run(`UPDATE pieces SET system_id = ? WHERE pack_id = ? AND (system_id IS NULL OR system_id = '')`, [
    systemId,
    packId,
  ]);
  const changes = database.getRowsModified();
  database.run('UPDATE packs SET updated_at = ? WHERE id = ?', [new Date().toISOString(), packId]);
  schedulePersist();
  return changes;
}

export async function buildPackManifest(packId: string): Promise<VehiclePackManifest | null> {
  const pack = await getPack(packId);
  if (!pack) return null;
  const systems = await listSystems();
  const pieces = await listPieces(packId);
  return {
    name: pack.name,
    sourceFilename: pack.sourceFilename,
    sourceFormat: pack.sourceFormat,
    warningSolid: pack.warningSolid,
    systems,
    objects: pieces.map((p) => ({
      id: p.id,
      part: p.systemId || 'other',
      label: p.label || p.id,
      businessKey: p.businessKey || undefined,
      source: p.source,
      center: [p.centerX, p.centerY, p.centerZ],
      size: [p.sizeX, p.sizeY, p.sizeZ],
      faces: p.faces,
    })),
  };
}

export async function exportSqliteFile(): Promise<Blob> {
  const database = await getDb();
  await persistNow();
  const bytes = database.export();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], {type: 'application/x-sqlite3'});
}

export async function importSqliteFile(bytes: Uint8Array): Promise<void> {
  const sql = await loadSql();
  const next = new sql.Database(bytes);
  next.run(AUTHORING_SCHEMA);
  if (db) db.close();
  db = next;
  await persistNow();
}
