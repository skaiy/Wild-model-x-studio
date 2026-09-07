export type SystemRow = {
  id: string;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  color: string;
  descriptionZh: string;
  descriptionEn: string;
};

export type PackRow = {
  id: string;
  name: string;
  sourceFilename: string;
  sourceFormat: string;
  notes: string;
  faceCount: number;
  meshCount: number;
  warningSolid: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PieceRow = {
  id: string;
  packId: string;
  systemId: string | null;
  label: string;
  businessKey: string;
  source: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  faces: number;
  sortOrder: number;
};

export type ManifestObject = {
  id: string;
  part: string;
  label: string;
  businessKey?: string;
  source: string;
  center: [number, number, number];
  size: [number, number, number];
  faces: number;
};

export type VehiclePackManifest = {
  name: string;
  sourceFilename: string;
  sourceFormat: string;
  warningSolid: boolean;
  systems: SystemRow[];
  objects: ManifestObject[];
};

export type ParsedMeshPiece = {
  id: string;
  source: string;
  label: string;
  systemId: string | null;
  businessKey: string;
  center: [number, number, number];
  size: [number, number, number];
  faces: number;
};

export type ModelParseResult = {
  format: string;
  filename: string;
  glbBytes: Uint8Array;
  pieces: ParsedMeshPiece[];
  faceCount: number;
  meshCount: number;
  warningSolid: boolean;
  warnings: string[];
};
