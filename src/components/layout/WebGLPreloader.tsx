'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { PRELOADER_CONFIG } from '../../config/motion';
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
  // x: wordmark scale, y: wordmark vertical offset (world units). Applied to
  // the target only, so the scatter cloud still fills the viewport on phones.
  uniform vec2 uFit;

  varying float vAlpha;

  void main() {
    float p = clamp(uProgress, 0.0, 1.0);

    // Cubic ease-out so points arrive decisively instead of creeping in.
    float e = 1.0 - pow(1.0 - p, 3.0);

    // Per-point offset staggers arrival across the cloud.
    float staggered = clamp((e - aSeed * 0.25) / 0.75, 0.0, 1.0);

    vec3 target = position * uFit.x + vec3(0.0, uFit.y, 0.0);
    vec3 pos = mix(aScatter, target, staggered);

    // Idle drift keeps the settled wordmark alive rather than frozen. Scaled
    // with the wordmark, or on a phone it smears glyphs a quarter the size.
    pos.x += sin(uTime * 0.6 + aSeed * 12.0) * 0.015 * uFit.x * staggered;
    pos.y += cos(uTime * 0.5 + aSeed * 9.0) * 0.015 * uFit.x * staggered;

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

/** Unscaled wordmark width in world units; height follows the line count. */
const WORDMARK_WORLD_WIDTH = 11;
const SAMPLE_W = 1024;
const SAMPLE_LINE_H = 256;

/**
 * Portrait viewports stack the name, so it can be read at a useful size on a
 * phone instead of being shrunk to a hairline (or, as before, overflowing
 * both edges of the screen).
 */
const STACK_BELOW_ASPECT = 0.8;
const wordmarkLines = (aspect: number): string[] =>
  aspect < STACK_BELOW_ASPECT ? WORDMARK.split(' ') : [WORDMARK];

interface WordmarkTargets {
  points: Float32Array;
  /** World-space height of the unscaled wordmark (width is WORDMARK_WORLD_WIDTH). */
  height: number;
}

/**
 * Sample glyph coverage of the wordmark into world-space points; `countFor`
 * picks how many from the measured ink coverage.
 *
 * Returns null when the rasterised text yields too few opaque pixels to
 * fill the cloud, which happens if the font stack resolves to something
 * unexpected. Callers fall back to the lattice so the loader never renders
 * a half-empty cloud.
 */
function sampleWordmarkPoints(
  lines: string[],
  countFor: (inkFraction: number) => number
): WordmarkTargets | null {
  const canvas = document.createElement('canvas');
  const W = SAMPLE_W;
  const H = SAMPLE_LINE_H * lines.length;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shrink until the widest line fits the sampling canvas.
  let fontSize = 200;
  const maxWidth = W * 0.92;
  const widest = () => Math.max(...lines.map((line) => ctx.measureText(line).width));
  ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
  while (widest() > maxWidth && fontSize > 12) {
    fontSize -= 4;
    ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
  }

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, SAMPLE_LINE_H * (i + 0.5));
  });

  const { data } = ctx.getImageData(0, 0, W, H);
  const candidates: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) candidates.push(x, y);
    }
  }

  const available = candidates.length / 2;
  // Share of the sampled box covered by glyph strokes, so the caller can
  // size the cloud to the ink actually drawn rather than to the bounding box.
  const count = countFor(available / ((W / 2) * (H / 2)));
  if (available < count * 0.5) return null;

  const height = (WORDMARK_WORLD_WIDTH * H) / W;
  const out = new Float32Array(count * 3);
  // Stratified, not uniform-random: candidates are in scan order, so one
  // pick per equal slice covers every stroke evenly. Pure random sampling
  // clumps and leaves holes, which is what made small glyphs unreadable.
  const stride = available / count;
  for (let i = 0; i < count; i++) {
    const j = Math.min(available - 1, Math.floor((i + Math.random()) * stride));
    out[i * 3] = (candidates[j * 2] / W - 0.5) * WORDMARK_WORLD_WIDTH;
    out[i * 3 + 1] = -(candidates[j * 2 + 1] / H - 0.5) * height;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return { points: out, height };
}

/** Even lattice, used when glyph sampling is unavailable. */
function latticePoints(count: number): WordmarkTargets {
  const height = (WORDMARK_WORLD_WIDTH * SAMPLE_LINE_H) / SAMPLE_W;
  const out = new Float32Array(count * 3);
  const cols = Math.ceil(Math.sqrt(count * 4));
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    out[i * 3] = (cx / Math.max(cols - 1, 1) - 0.5) * WORDMARK_WORLD_WIDTH;
    out[i * 3 + 1] = (cy / Math.max(rows - 1, 1) - 0.5) * height;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return { points: out, height };
}

/** Fraction of the viewport width the wordmark may occupy. */
const FIT_MAX_WIDTH = 0.86;
/** Gap between the wordmark and the counter below it, and the top margin (px). */
const FIT_GAP_PX = 28;
const FIT_TOP_MIN_PX = 24;

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
  const nameRef = useRef<HTMLSpanElement>(null);

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
      let wordmarkHeight = 0;
      let layoutKey = '';

      /*
       * Fit the wordmark to the viewport and seat it above the counter.
       *
       * Previously it was a fixed 11 world units wide, which at camera z=8
       * only fits a landscape viewport: a portrait phone shows ~3.4 units,
       * so the name ran off both edges and sat underneath the counter.
       * Working in CSS pixels lets the counter's real rect set the limit.
       */
      const measureFit = () => {
        if (!camera || !counterRef.current) return null;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const visibleH =
          2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const pxPerWorld = vh / visibleH;

        const counterTop = counterRef.current.getBoundingClientRect().top;
        const topMargin = Math.max(FIT_TOP_MIN_PX, vh * 0.06);
        const availH = Math.max(counterTop - FIT_GAP_PX - topMargin, 0);

        const scale = Math.min(
          1,
          (vw * FIT_MAX_WIDTH) / (WORDMARK_WORLD_WIDTH * pxPerWorld),
          availH / (wordmarkHeight * pxPerWorld)
        );

        const centerPx = counterTop - FIT_GAP_PX - (wordmarkHeight * scale * pxPerWorld) / 2;
        return { scale, y: (vh / 2 - centerPx) / pxPerWorld, pxPerWorld };
      };

      const fitWordmark = () => {
        const fit = measureFit();
        if (fit && material) material.uniforms.uFit.value.set(fit.scale, fit.y);
      };

      /*
       * Particle count from legibility, not from a width breakpoint.
       *
       * A glyph needs a minimum number of dots to read at all, however small
       * it is drawn — the old flat 1200 on phones gave ~80 per letter and the
       * name dissolved into noise. Large stacked glyphs (tablets) additionally
       * need enough dots to keep the desktop's density. Cost is irrelevant at
       * this scale: a few thousand points, rendered for about a second.
       */
      const particleCountFor = (lines: string[], inkFraction: number): number => {
        const letters = lines.join('').replace(/ /g, '').length;
        const fit = measureFit();
        const inkPx = fit
          ? WORDMARK_WORLD_WIDTH * wordmarkHeight * (fit.scale * fit.pxPerWorld) ** 2 * inkFraction
          : 0;
        const wanted = Math.max(
          letters * PRELOADER_CONFIG.dotsPerLetter,
          inkPx * PRELOADER_CONFIG.inkDensity
        );
        return Math.round(
          Math.min(PRELOADER_CONFIG.maxParticles, Math.max(PRELOADER_CONFIG.particleCount, wanted))
        );
      };

      if (useWebGL) {
        const canvas = canvasRef.current as HTMLCanvasElement;

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

          const lines = wordmarkLines(camera.aspect);
          layoutKey = lines.join('|');
          // Provisional height (the sampled layout) so the count can be
          // derived from the fitted size before any points exist.
          wordmarkHeight = (WORDMARK_WORLD_WIDTH * SAMPLE_LINE_H * lines.length) / SAMPLE_W;
          const targets =
            sampleWordmarkPoints(lines, (ink) => particleCountFor(lines, ink)) ??
            latticePoints(PRELOADER_CONFIG.particleCount);
          wordmarkHeight = targets.height;
          const count = targets.points.length / 3;

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
          geometry.setAttribute('position', new THREE.BufferAttribute(targets.points, 3));
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
              uFit: { value: new THREE.Vector2(1, 0) },
            },
          });

          scene.add(new THREE.Points(geometry, material));

          // The particles spell the name, so the DOM copy would only
          // duplicate it. It stays as the no-WebGL fallback.
          if (nameRef.current) nameRef.current.style.display = 'none';
          fitWordmark();
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

        // Rotation can cross the stacking threshold: resample the glyphs.
        const lines = wordmarkLines(camera.aspect);
        if (geometry && lines.join('|') !== layoutKey) {
          layoutKey = lines.join('|');
          const count = geometry.getAttribute('position').count;
          const targets = sampleWordmarkPoints(lines, () => count) ?? latticePoints(count);
          wordmarkHeight = targets.height;
          geometry.setAttribute('position', new THREE.BufferAttribute(targets.points, 3));
        }
        fitWordmark();
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
        {/* Fallback for reduced motion / no WebGL. When the particle cloud
            runs it spells the name itself and this is hidden from JS. */}
        <span
          ref={nameRef}
          className="text-[11px] font-mono font-bold uppercase tracking-[0.42em] text-app-text-secondary"
        >
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
