import * as THREE from 'three';
import type { FragmentKey } from '../workData';
import { aspectOf, item, itemOf, mkBrowser, mkPanel, mkPhone, mkScreen, type ScreenMesh, type SharedUniforms } from './materials';

export type ShotKey = 'sz' | 'szm' | 'ph' | 'phm' | 'ag' | 'agm';
export type TexMap = Record<ShotKey | FragmentKey, THREE.Texture>;
type Vec = [number, number, number];

export interface Composition {
  g: THREE.Group;
  /** The screen the camera flies through. */
  main: THREE.Object3D;
  /** Screens that flash as the camera passes through them. */
  screens: ScreenMesh[];
  /** Per-frame extras (AgriSide's orbit). */
  extra?: (u: number, t: number) => void;
}

/** Sport Zone: the storefront assembles from layered panels; products fly into place. */
function sportZone(U: SharedUniforms, T: TexMap): Composition {
  const g = new THREE.Group();
  const W = 16;
  const rows = 4;
  const H = W / aspectOf(T.sz);
  const main = new THREE.Group();
  const slices: ScreenMesh[] = [];
  main.add(item(mkPanel(W + 0.24, H + 0.8), { to: { p: [0, 0.28, -0.05] }, t0: 0.28, d: 0.14, keep: true }));
  for (let k = 0; k < rows; k++) {
    const s = mkScreen(U, T.sz, W, H / rows, { rect: [0, 1 - (k + 1) / rows, 1, 1 / rows], bend: 0.12 });
    const y = H / 2 - H / rows / 2 - (k * H) / rows;
    const side = k % 2 ? 1 : -1;
    main.add(item(s, { from: { p: [side * 18, y, -(8 + k * 4)], r: [0, -side * 0.6, 0] }, to: { p: [0, y, 0] }, t0: k * 0.06, d: 0.32, keep: true }));
    slices.push(s);
  }
  item(main, { to: { p: [3, 0.6, 0], r: [0, -0.18, 0] }, t0: 0, d: 0.01, keep: true });
  g.add(main);

  const products: [FragmentKey, Vec, number][] = [
    ['sz-prod-1', [-1.5, -6.4, 2.2], 0.2],
    ['sz-prod-2', [2.4, -7.1, 3.4], -0.1],
    ['sz-prod-3', [6.3, -6.8, 3.0], 0.12],
    ['sz-prod-4', [10.2, -6.2, 2.4], -0.18],
    ['sz-shoe', [13.6, 5.4, 1.2], 0.1],
  ];
  products.forEach(([k, p, rz], j) => {
    const w = k === 'sz-shoe' ? 4 : 2.7;
    const spin = j % 2 ? 1 : -1;
    g.add(item(mkScreen(U, T[k], w, w / aspectOf(T[k]), { bend: 0.06 }), {
      from: { p: [p[0] * 2.4, p[1] - 3, p[2] - 40], r: [0.8, 1.6 * spin, 1.4] },
      to: { p, r: [0, 0, rz] },
      t0: 0.38 + j * 0.06,
      d: 0.34,
    }));
  });
  const panels: [FragmentKey, Vec, Vec, number][] = [
    ['sz-cats', [3, 8.6, -4], [0, -0.1, 0], 12],
    ['sz-collections', [-5.5, 9.5, -12], [0, 0.35, 0], 9.5],
    ['sz-basketball', [16.5, -1, -9], [0, -0.6, 0], 9.5],
  ];
  panels.forEach(([k, p, r, w], j) => {
    g.add(item(mkBrowser(U, T[k], w), { from: { p: [p[0], p[1], p[2] - 18], r }, to: { p, r }, t0: 0.3 + j * 0.05, d: 0.4, op: 0.8 }));
  });
  g.add(item(mkPhone(U, T.szm, 3.2), { from: { p: [12, -5, 2.6], r: [0, -0.35 - Math.PI, 0] }, to: { p: [11.6, -1.6, 2.6], r: [0, -0.35, 0] }, t0: 0.5, d: 0.34 }));
  return { g, main, screens: slices };
}

/** The Physio Clinic: the site unfolds from a thin vertical sliver; its pages fan out of it. */
function physio(U: SharedUniforms, T: TexMap): Composition {
  const g = new THREE.Group();
  const intro = T['ph-intro'];
  g.add(item(mkScreen(U, intro, 34, 34 / aspectOf(intro), { bend: 0.6 }), { from: { p: [2, 0, -22], s: [0.6, 0.6, 1] }, to: { p: [2, 0, -14] }, t0: 0, d: 0.5, op: 0.55 }));
  const main = mkBrowser(U, T.ph, 16);
  g.add(item(main, { from: { p: [3, 0.6, 0], r: [0, 1.25, 0], s: [0.015, 1, 1] }, to: { p: [3, 0.6, 0], r: [0, -0.16, 0] }, t0: 0.06, d: 0.36, keep: true }));
  const pages: [FragmentKey, Vec, number][] = [
    ['ph-doctor', [15.5, 5.2, -6], -0.42],
    ['ph-space', [17.5, -1.4, -9], -0.58],
    ['ph-visit', [13.5, -7.2, -4], -0.34],
  ];
  pages.forEach(([k, p, ry], j) => {
    g.add(item(mkBrowser(U, T[k], 8.5), {
      from: { p: [3, 0.6, -1.5 - j * 0.4], r: [0, -0.16, 0], s: [0.9, 0.9, 1] },
      to: { p, r: [0, ry, (j - 1) * 0.06] },
      t0: 0.38 + j * 0.07,
      d: 0.36,
      op: 0.92,
    }));
  });
  g.add(item(mkPhone(U, T.phm, 3.2), { from: { p: [-4.6, -13, 3], r: [-1.4, 0, -0.3] }, to: { p: [-4.6, -2.4, 3], r: [0, 0.3, 0] }, t0: 0.46, d: 0.36 }));
  return { g, main, screens: [main.userData.screen] };
}

/** AgriSide: English and Arabic mirror each other; its product lines orbit the site. */
function agriSide(U: SharedUniforms, T: TexMap): Composition {
  const g = new THREE.Group();
  const main = mkBrowser(U, T.ag, 15);
  g.add(item(main, { from: { p: [-22, 0.6, -6], r: [0, 0.9, 0] }, to: { p: [3, 0.6, 0], r: [0, 0.16, 0] }, t0: 0.04, d: 0.36, keep: true }));
  g.add(item(mkBrowser(U, T['ag-arabic'], 11.5), { from: { p: [3, 0.6, -1.2], r: [0, 0.16, 0], s: [0.8, 0.8, 1] }, to: { p: [15.4, 1.6, -3.5], r: [0, -0.5, 0] }, t0: 0.32, d: 0.34, op: 0.95 }));
  const orbit = new THREE.Group();
  orbit.position.set(4.5, 0.6, -5);
  const keys: FragmentKey[] = ['ag-animals', 'ag-tub', 'ag-reach', 'ag-spray', 'ag-order', 'ag-lines'];
  const frags = keys.map((k, j) => {
    const w = k === 'ag-tub' || k === 'ag-spray' ? 3.4 : 6.2;
    const m = item(mkBrowser(U, T[k], w), { from: { s: [0.01, 0.01, 1] }, to: { s: [1, 1, 1] }, t0: 0.4 + j * 0.05, d: 0.3, op: 0.9 });
    orbit.add(m);
    return m;
  });
  g.add(orbit);
  g.add(item(mkPhone(U, T.agm, 3.1), { from: { p: [-8, -12, 3], r: [0, 0, -0.9] }, to: { p: [-4.4, -2.2, 3], r: [0, 0.32, 0.04] }, t0: 0.5, d: 0.34 }));
  // the fragments ride an ellipse around the site; scroll turns it
  const extra = (u: number, t: number) => {
    const spin = u * 1.6 + t * 0.04;
    frags.forEach((m, j) => {
      const it = itemOf(m);
      if (!it) return;
      const a = spin + (j / frags.length) * Math.PI * 2;
      it.toP.set(Math.cos(a) * 13, Math.sin(a) * 8.5, Math.sin(a * 2) * 1.5);
      it.fromP.copy(it.toP);
      it.dir.copy(it.toP).normalize();
    });
  };
  return { g, main, screens: [main.userData.screen], extra };
}

export function buildCompositions(U: SharedUniforms, T: TexMap): Composition[] {
  return [sportZone(U, T), physio(U, T), agriSide(U, T)];
}

/* ---------------- the world ---------------- */
export type Particles = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

export function mkParticles(U: SharedUniforms, count: number, center: THREE.Vector3): Particles {
  const pos = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.pow(Math.random(), 0.6) * 32;
    pos.set([Math.cos(a) * r, Math.sin(a) * r * 0.72, 40 - Math.random() * 330], i * 3);
    rnd[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uDrift: { value: 0 },
      uCollapse: { value: 0 },
      uPortal: { value: 0 },
      uTime: U.uTime,
      uOpacity: { value: 0 },
      uPix: { value: 1 },
      uCenter: { value: center.clone() },
    },
    vertexShader: /* glsl */ `
      uniform float uDrift, uCollapse, uPortal, uTime, uPix; uniform vec3 uCenter;
      attribute float aRand; varying float vA; varying float vR;
      void main() {
        vec3 p = position;
        p.z = 40.0 - mod(40.0 - p.z - uDrift * (0.6 + aRand), 330.0);   // stream toward the camera
        p = mix(p, uCenter + (p - uCenter) * 0.015, uCollapse);          // the world collapses
        float flow = fract(uTime * 0.07 + aRand * 1.7);                   // then spirals into the portal
        float rad = mix(26.0, 9.6, flow);
        float ang = atan(position.y, position.x) + uTime * 0.12 * (12.0 / rad) + flow * 2.2;
        p = mix(p, uCenter + vec3(cos(ang) * rad, sin(ang) * rad, -6.0 + aRand * 5.0), uPortal);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.2 + aRand * 2.4) * uPix * (26.0 / max(1.0, -mv.z));
        vA = (1.0 - smoothstep(60.0, 150.0, -mv.z)) * smoothstep(0.5, 3.0, -mv.z);
        vR = aRand;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; varying float vA; varying float vR;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        vec3 c = mix(vec3(0.74, 0.9, 0.42), vec3(0.95), step(0.8, vR));
        gl_FragColor = vec4(c, smoothstep(0.5, 0.0, d) * vA * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

export function mkGrid(): THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> {
  const pts: number[] = [];
  for (let x = -36; x <= 36; x += 4) pts.push(x, -10, 40, x, -10, -300);
  for (let z = 40; z >= -300; z -= 8) pts.push(-36, -10, z, 36, -10, z);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xbde66a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
}

/** Giant faint screens lining the corridor: the dimension's architecture. */
export function mkArchitecture(U: SharedUniforms, T: TexMap): THREE.Group {
  const g = new THREE.Group();
  const keys: (ShotKey | FragmentKey)[] = ['sz', 'ph', 'ag', 'sz-collections', 'ph-space', 'ag-lines', 'sz-basketball', 'ph-doctor', 'ag-reach', 'ag-arabic'];
  keys.forEach((k, j) => {
    const side = j % 2 ? 1 : -1;
    const m = mkScreen(U, T[k], 14, 14 / aspectOf(T[k]), { bend: 0.4 });
    m.userData.base = new THREE.Vector3(side * (22 + (j % 3) * 3), ((j * 7) % 9) - 5, -20 - j * 24);
    m.userData.bob = Math.random() * Math.PI * 2;
    m.rotation.y = -side * 0.95;
    g.add(m);
  });
  return g;
}
