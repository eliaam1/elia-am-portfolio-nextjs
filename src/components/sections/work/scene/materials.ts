import * as THREE from 'three';

/** Uniforms shared by every screen: scroll velocity and time. */
export interface SharedUniforms {
  uVel: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
}

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const ramp = (u: number, t0: number, d: number): number => easeOutCubic(clamp01((u - t0) / d));
export const aspectOf = (t: THREE.Texture): number => {
  const img = t.image as { width: number; height: number };
  return img.width / img.height;
};

const SCREEN_VERT = /* glsl */ `
  uniform float uVel, uTime, uBend;
  varying vec2 vUv; varying float vDepth;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(uv.x * 3.14159) * uBend * (0.4 + uVel * 2.2);   // screens bow with scroll speed
    p.z += sin(uv.y * 7.0 + uTime * 1.6) * uVel * 0.22;         // and ripple a little
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const SCREEN_FRAG = /* glsl */ `
  uniform sampler2D map; uniform vec4 uRect; uniform float uOpacity, uFlash, uVel;
  varying vec2 vUv; varying float vDepth;
  void main() {
    vec2 uv = uRect.xy + vUv * uRect.zw;
    float s = uVel * 0.007;                                      // speed splits the channels
    vec3 c = vec3(texture2D(map, uv + vec2(s, 0.0)).r, texture2D(map, uv).g, texture2D(map, uv - vec2(s, 0.0)).b);
    c = mix(c, vec3(1.0), uFlash);
    float fog = 1.0 - smoothstep(42.0, 125.0, vDepth);
    gl_FragColor = vec4(mix(vec3(0.0015, 0.0018, 0.0015), c, fog), uOpacity * fog);
    #include <colorspace_fragment>
  }`;

export type ScreenMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

interface ScreenOptions {
  /** Sub-rectangle of the texture to show: x, y, width, height in UV space. */
  rect?: [number, number, number, number];
  bend?: number;
}

export function mkScreen(U: SharedUniforms, tex: THREE.Texture, w: number, h: number, { rect = [0, 0, 1, 1], bend = 0.22 }: ScreenOptions = {}): ScreenMesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: tex },
      uRect: { value: new THREE.Vector4(...rect) },
      uOpacity: { value: 0 },
      uFlash: { value: 0 },
      uBend: { value: bend },
      uVel: U.uVel,
      uTime: U.uTime,
    },
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    transparent: true,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h, 28, 18), mat);
}

export function mkPanel(w: number, h: number, color = 0x0c0e0d): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
}

export interface BrowserGroup extends THREE.Group {
  userData: { screen: ScreenMesh };
}

/** A browser window: dark frame with a bar and three dots, the screenshot inside. */
export function mkBrowser(U: SharedUniforms, tex: THREE.Texture, w: number): BrowserGroup {
  const h = w / aspectOf(tex);
  const g = new THREE.Group() as BrowserGroup;
  const frame = mkPanel(w + 0.24, h + 0.8);
  frame.position.set(0, 0.28, -0.03);
  const screen = mkScreen(U, tex, w, h);
  g.add(frame, screen);
  for (let k = 0; k < 3; k++) {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0x394139, transparent: true, opacity: 0 }));
    dot.position.set(-w / 2 + 0.35 + k * 0.3, h / 2 + 0.34, -0.01);
    g.add(dot);
  }
  g.userData = { screen };
  return g;
}

export function mkPhone(U: SharedUniforms, tex: THREE.Texture, w: number): THREE.Group {
  const h = w / aspectOf(tex);
  const g = new THREE.Group();
  const frame = mkPanel(w + 0.3, h + 0.3);
  frame.position.z = -0.03;
  g.add(frame, mkScreen(U, tex, w, h, { bend: 0.08 }));
  return g;
}

export function setOpacity(obj: THREE.Object3D, v: number): void {
  obj.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const mat = o.material as THREE.Material;
    if (mat instanceof THREE.ShaderMaterial) mat.uniforms.uOpacity.value = v;
    else mat.opacity = v;
  });
}

/* ---------------- glow and the beacon (opening light, final portal) ---------------- */
export function glowTexture(ring: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  if (x) {
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    if (ring) {
      g.addColorStop(0, 'rgba(189,230,106,0)');
      g.addColorStop(0.72, 'rgba(189,230,106,0)');
      g.addColorStop(0.8, 'rgba(189,230,106,.55)');
      g.addColorStop(0.9, 'rgba(189,230,106,0)');
    } else {
      g.addColorStop(0, 'rgba(236,255,190,1)');
      g.addColorStop(0.18, 'rgba(189,230,106,.75)');
      g.addColorStop(1, 'rgba(189,230,106,0)');
    }
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface Beacon extends THREE.Group {
  userData: { dot: THREE.Sprite; halo: THREE.Sprite; ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> };
}

/** The lime light that grows into a luminous ring. */
export function mkBeacon(dotTex: THREE.Texture, ringTex: THREE.Texture): Beacon {
  const g = new THREE.Group() as Beacon;
  const add = { blending: THREE.AdditiveBlending, transparent: true, depthWrite: false } as const;
  const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, ...add }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, ...add }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 12, 256), new THREE.MeshBasicMaterial({ color: 0xbde66a, ...add }));
  g.add(dot, halo, ring);
  g.userData = { dot, halo, ring };
  return g;
}

/** Ring radius in world units for a `ring` amount; also used to place the HTML text ring. */
export const beaconRadius = (ring: number): number => 0.05 + ring * 7.5;

export function setBeacon(b: Beacon, dot: number, ring: number): void {
  const { dot: d, halo, ring: r } = b.userData;
  d.scale.setScalar(0.001 + dot * 2.6 * (1 - ring * 0.7));
  d.material.opacity = dot * (1 - Math.min(1, ring) * 0.6);
  const R = beaconRadius(ring);
  r.scale.setScalar(R);
  r.material.opacity = Math.min(1, ring * 3);
  halo.scale.setScalar(R * 2.5);
  halo.material.opacity = Math.min(1, ring * 2.5);
  b.visible = dot + ring > 0.001;
}

/* ---------------- items: one entrance per object, plus fly-through and collapse ---------------- */
type Vec = [number, number, number];
interface Pose {
  p?: Vec;
  r?: Vec;
  s?: Vec;
}
interface ItemOptions {
  from?: Pose;
  to?: Pose;
  /** Start and length of the entrance, in the project's 0..1 sequence. */
  t0?: number;
  d?: number;
  /** Resting opacity. */
  op?: number;
  /** Main screens keep their place during the fly-through; everything else scatters. */
  keep?: boolean;
}
export interface ItemData {
  fromP: THREE.Vector3;
  toP: THREE.Vector3;
  fromR: THREE.Vector3;
  toR: THREE.Vector3;
  fromS: THREE.Vector3;
  toS: THREE.Vector3;
  t0: number;
  d: number;
  op: number;
  keep: boolean;
  dir: THREE.Vector3;
}

const v3 = (a: Vec): THREE.Vector3 => new THREE.Vector3(...a);
export const itemOf = (o: THREE.Object3D): ItemData | undefined => o.userData.it as ItemData | undefined;

export function item<T extends THREE.Object3D>(obj: T, { from = {}, to = {}, t0 = 0, d = 0.4, op = 1, keep = false }: ItemOptions): T {
  const toP = v3(to.p ?? [0, 0, 0]);
  const it: ItemData = {
    fromP: from.p ? v3(from.p) : toP.clone(),
    toP,
    fromR: v3(from.r ?? to.r ?? [0, 0, 0]),
    toR: v3(to.r ?? [0, 0, 0]),
    fromS: v3(from.s ?? to.s ?? [1, 1, 1]),
    toS: v3(to.s ?? [1, 1, 1]),
    t0,
    d,
    op,
    keep,
    dir: toP.clone().normalize(),
  };
  obj.userData.it = it;
  return obj;
}

const tmp = new THREE.Vector3();
export interface ItemFrame {
  u: number;
  fly: number;
  collapse: number;
  /** 0..1: collapsed screens fade as the portal opens. */
  fade: number;
}
export function applyItem(obj: THREE.Object3D, it: ItemData, { u, fly, collapse, fade }: ItemFrame): void {
  const a = ramp(u, it.t0, it.d);
  tmp.lerpVectors(it.fromP, it.toP, a);
  let op = a * it.op;
  if (!it.keep) {
    tmp.addScaledVector(it.dir, fly * (1 - collapse) * 9);
    op *= 1 - clamp01(fly * 1.8);
  }
  tmp.multiplyScalar(1 - collapse * 0.97);
  obj.position.copy(tmp);
  obj.rotation.set(lerp(it.fromR.x, it.toR.x, a), lerp(it.fromR.y, it.toR.y, a), lerp(it.fromR.z, it.toR.z, a));
  obj.scale.set(lerp(it.fromS.x, it.toS.x, a), lerp(it.fromS.y, it.toS.y, a), lerp(it.fromS.z, it.toS.z, a));
  setOpacity(obj, lerp(op, 0.85, clamp01(collapse * 4)) * (1 - fade));
}
