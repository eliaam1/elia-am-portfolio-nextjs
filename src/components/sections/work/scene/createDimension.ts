import * as THREE from 'three';
import { FRAGMENT_KEYS, fragmentUrl, type WorkProject } from '../workData';
import { buildCompositions, mkArchitecture, mkGrid, mkParticles, type TexMap } from './compositions';
import { COLLAPSE_DEPTH, OPENING_EXIT_Z, PROJECT_GAP, projectZ } from './timing';
import { applyItem, beaconRadius, clamp01, glowTexture, itemOf, lerp, mkBeacon, setBeacon, type SharedUniforms } from './materials';

const BG = 0x050605;
const PARTICLES = 2600;
const MAX_DPR = 1.75;


export interface ProjectState {
  /** 0..1 the composition's entrance sequence. */
  in: number;
  /** 0..1 the fly-through. */
  fly: number;
}
/** Plain numbers written by the GSAP timeline, read every frame. */
export interface DimState {
  dot: number;
  ring: number;
  env: number;
  cz: number;
  orbit: number;
  collapse: number;
  portal: number;
  p: ProjectState[];
}
export interface Layout {
  /** Where the camera looks, so compositions sit beside the text. */
  tx: number;
  ty: number;
  /** Resting distance from a composition. */
  rest: number;
  scale: number;
  fov: number;
  /** Final portal ring size. */
  portal: number;
}
export interface Pointer {
  x: number;
  y: number;
}
export interface RingOnScreen {
  x: number;
  y: number;
  radius: number;
}
export interface Dimension {
  state: DimState;
  layout: () => Layout;
  resize: () => void;
  frame: (dt: number, velocity: number, pointer: Pointer) => void;
  activeIndex: () => number;
  ringOnScreen: () => RingOnScreen | null;
  dispose: () => void;
}

const LANDSCAPE: Layout = { tx: -2.8, ty: 0.2, rest: 23.5, scale: 1, fov: 50, portal: 1.25 };
const PORTRAIT: Layout = { tx: 1.6, ty: -4.2, rest: 20, scale: 0.5, fov: 66, portal: 1.6 };

async function loadTextures(projects: readonly WorkProject[]): Promise<TexMap> {
  const [sz, ph, ag] = projects;
  const urls: Record<string, string> = { sz: sz.desktop, szm: sz.mobile, ph: ph.desktop, phm: ph.mobile, ag: ag.desktop, agm: ag.mobile };
  FRAGMENT_KEYS.forEach((k) => {
    urls[k] = fragmentUrl(k);
  });
  const loader = new THREE.TextureLoader();
  const entries = await Promise.all(
    Object.entries(urls).map(async ([k, url]) => {
      const t = await loader.loadAsync(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return [k, t] as const;
    })
  );
  return Object.fromEntries(entries) as TexMap;
}

function disposeScene(scene: THREE.Scene): void {
  const textures = new Set<THREE.Texture>();
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
    mats.forEach((m) => {
      Object.values(m as unknown as Record<string, unknown>).forEach((v) => {
        if (v instanceof THREE.Texture) textures.add(v);
      });
      if (m instanceof THREE.ShaderMaterial) {
        Object.values(m.uniforms).forEach((u) => {
          if (u.value instanceof THREE.Texture) textures.add(u.value);
        });
      }
      m.dispose();
    });
  });
  textures.forEach((t) => t.dispose());
}

/**
 * Builds the scene on `canvas`, which must be a fresh element per call: dispose()
 * force-loses its WebGL context, so a canvas is never reused.
 * Resolves null (and frees everything) if `isCancelled` turns true while loading.
 */
export async function createDimension(canvas: HTMLCanvasElement, projects: readonly WorkProject[], isCancelled: () => boolean): Promise<Dimension | null> {
  // Images first, before any GL work, so a cancelled run never touches the GPU.
  const T = await loadTextures(projects);
  if (isCancelled()) {
    Object.values(T).forEach((t) => t.dispose());
    return null;
  }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(BG, 1);

  const U: SharedUniforms = { uVel: { value: 0 }, uTime: { value: 0 } };
  const n = projects.length;
  const cEnd = new THREE.Vector3(0, 0, projectZ(n - 1) - COLLAPSE_DEPTH);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 40, 125);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 420);
  const opening = mkBeacon(glowTexture(false), glowTexture(true));
  const portal = mkBeacon(glowTexture(false), glowTexture(true));
  portal.position.copy(cEnd);
  const particles = mkParticles(U, PARTICLES, cEnd);
  const grid = mkGrid();
  const arch = mkArchitecture(U, T);
  const comps = buildCompositions(U, T);
  const bases = comps.map((_, i) => new THREE.Vector3(0, 0, projectZ(i)));
  comps.forEach((c) => scene.add(c.g));
  scene.add(opening, portal, particles, grid, arch);

  let L = LANDSCAPE;
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    renderer.setSize(w, h, false);
    particles.material.uniforms.uPix.value = renderer.getPixelRatio();
    camera.aspect = w / h;
    L = w / h < 0.9 ? PORTRAIT : LANDSCAPE;
    camera.fov = L.fov;
    camera.updateProjectionMatrix();
  };
  resize();

  const state: DimState = { dot: 0, ring: 0, env: 0, cz: 30, orbit: 0, collapse: 0, portal: 0, p: projects.map(() => ({ in: 0, fly: 0 })) };
  const portalRing = () => clamp01((state.portal - 0.25) / 0.75) * L.portal;
  const activeIndex = () => Math.min(n - 1, Math.max(0, Math.floor((OPENING_EXIT_Z - state.cz) / PROJECT_GAP)));

  let time = 0;
  let drift = 0;
  const look = new THREE.Vector3();
  const mainW = new THREE.Vector3();

  /** Beacons, particles, grid and the corridor screens. Returns the portal fade. */
  const updateWorld = (vel: number): number => {
    const S = state;
    setBeacon(opening, S.dot, S.ring);
    if (S.cz < -6) opening.visible = false;
    setBeacon(portal, Math.min(1, S.portal * 3), portalRing() * (1 + Math.sin(time * 1.6) * 0.012));
    const envOp = S.env * (1 - S.collapse);
    const pu = particles.material.uniforms;
    pu.uOpacity.value = S.env;
    pu.uDrift.value = drift;
    pu.uCollapse.value = S.collapse;
    pu.uPortal.value = clamp01((S.portal - 0.3) / 0.7);
    grid.material.opacity = envOp * 0.1;
    arch.children.forEach((o) => {
      const m = o as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
      m.material.uniforms.uOpacity.value = envOp * 0.16 + S.collapse * 0.5 * (1 - S.portal);
      m.position.lerpVectors(m.userData.base as THREE.Vector3, cEnd, S.collapse);
      m.position.y += Math.sin(time * 0.6 + (m.userData.bob as number)) * 0.35 * (1 + vel * 3) * (1 - S.collapse);
      m.scale.setScalar(1 - S.collapse * 0.85);
    });
    return clamp01(S.portal * 3);
  };

  const updateComps = (fade: number, pointer: Pointer) => {
    const S = state;
    comps.forEach((c, i) => {
      const P = S.p[i];
      c.g.visible = P.in > 0 || S.collapse > 0;
      if (!c.g.visible) return;
      c.g.position.lerpVectors(bases[i], cEnd, S.collapse);
      c.g.scale.setScalar(L.scale * (1 - S.collapse * 0.9));
      c.extra?.(P.in, time);
      const f = { u: P.in, fly: P.fly, collapse: S.collapse, fade };
      c.g.traverse((o) => {
        const it = itemOf(o);
        if (it) applyItem(o, it, f);
      });
      // the main screen squares up for the fly-through; at rest it tilts toward the pointer
      c.main.rotation.x = lerp(c.main.rotation.x + pointer.y * 0.05, 0, P.fly);
      c.main.rotation.y = lerp(c.main.rotation.y + pointer.x * 0.07, 0, P.fly);
      const flash = P.fly > 0 ? clamp01(1 - (S.cz - projectZ(i)) / 5) * P.fly * (1 - S.collapse) : 0;
      c.screens.forEach((s) => {
        s.material.uniforms.uFlash.value = flash * 0.5;
      });
    });
  };

  const updateCamera = (vel: number, pointer: Pointer) => {
    const S = state;
    const k = activeIndex();
    const f = S.p[k].fly * (1 - S.collapse);
    comps[k].main.getWorldPosition(mainW);
    const framing = S.env * (1 - S.collapse);
    const bx = (L.tx + Math.sin(S.orbit) * 5) * framing + pointer.x * 1.4;
    const by = L.ty * framing + pointer.y * 0.9;
    camera.position.set(lerp(bx, mainW.x, f), lerp(by, mainW.y, f), S.cz);
    look.set(lerp(L.tx * framing, mainW.x, f), lerp(L.ty * framing, mainW.y, f), S.cz - 20);
    camera.lookAt(look);
    camera.fov = L.fov + vel * 5;
    camera.updateProjectionMatrix();
  };

  const frame = (dt: number, vel: number, pointer: Pointer) => {
    time += dt;
    U.uVel.value = vel;
    U.uTime.value = time;
    drift += dt * (0.8 + vel * 16);
    const fade = updateWorld(vel);
    updateComps(fade, pointer);
    updateCamera(vel, pointer);
    renderer.render(scene, camera);
  };

  const ringCenter = new THREE.Vector3();
  const ringEdge = new THREE.Vector3();
  const ringOnScreen = (): RingOnScreen | null => {
    if (state.portal <= 0.2) return null;
    ringCenter.copy(cEnd).project(camera);
    ringEdge.copy(cEnd).setY(cEnd.y + beaconRadius(portalRing())).project(camera);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    return { x: ((ringCenter.x + 1) / 2) * w, y: ((1 - ringCenter.y) / 2) * h, radius: (Math.abs(ringEdge.y - ringCenter.y) * h) / 2 };
  };

  const dispose = () => {
    disposeScene(scene);
    renderer.dispose();
    renderer.forceContextLoss();
  };

  return { state, layout: () => L, resize, frame, activeIndex, ringOnScreen, dispose };
}
