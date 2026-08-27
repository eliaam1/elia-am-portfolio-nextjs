'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { WEBGL_AMBIENT_BREAKPOINT, PRELOADER_CONFIG } from '../../config/motion';
import { PRELOAD_MIN_MS } from '../../config/constants';
import { markPreloadComplete, isPreloadPending } from '../../lib/preload';
import { getLenis } from '../../lib/lenis';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const WORDMARK = 'ELIA ABDEL MASSIH';

/* ------------------------------------------------------------------ *
 * Shaders
 *
 * `position` holds the TARGET position (the sampled wordmark) and
 * `aScatter` holds where the point starts. Interpolating between two
 * attributes on the GPU means the assemble costs nothing per frame on the
 * main thread — which matters, because this animation plays during the
 * single busiest moment of the page lifecycle.
 * ------------------------------------------------------------------ */

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aSeed;

  uniform float uProgress;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTime;

  varying float vAlpha;

  void main() {
    float p = clamp(uProgress, 0.0, 1.0);

    // Cubic ease-out so points arrive decisively instead of creeping in.
    float e = 1.0 - pow(1.0 - p, 3.0);

    // Per-point offset staggers arrival across the cloud.
    float staggered = clamp((e - aSeed * 0.25) / 0.75, 0.0, 1.0);

    vec3 pos = mix(aScatter, position, staggered);

    // Idle drift keeps the settled wordmark alive rather than frozen.
    pos.x += sin(uTime * 0.6 + aSeed * 12.0) * 0.015 * staggered;
    pos.y += cos(uTime * 0.5 + aSeed * 9.0) * 0.015 * staggered;

    // uProgress above 1 is the exit: push every point radially outward.
    float d = max(uProgress - 1.0, 0.0);
    pos += normalize(aScatter + vec3(0.001)) * d * 9.0;

    vAlpha = (1.0 - d) * (0.15 + 0.85 * staggered);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (3.0 / max(-mv.z, 0.001));
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // Round points. A square point sprite reads as debris, not as light.
    vec2 uv = gl_PointCoord - vec2(0.5);
    if (dot(uv, uv) > 0.25) discard;
    gl_FragColor = vec4(uColor, clamp(vAlpha, 0.0, 1.0));
  }
`;

/**
 * Sample glyph coverage of the wordmark into `count` world-space points.
 *
 * Returns null when the rasterised text yields too few opaque pixels to
 * fill the cloud, which happens if the font stack resolves to something
 * unexpected. Callers fall back to the lattice so the loader never renders
 * a half-empty cloud.
 */
function sampleWordmarkPoints(text: string, count: number): Float32Array | null {
  const canvas = document.createElement('canvas');
  const W = 1024;
  const H = 256;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shrink until the wordmark fits the sampling canvas.
  let fontSize = 160;
  const maxWidth = W * 0.92;
  ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && fontSize > 12) {
    fontSize -= 4;
    ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
  }

  ctx.fillText(text, W / 2, H / 2);

  const { data } = ctx.getImageData(0, 0, W, H);
  const candidates: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) candidates.push(x, y);
    }
  }

  const available = candidates.length / 2;
  if (available < count * 0.5) return null;

  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const j = Math.floor(Math.random() * available);
    out[i * 3] = (candidates[j * 2] / W - 0.5) * 11;
    out[i * 3 + 1] = -(candidates[j * 2 + 1] / H - 0.5) * 2.75;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return out;
}

/** Even lattice, used when glyph sampling is unavailable. */
function latticePoints(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const cols = Math.ceil(Math.sqrt(count * 4));
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    out[i * 3] = (cx / Math.max(cols - 1, 1) - 0.5) * 11;
    out[i * 3 + 1] = (cy / Math.max(rows - 1, 1) - 0.5) * 2.75;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return out;
}

/**
 * WebGLPreloader
 *
 * Replaces the previous Preloader, which had two defects beyond styling:
 *
 *   1. It began at `useState(false)`, so the server rendered NO overlay.
 *      The hero necessarily painted first, then the overlay mounted over
 *      it, then the hero animated. That is the reported hero/loader/hero
 *      ordering, and no amount of styling could have fixed it.
 *   2. Its duration was a fixed 1000ms timer unrelated to whether anything
 *      had actually loaded, so it could lift mid-font-swap.
 *
 * Here the overlay is present in the server HTML and hidden purely by CSS
 * keyed off the `data-preload` attribute that a blocking inline script in
 * layout.tsx sets before first paint. Progress is measured from real work
 * — font loading, hero image decode, window load — floored by
 * PRELOAD_MIN_MS so a warm cache does not produce a flash.
 *
 * Invariants:
 *   - I1: nothing here gates content visibility. The default CSS state (no
 *     attribute) hides the overlay entirely, and layout.tsx carries a
 *     failsafe timeout, so the page cannot stay covered.
 *   - I2: the WebGL context, the ticker callback and every listener are
 *     torn down in the useGSAP cleanup.
 *   - I3: WebGL is desktop-only and skipped under reduced motion; those
 *     visitors get the counter and curtain without a GPU context.
 */
export const WebGLPreloader: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      // Repeat view in this session: the overlay is already display:none.
      // Do not build a WebGL context for something nobody will see.
      if (!isPreloadPending()) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // No width gate: this is one-shot WebGL. It builds, plays once and
      // disposes, so a phone never carries a standing render loop for it.
      // Only the particle count scales.
      const isWide = window.matchMedia(`(min-width: ${WEBGL_AMBIENT_BREAKPOINT}px)`).matches;
      const useWebGL = !prefersReduced && !!canvasRef.current;

      /* ---------------------------------------------------------- *
       * Progress model
       *
       * targetProgress is the MINIMUM of asset completion and elapsed
       * time, so it can only reach 1 once the real work is done AND the
       * floor has passed. Taking the minimum rather than a blend means it
       * never overstates readiness.
       * ---------------------------------------------------------- */
      const startedAt = performance.now();
      let assetsDone = 0;
      let assetsTotal = 0;
      let released = false;

      const track = (promise: Promise<unknown>) => {
        assetsTotal += 1;
        const settle = () => {
          assetsDone += 1;
        };
        // A failed font or image must not wedge the loader, so rejection
        // counts as completion.
        promise.then(settle, settle);
      };

      track(
        typeof document !== 'undefined' && 'fonts' in document
          ? document.fonts.ready
          : Promise.resolve()
      );

      track(
        document.readyState === 'complete'
          ? Promise.resolve()
          : new Promise<void>((resolve) =>
              window.addEventListener('load', () => resolve(), { once: true })
            )
      );

      const heroImages = Array.from(
        document.querySelectorAll<HTMLImageElement>('#hero img')
      );
      heroImages.forEach((img) => {
        track(
          img.complete
            ? Promise.resolve()
            : img.decode().catch(
                () =>
                  new Promise<void>((resolve) => {
                    img.addEventListener('load', () => resolve(), { once: true });
                    img.addEventListener('error', () => resolve(), { once: true });
                  })
              )
        );
      });

      const readTarget = () => {
        const byTime = (performance.now() - startedAt) / PRELOAD_MIN_MS;
        const byAssets = assetsTotal === 0 ? 1 : assetsDone / assetsTotal;
        return Math.max(0, Math.min(1, Math.min(byTime, byAssets)));
      };

      /* ---------------------------------------------------------- *
       * WebGL cloud
       * ---------------------------------------------------------- */
      let renderer: THREE.WebGLRenderer | null = null;
      let geometry: THREE.BufferGeometry | null = null;
      let material: THREE.ShaderMaterial | null = null;
      let scene: THREE.Scene | null = null;
      let camera: THREE.PerspectiveCamera | null = null;

      if (useWebGL) {
        const canvas = canvasRef.current as HTMLCanvasElement;
        const count = isWide
          ? PRELOADER_CONFIG.particleCount
          : PRELOADER_CONFIG.particleCountNarrow;

        try {
          renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: 'low-power',
          });
        } catch {
          // No WebGL available. The DOM counter and curtain still carry it.
          renderer = null;
        }

        if (renderer) {
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          renderer.setClearColor(0x000000, 0);

          scene = new THREE.Scene();
          camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100
          );
          camera.position.z = 8;

          const targets = sampleWordmarkPoints(WORDMARK, count) ?? latticePoints(count);

          const scatter = new Float32Array(count * 3);
          const seeds = new Float32Array(count);
          for (let i = 0; i < count; i++) {
            // Random direction on a sphere shell, so the cloud reads as a
            // volume rather than as a flat ring.
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = PRELOADER_CONFIG.scatterRadius * (0.55 + Math.random() * 0.45);
            scatter[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            scatter[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            scatter[i * 3 + 2] = r * Math.cos(phi) * 0.5;
            seeds[i] = Math.random();
          }

          geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(targets, 3));
          geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
          geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

          material = new THREE.ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            uniforms: {
              uProgress: { value: 0 },
              uSize: { value: PRELOADER_CONFIG.pointSize },
              uPixelRatio: { value: pixelRatio },
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(0x0f3dde) },
            },
          });

          scene.add(new THREE.Points(geometry, material));
        }
      }

      /* ---------------------------------------------------------- *
       * Exit
       * ---------------------------------------------------------- */
      const finish = () => {
        markPreloadComplete();

        // Lenis measured the document while html/body were overflow:hidden,
        // so it believes the page has no scrollable height. Re-measure now
        // that the lock is lifted, then let ScrollTrigger recompute every
        // start/end against the real height.
        getLenis()?.resize();
        ScrollTrigger.refresh();
      };

      const release = () => {
        if (released) return;
        released = true;
        gsap.ticker.remove(frame);

        if (counterRef.current) counterRef.current.textContent = '100';
        if (barRef.current) barRef.current.style.transform = 'scaleX(1)';

        if (prefersReduced) {
          gsap.to(root, {
            autoAlpha: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: finish,
          });
          return;
        }

        const exit = gsap.timeline({ onComplete: finish });

        if (material) {
          // Disperse: uProgress past 1 drives the radial push in the shader.
          exit.to(
            material.uniforms.uProgress,
            { value: 2, duration: PRELOADER_CONFIG.exitDuration, ease: 'power2.in' },
            0
          );
        }

        if (wordmarkRef.current) {
          exit.to(
            wordmarkRef.current,
            { yPercent: -110, opacity: 0, duration: 0.5, ease: 'expo.in' },
            0
          );
        }

        // Curtain wipes upward, revealing a hero that is already in place.
        exit.to(
          root,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: PRELOADER_CONFIG.exitDuration,
            ease: 'expo.inOut',
          },
          0.12
        );
      };

      /* ---------------------------------------------------------- *
       * Frame loop — one gsap.ticker callback, shared with Lenis.
       * ---------------------------------------------------------- */
      let shown = 0;

      const frame = (time: number) => {
        if (released) return;

        const target = readTarget();
        shown += (target - shown) * PRELOADER_CONFIG.counterLerp;

        const pct = Math.min(100, Math.round(shown * 100));
        if (counterRef.current) {
          counterRef.current.textContent = String(pct).padStart(3, '0');
        }
        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${shown.toFixed(4)})`;
        }

        if (material && renderer && scene && camera) {
          material.uniforms.uProgress.value = shown;
          material.uniforms.uTime.value = time;
          renderer.render(scene, camera);
        }

        // Release once the counter has visually caught up, not merely when
        // the underlying work finished — otherwise the number jumps from
        // eighty-something straight to gone.
        if (target >= 1 && shown > 0.995) {
          release();
        }
      };

      const handleResize = () => {
        if (!renderer || !camera) return;
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };

      gsap.ticker.add(frame);
      window.addEventListener('resize', handleResize, { passive: true });

      return () => {
        gsap.ticker.remove(frame);
        window.removeEventListener('resize', handleResize);
        geometry?.dispose();
        material?.dispose();
        renderer?.dispose();
        renderer?.forceContextLoss();
      };
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className="preloader-root fixed inset-0 z-[10000] flex-col items-center justify-center bg-app-bg"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      role="status"
      aria-label="Loading"
    >
      {/* Particle stage. Only initialised on desktop; the effect no-ops elsewhere. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <div
        ref={wordmarkRef}
        className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
      >
        {/* On desktop the particles spell this out, so the DOM copy stays
            hidden there and leads on mobile, where there is no cloud. */}
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.42em] text-app-text-secondary lg:opacity-0">
          Elia Abdel Massih
        </span>

        {/* aria-hidden: this ticks every frame, so announcing it would
            spam a screen reader. The status role above carries the state. */}
        <span
          ref={counterRef}
          aria-hidden="true"
          className="font-mono text-6xl font-black tabular-nums leading-none tracking-tighter text-app-text-primary sm:text-7xl"
        >
          000
        </span>

        {/* scaleX on a pre-sized rule: a GPU transform, never a width tween. */}
        <span className="relative block h-px w-[min(260px,60vw)] overflow-hidden bg-app-border">
          <span
            ref={barRef}
            className="absolute inset-0 block origin-left bg-app-accent"
            style={{ transform: 'scaleX(0)' }}
          />
        </span>
      </div>
    </div>
  );
};

export default WebGLPreloader;
