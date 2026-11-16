import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BODY3D_PARTS, BODY3D_ATTRIBUTION, partByMesh, type Body3DPart } from '../content/body3d';
import { ErrorState, LoadingState } from './States';

const BASE = import.meta.env.BASE_URL;

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Colour and opacity for a part, from the page's design tokens. */
function look(p: Body3DPart): { color: string; opacity: number } {
  const base = lookByRole(p);
  return p.opacity === undefined ? base : { ...base, opacity: p.opacity };
}

function lookByRole(p: Body3DPart): { color: string; opacity: number } {
  if (p.layer === 'skin') return { color: cssVar('--skin-3d', '#d8c3b0'), opacity: 0.12 };
  if (p.layer === 'skeleton') return { color: cssVar('--bone-3d', '#e9e3d4'), opacity: 0.22 };
  switch (p.role) {
    case 'o2-rich':
      return { color: cssVar('--vessel-rich-3d', '#c0393f'), opacity: 1 };
    case 'o2-poor':
      return { color: cssVar('--vessel-poor-3d', '#3d6db3'), opacity: 1 };
    case 'muscle':
      return { color: cssVar('--muscle-3d', '#a8433f'), opacity: 1 };
    case 'organ':
      return { color: cssVar('--organ-3d', '#e8c9b0'), opacity: 1 };
    case 'viscera':
      return { color: cssVar('--viscera-3d', '#c9a27e'), opacity: 0.85 };
    default:
      return { color: cssVar('--context-3d', '#b9b2a6'), opacity: 0.55 };
  }
}

export interface Body3DProps {
  selected: string | null;
  /** Meshes to emphasise when nothing is selected (e.g. the organs of a lesson step). */
  highlight?: string[];
  onSelect: (mesh: string) => void;
  showSkin: boolean;
  showSkeleton: boolean;
  /** Show organs outside the oxygen journey's core (gut, kidneys, brain…). */
  showOther: boolean;
  /** Increment to reset the camera. */
  resetKey: number;
}

/**
 * Transparent whole-body model. Drag to rotate, scroll or pinch to zoom,
 * click an organ to select it. The organ list next to it is the keyboard
 * and screen-reader alternative; this canvas is aria-hidden.
 */
export function Body3D({ selected, highlight = [], onSelect, showSkin, showSkeleton, showOther, resetKey }: Body3DProps) {
  const emphasis = selected ? [selected] : highlight;
  const emphasisKey = emphasis.join('|');
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    meshes: Map<string, THREE.Mesh>;
    render: () => void;
    reset: () => void;
    focus: (meshes: THREE.Mesh[]) => void;
  } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hover, setHover] = useState<string | null>(null);

  // Set up renderer, scene and model once.
  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, el.clientWidth / el.clientHeight, 0.01, 50);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(1, 2, 3);
    scene.add(key);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.minDistance = 0.25;
    controls.maxDistance = 6;

    const meshes = new Map<string, THREE.Mesh>();
    let home = { target: new THREE.Vector3(), position: new THREE.Vector3(0, 1, 4) };
    const render = () => renderer.render(scene, camera);
    const reset = () => {
      controls.target.copy(home.target);
      camera.position.copy(home.position);
      controls.update();
      render();
    };

    // Fly the camera to a mesh, keeping the current viewing direction.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let flight = 0;
    const focus = (targets: THREE.Mesh[]) => {
      const box = new THREE.Box3();
      targets.forEach((t) => box.expandByObject(t));
      const size = box.getSize(new THREE.Vector3()).length();
      const target = box.getCenter(new THREE.Vector3());
      const dir = camera.position.clone().sub(controls.target).normalize();
      const dist = Math.max(0.45, size * 1.6);
      const toPos = target.clone().add(dir.multiplyScalar(dist));
      const fromPos = camera.position.clone();
      const fromTarget = controls.target.clone();
      cancelAnimationFrame(flight);
      if (reduceMotion) {
        controls.target.copy(target);
        camera.position.copy(toPos);
        controls.update();
        render();
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 450);
        const e = 1 - (1 - t) ** 3;
        controls.target.lerpVectors(fromTarget, target, e);
        camera.position.lerpVectors(fromPos, toPos, e);
        controls.update();
        render();
        if (t < 1) flight = requestAnimationFrame(step);
      };
      flight = requestAnimationFrame(step);
    };

    const draco = new DRACOLoader();
    draco.setDecoderPath(`${BASE}draco/`);
    draco.setDecoderConfig({ type: 'wasm' });
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    let disposed = false;
    loader.load(
      `${BASE}models/body.glb`,
      (gltf) => {
        if (disposed) return;
        gltf.scene.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return;
          const mesh = o as THREE.Mesh;
          const part = partByMesh(mesh.name);
          if (!part) return;
          const { color, opacity } = look(part);
          mesh.material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.6,
            metalness: 0,
            transparent: opacity < 1,
            opacity,
            depthWrite: opacity >= 0.5,
            side: part.layer === 'skin' ? THREE.FrontSide : THREE.DoubleSide,
          });
          // Draw transparent shells after the organs inside them.
          mesh.renderOrder = part.layer === 'skin' ? 3 : part.layer === 'skeleton' ? 2 : 1;
          meshes.set(mesh.name, mesh);
        });
        scene.add(gltf.scene);
        // Frame the thorax, where this release's content is.
        const box = new THREE.Box3().setFromObject(meshes.get('heart') ?? gltf.scene);
        const whole = new THREE.Box3().setFromObject(gltf.scene);
        const centre = box.getCenter(new THREE.Vector3());
        centre.y -= 0.05;
        const height = whole.max.y - whole.min.y;
        home = { target: centre.clone(), position: centre.clone().add(new THREE.Vector3(0, 0.05, height * 0.75)) };
        reset();
        api.current = { meshes, render, reset, focus };
        setState('ready');
      },
      undefined,
      () => !disposed && setState('error'),
    );

    // Picking: ignore skin and skeleton so clicks go through the body wall.
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (e: PointerEvent): string | null => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const targets = [...meshes.values()].filter((m) => m.visible && partByMesh(m.name)?.layer === 'organ');
      const hit = ray.intersectObjects(targets, false)[0];
      return hit ? hit.object.name : null;
    };
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      // A drag rotates; only a near-stationary press selects.
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
        const name = pick(e);
        if (name) onSelectRef.current(name);
      }
      down = null;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const name = pick(e);
      setHover(name);
      renderer.domElement.style.cursor = name ? 'pointer' : 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onMove);

    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
      render();
    });
    ro.observe(el);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (controls.update() || !controls.enableDamping) render();
    };
    controls.addEventListener('change', render);
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(flight);
      ro.disconnect();
      controls.dispose();
      draco.dispose();
      meshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  // Apply selection, hover and layer visibility.
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const accent = new THREE.Color(cssVar('--accent', '#a3132b'));
    a.meshes.forEach((mesh, name) => {
      const part = partByMesh(name)!;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const base = look(part);
      const emphasised = emphasis.includes(name);
      mesh.visible =
        emphasised ||
        (part.layer === 'skin' ? showSkin : part.layer === 'skeleton' ? showSkeleton : part.group === 'core' || showOther);
      const isSel = emphasised;
      const isHover = name === hover;
      mat.emissive.copy(isSel ? accent : isHover ? new THREE.Color(0x444444) : new THREE.Color(0x000000));
      mat.emissiveIntensity = isSel ? 0.55 : 0.4;
      // With a selection, fade the other organs so the selected one stands out.
      const fade = emphasis.length > 0 && !isSel && part.layer === 'organ';
      mat.opacity = fade ? Math.min(base.opacity, 0.28) : base.opacity;
      mat.transparent = mat.opacity < 1;
      mat.depthWrite = mat.opacity >= 0.5;
      mat.needsUpdate = true;
    });
    a.render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emphasisKey, hover, showSkin, showSkeleton, showOther, state]);

  useEffect(() => {
    if (resetKey > 0) api.current?.reset();
  }, [resetKey]);

  // Bring the selected organ into view (from a click or from the organ list).
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const ms = emphasis.map((n) => a.meshes.get(n)).filter((m): m is THREE.Mesh => !!m);
    if (ms.length) a.focus(ms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emphasisKey, state]);

  return (
    <div className="body3d">
      <div ref={host} className="body3d-canvas" />
      {state === 'loading' && (
        <div className="body3d-overlay">
          <LoadingState label="Loading the 3D body (1.3 MB)" />
        </div>
      )}
      {state === 'error' && (
        <div className="body3d-overlay">
          <ErrorState title="The 3D model could not be loaded" detail="The 2D diagrams have the same content." />
        </div>
      )}
      {hover && state === 'ready' && (
        <p className="body3d-hover" aria-hidden="true">
          {partByMesh(hover)?.label}
        </p>
      )}
    </div>
  );
}

export { BODY3D_PARTS, BODY3D_ATTRIBUTION };
