import type {PieceRow} from './types';

export const PIECE_CSV_HEADERS = [
  'id',
  'system_id',
  'label',
  'business_key',
  'source',
  'faces',
  'center_x',
  'center_y',
  'center_z',
  'size_x',
  'size_y',
  'size_z',
] as const;

function escapeCell(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function piecesToCsv(pieces: PieceRow[]): string {
  const lines = [PIECE_CSV_HEADERS.join(',')];
  for (const p of pieces) {
    lines.push(
      [
        p.id,
        p.systemId ?? '',
        p.label,
        p.businessKey,
        p.source,
        p.faces,
        p.centerX,
        p.centerY,
        p.centerZ,
        p.sizeX,
        p.sizeY,
        p.sizeZ,
      ]
        .map(escapeCell)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');
  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      i += 1;
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export type CsvPiecePatch = {
  id: string;
  systemId?: string | null;
  label?: string;
  businessKey?: string;
};

export function csvToPiecePatches(text: string): CsvPiecePatch[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const idAt = idx('id');
  if (idAt < 0) throw new Error('CSV 缺少 id 列');
  const systemAt = idx('system_id');
  const labelAt = idx('label');
  const keyAt = idx('business_key');
  const patches: CsvPiecePatch[] = [];
  for (const line of table.slice(1)) {
    const id = (line[idAt] || '').trim();
    if (!id) continue;
    const patch: CsvPiecePatch = {id};
    if (systemAt >= 0) {
      const value = (line[systemAt] || '').trim();
      patch.systemId = value === '' ? null : value;
    }
    if (labelAt >= 0) patch.label = line[labelAt] ?? '';
    if (keyAt >= 0) patch.businessKey = line[keyAt] ?? '';
    patches.push(patch);
  }
  return patches;
}

export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toBlobPart(bytes: Uint8Array): BlobPart {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function downloadBytes(filename: string, bytes: Uint8Array, mime: string) {
  const blob = new Blob([toBlobPart(bytes)], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
