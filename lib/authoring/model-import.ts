import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import type {ModelParseResult, ParsedMeshPiece} from './types';

const FACE_WARN = 1_500_000;

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function countFaces(geometry: THREE.BufferGeometry): number {
  const index = geometry.index;
  if (index) return Math.floor(index.count / 3);
  const pos = geometry.getAttribute('position');
  return pos ? Math.floor(pos.count / 3) : 0;
}

function slugPieceId(source: string, index: number): string {
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  return `${base || 'mesh'}_${String(index).padStart(4, '0')}`;
}

async function loadRoot(file: File, buffer: ArrayBuffer): Promise<THREE.Object3D> {
  const ext = extensionOf(file.name);
  if (ext === 'glb' || ext === 'gltf') {
    const loader = new GLTFLoader();
    const gltf = await loader.parseAsync(buffer, '');
    return gltf.scene;
  }
  if (ext === 'fbx') {
    const loader = new FBXLoader();
    return loader.parse(buffer, '');
  }
  if (ext === 'obj') {
    const text = new TextDecoder().decode(buffer);
    const loader = new OBJLoader();
    return loader.parse(text);
  }
  throw new Error(`暂不支持的格式: .${ext || '?'}`);
}

function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) meshes.push(obj);
  });
  return meshes;
}

function annotatePieces(root: THREE.Object3D): {pieces: ParsedMeshPiece[]; warningSolid: boolean; warnings: string[]} {
  const warnings: string[] = [];
  const meshes = collectMeshes(root);
  const authored = meshes.filter((m) => m.userData?.component);
  const useAuthored = authored.length > 0;
  const selected = useAuthored ? authored : meshes;

  if (selected.length <= 1) {
    warnings.push('合模告警：有效网格片过少（≤1），一期仅告警，不自动拆分。请换已分件模型，或二期使用服务端拆分。');
  }

  const pieces: ParsedMeshPiece[] = selected.map((mesh, index) => {
    const bounds = new THREE.Box3().setFromObject(mesh);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const source = String(mesh.userData?.source_object || mesh.name || `mesh_${index}`);
    const id = String(mesh.userData?.component || slugPieceId(source, index));
    const systemId = mesh.userData?.part ? String(mesh.userData.part) : null;
    const label = String(mesh.userData?.label || mesh.name || id);
    const faces = countFaces(mesh.geometry);
    mesh.userData.component = id;
    mesh.userData.part = systemId || 'other';
    mesh.userData.label = label;
    return {
      id,
      source,
      label,
      systemId,
      businessKey: String(mesh.userData?.businessKey || mesh.userData?.business_key || ''),
      center: [center.x, center.y, center.z],
      size: [size.x, size.y, size.z],
      faces,
    };
  });

  const faceCount = pieces.reduce((sum, p) => sum + p.faces, 0);
  if (faceCount > FACE_WARN) {
    warnings.push(`面数告警：约 ${faceCount.toLocaleString()} 三角面，可能影响浏览器流畅度，建议减面后再发布。`);
  }

  return {pieces, warningSolid: selected.length <= 1, warnings};
}

async function exportGlb(root: THREE.Object3D): Promise<Uint8Array> {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(root, {binary: true, onlyVisible: false});
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  const json = JSON.stringify(result);
  return new TextEncoder().encode(json);
}

export async function parseModelFile(file: File): Promise<ModelParseResult> {
  const ext = extensionOf(file.name);
  if (!['glb', 'gltf', 'fbx', 'obj'].includes(ext)) {
    throw new Error('仅支持 GLB / glTF / FBX / OBJ（不含 STEP）');
  }
  const buffer = await file.arrayBuffer();
  const root = await loadRoot(file, buffer);
  const {pieces, warningSolid, warnings} = annotatePieces(root);
  const glbBytes = await exportGlb(root);
  const faceCount = pieces.reduce((sum, p) => sum + p.faces, 0);
  return {
    format: ext,
    filename: file.name,
    glbBytes,
    pieces,
    faceCount,
    meshCount: pieces.length,
    warningSolid,
    warnings,
  };
}

export function createGlbObjectUrl(bytes: Uint8Array): string {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return URL.createObjectURL(new Blob([buffer], {type: 'model/gltf-binary'}));
}
