export const AUTHORING_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#8a96a2',
  description_zh TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_filename TEXT NOT NULL DEFAULT '',
  source_format TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  face_count INTEGER NOT NULL DEFAULT 0,
  mesh_count INTEGER NOT NULL DEFAULT 0,
  warning_solid INTEGER NOT NULL DEFAULT 0,
  glb BLOB,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pieces (
  id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  system_id TEXT,
  label TEXT NOT NULL DEFAULT '',
  business_key TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  center_x REAL NOT NULL DEFAULT 0,
  center_y REAL NOT NULL DEFAULT 0,
  center_z REAL NOT NULL DEFAULT 0,
  size_x REAL NOT NULL DEFAULT 0,
  size_y REAL NOT NULL DEFAULT 0,
  size_z REAL NOT NULL DEFAULT 0,
  faces INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (pack_id, id),
  FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
  FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pieces_pack ON pieces(pack_id);
CREATE INDEX IF NOT EXISTS idx_pieces_system ON pieces(system_id);
CREATE INDEX IF NOT EXISTS idx_pieces_business ON pieces(business_key);
`;
