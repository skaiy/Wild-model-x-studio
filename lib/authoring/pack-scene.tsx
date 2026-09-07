'use client';
import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createExplosionLayout, layoutCenter, overviewDirection} from '@/app/explosion-layout';
import type {SystemRow} from '@/lib/authoring/types';

export type PackScenePiece = {
  id: string;
  systemId: string;
  label: string;
};

type Props = {
  modelUrl: string | null;
  systems: SystemRow[];
  pieces: PackScenePiece[];
  selectedPieceId: string;
  selectedSystemId: string;
  explode: number;
  isolated: boolean;
  onSelectPiece: (id: string) => void;
};

type RuntimePiece = {
  id: string;
  systemId: string;
  node: THREE.Object3D;
  home: THREE.Vector3;
  fullSpread: THREE.Vector3;
  center: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
};

export function PackScene({
  modelUrl,
  systems,
  pieces,
  selectedPieceId,
  selectedSystemId,
  explode,
  isolated,
  onSelectPiece,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({pieces, selectedPieceId, selectedSystemId, explode, isolated, onSelectPiece, systems});
  latest.current = {pieces, selectedPieceId, selectedSystemId, explode, isolated, onSelectPiece, systems};

  useEffect(() => {
    const el = host.current;
    if (!el || !modelUrl) return;

    let cancelled = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050607');
    const camera = new THREE.PerspectiveCamera(37, 1, 0.05, 500);
    camera.position.set(-5.7, 2.9, 6.3);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.49;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xd8e9ff, 0x444448, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-4, 8, 4);
    scene.add(key);

    const groups = new Map<string, THREE.Group>();
    const ensureGroup = (id: string) => {
      let g = groups.get(id);
      if (!g) {
        g = new THREE.Group();
        g.name = id;
        groups.set(id, g);
        scene.add(g);
      }
      return g;
    };
    latest.current.systems.forEach((s) => ensureGroup(s.id));
    ensureGroup('other');

    const runtime: RuntimePiece[] = [];
    let layout: ReturnType<typeof createExplosionLayout> | null = null;
    let amount = latest.current.explode / 100;
    let raf = 0;

    const fit = () => {
      const box = new THREE.Box3();
      runtime.forEach((p) => box.expandByObject(p.node));
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(overviewDirection, Math.max(6, size * 1.2));
      controls.update();
    };

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onClick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...groups.values()], true);
      const hit = hits[0];
      if (!hit) return;
      let obj: THREE.Object3D | null = hit.object;
      while (obj && !obj.userData.component) obj = obj.parent;
      if (obj?.userData.component) latest.current.onSelectPiece(String(obj.userData.component));
    };
    renderer.domElement.addEventListener('pointerup', onClick);

    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        if (cancelled) return;
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const metaById = new Map(latest.current.pieces.map((p) => [p.id, p]));
        const nodes: THREE.Object3D[] = [];
        model.traverse((o) => {
          if (o.userData?.component) nodes.push(o);
        });
        if (!nodes.length) {
          model.traverse((o) => {
            if (o instanceof THREE.Mesh) nodes.push(o);
          });
        }
        nodes.forEach((node, index) => {
          const id = String(node.userData.component || node.name || `mesh_${index}`);
          const meta = metaById.get(id);
          const systemId = meta?.systemId || String(node.userData.part || 'other');
          node.userData.component = id;
          node.userData.part = systemId;
          const group = ensureGroup(systemId);
          group.attach(node);
          const bounds = new THREE.Box3().setFromObject(node);
          const center = bounds.getCenter(new THREE.Vector3());
          const materials: THREE.MeshStandardMaterial[] = [];
          node.traverse((o) => {
            if (!(o instanceof THREE.Mesh)) return;
            o.userData.component = id;
            o.userData.part = systemId;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            o.material = Array.isArray(o.material) ? mats.map((m) => m.clone()) : mats[0].clone();
            (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial) {
                materials.push(m);
                m.userData.baseEmission = m.emissive.clone();
                m.userData.baseIntensity = m.emissiveIntensity;
              }
            });
          });
          runtime.push({
            id,
            systemId,
            node,
            home: node.position.clone(),
            fullSpread: new THREE.Vector3(),
            center,
            materials,
          });
        });
        layout = createExplosionLayout(
          runtime.map((p) => ({id: p.id, part: p.systemId, bounds: new THREE.Box3().setFromObject(p.node)})),
        );
        runtime.forEach((p) => {
          const slot = layout!.pieces.get(p.id);
          if (slot) p.fullSpread.copy(slot.translation);
        });
        fit();
      },
      undefined,
      () => undefined,
    );

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = latest.current;
      amount += (p.explode / 100 - amount) * 0.12;
      const individual = THREE.MathUtils.smoothstep(amount, 0.4, 1);
      runtime.forEach((piece) => {
        const meta = p.pieces.find((x) => x.id === piece.id);
        const systemId = meta?.systemId || piece.systemId;
        piece.systemId = systemId;
        piece.node.visible = !p.isolated || systemId === p.selectedSystemId;
        piece.node.position.copy(piece.home).addScaledVector(piece.fullSpread, individual);
        for (const m of piece.materials) {
          m.emissive.copy(m.userData.baseEmission);
          m.emissiveIntensity = m.userData.baseIntensity;
          if (piece.id === p.selectedPieceId) {
            m.emissive.set('#c1532f');
            m.emissiveIntensity = 0.25;
          }
        }
      });
      if (layout && individual > 0.2) {
        const target = layoutCenter.clone();
        const distance =
          Math.max(layout.height / (2 * Math.tan(THREE.MathUtils.degToRad(37 / 2))), layout.width / (2 * Math.tan(THREE.MathUtils.degToRad(37 / 2)) * camera.aspect)) *
            1.18 +
          3;
        camera.position.lerp(target.clone().addScaledVector(overviewDirection, distance), 0.08);
        controls.target.lerp(target, 0.08);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerup', onClick);
      renderer.dispose();
      if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  return <div ref={host} className="authoring-canvas" />;
}
