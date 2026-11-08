'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { getLenis } from '../../../lib/lenis';
import type { Dimension, Pointer } from './scene/createDimension';
import { COLLAPSE_DEPTH, DIM_TIMING, OPENING_EXIT_Z, PORTAL_DISTANCE, projectZ, SCREENS_PER_UNIT } from './scene/timing';
import { WORK_PROJECTS } from './workData';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const N = WORK_PROJECTS.length;
const TOTAL = DIM_TIMING.open + N * DIM_TIMING.seg + DIM_TIMING.end;
/** Lenis velocity (px per frame) that counts as "full speed" for the scene. */
const FULL_SPEED = 30;
/** Gap between the 3D portal ring and the HTML text ring around it (px). */
const RING_GAP = 26;

const pad2 = (n: number): string => String(n).padStart(2, '0');
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const all = (root: Element, sel: string): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(sel));

/** DOM-only amounts the timeline drives alongside the scene state. */
interface UiState {
  title: number;
  pass: number;
}
interface Splits {
  title: SplitText;
  names: SplitText[];
  portal: SplitText;
}

function makeSplits(root: HTMLElement): Splits {
  const title = SplitText.create(root.querySelector('.wd-title'), { type: 'chars', charsClass: 'wd-ch' });
  const names = all(root, '.wd-po-name').map((el) => SplitText.create(el, { type: 'chars', charsClass: 'wd-ch' }));
  const portal = SplitText.create(root.querySelector('.wd-portal-title'), { type: 'lines,chars', mask: 'lines', charsClass: 'wd-ch' });
  portal.masks.forEach((m) => {
    const mask = m as HTMLElement;
    mask.style.paddingBottom = '0.12em';
    mask.style.marginBottom = '-0.12em';
  });
  return { title, names, portal };
}

/** 1. A light, a ring, the title in layers, then forward through it. */
function openingBeats(tl: gsap.core.Timeline, dim: Dimension, ui: UiState, root: HTMLElement): void {
  const S = dim.state;
  const sub = root.querySelector('.wd-sub');
  tl.to(S, { dot: 1, duration: 0.3, ease: 'power2.out' }, 0)
    .to(S, { ring: 1, duration: 0.55, ease: 'power2.out' }, 0.22)
    .to(ui, { title: 1, duration: 0.5, ease: 'power2.out' }, 0.32)
    .to(sub, { opacity: 1, duration: 0.2 }, 0.62)
    .to(sub, { opacity: 0, duration: 0.15 }, 0.92)
    .to(S, { env: 1, duration: 0.6 }, 0.6)
    .to(ui, { pass: 1, duration: 0.55, ease: 'power2.in' }, 0.9)
    .to(S, { cz: OPENING_EXIT_Z, duration: 0.6, ease: 'power2.in' }, 0.9)
    .to(root.querySelector('.wd-hud'), { opacity: 1, duration: 0.2 }, 1.3);
}

/** 2-3. Each project: approach, entrance, info, slow orbit, then the fly-through. */
function projectBeats(tl: gsap.core.Timeline, dim: Dimension, root: HTMLElement, splits: Splits): void {
  const S = dim.state;
  const SEG = DIM_TIMING.seg;
  all(root, '.wd-po').forEach((po, i) => {
    const s = DIM_TIMING.open + i * SEG;
    const P = S.p[i];
    const z = projectZ(i);
    const rest = () => z + dim.layout().rest;
    tl.to(S, { cz: rest, duration: SEG * 0.32, ease: 'power2.out' }, s)
      .to(P, { in: 1, duration: SEG * 0.46 }, s + SEG * 0.02)
      .fromTo(S, { orbit: -0.2 }, { orbit: 0.2, duration: SEG * 0.43, immediateRender: false }, s + SEG * 0.32)
      .to(S, { cz: () => rest() - 3, duration: SEG * 0.43 }, s + SEG * 0.32)
      // the name enters character by character in 3D, each line from its own side
      .set(po, { visibility: 'visible', opacity: 1, y: 0 }, s + SEG * 0.26)
      .fromTo(all(po, '.wd-ln'), { x: (k: number) => (k % 2 ? 90 : -90), skewX: (k: number) => (k % 2 ? -12 : 12) }, { x: 0, skewX: 0, duration: SEG * 0.16, ease: 'power3.out', stagger: SEG * 0.03 }, s + SEG * 0.27)
      .fromTo(splits.names[i].chars, { rotationX: -95, yPercent: 60, z: -160, opacity: 0 }, { rotationX: 0, yPercent: 0, z: 0, opacity: 1, duration: SEG * 0.12, ease: 'power3.out', stagger: SEG * 0.006 }, s + SEG * 0.27)
      .fromTo(all(po, '.wd-meta, .wd-line, .wd-tag, .wd-btn'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: SEG * 0.08, stagger: SEG * 0.012, ease: 'power2.out' }, s + SEG * 0.33)
      .to(po, { opacity: 0, y: -30, duration: SEG * 0.06 }, s + SEG * 0.72)
      .set(po, { visibility: 'hidden' }, s + SEG * 0.78)
      // the screen turns to face you, fills the view, and you pass through it
      .to(S, { orbit: 0, duration: SEG * 0.12 }, s + SEG * 0.75)
      .to(P, { fly: 1, duration: SEG * 0.22, ease: 'power2.inOut' }, s + SEG * 0.75)
      .to(S, { cz: z - 1.5, duration: SEG * 0.25, ease: 'power3.in' }, s + SEG * 0.75);
  });
}

/** 4. The world collapses into light; the portal opens on the contact finale. */
function finaleBeats(tl: gsap.core.Timeline, dim: Dimension, root: HTMLElement, splits: Splits): void {
  const S = dim.state;
  const e = DIM_TIMING.open + N * DIM_TIMING.seg;
  const portalZ = projectZ(N - 1) - COLLAPSE_DEPTH;
  tl.to(S, { collapse: 1, duration: 0.75, ease: 'power2.inOut' }, e)
    .to(S, { cz: portalZ + PORTAL_DISTANCE, duration: 0.75, ease: 'power2.inOut' }, e)
    .to(root.querySelector('.wd-hud'), { opacity: 0, duration: 0.2 }, e + 0.4)
    .to(S, { portal: 1, duration: 0.55, ease: 'power2.out' }, e + 0.6)
    .set(root.querySelector('.wd-portal'), { visibility: 'visible' }, e + 0.78)
    .fromTo(root.querySelector('.wd-ring'), { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.86, rotation: -40 }, { xPercent: -50, yPercent: -50, opacity: 1, scale: 1, rotation: 0, duration: 0.35, ease: 'power3.out' }, e + 0.78)
    .fromTo(root.querySelector('.wd-pill'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: 'power2.out' }, e + 0.82)
    .fromTo(splits.portal.chars, { yPercent: 115, rotationX: -85, opacity: 0 }, { yPercent: 0, rotationX: 0, opacity: 1, duration: 0.3, stagger: 0.012, ease: 'power3.out' }, e + 0.86)
    .fromTo(all(root, '.wd-portal-sub, .wd-ctas > *'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, stagger: 0.05, ease: 'power2.out' }, e + 1.05)
    .to({}, { duration: 0.3 }, TOTAL - 0.3);
}

/** Mouse only: the scene follows the pointer, buttons are magnetic. Returns cleanup. */
function wirePointer(root: HTMLElement, pointer: Pointer): () => void {
  const target = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  const follow = () => {
    pointer.x += (target.x - pointer.x) * 0.05;
    pointer.y += (target.y - pointer.y) * 0.05;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  gsap.ticker.add(follow);
  const offs = all(root, '.wd-btn').map((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.4);
    };
    const leave = () => {
      mx(0);
      my(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  });
  return () => {
    window.removeEventListener('pointermove', onMove);
    gsap.ticker.remove(follow);
    offs.forEach((off) => off());
  };
}

/** Per-frame DOM: opening letters, the hud, and the text ring around the portal. */
function makeDomFrame(root: HTMLElement, dim: Dimension, ui: UiState, splits: Splits, st: ScrollTrigger): () => void {
  const letters = splits.title.chars.map((el) => ({ el: el as HTMLElement, d: Math.random() * 2 - 1, x: Math.random() - 0.5 }));
  const open = root.querySelector<HTMLElement>('.wd-open');
  const hudI = root.querySelector<HTMLElement>('[data-hud-i]');
  const hudN = root.querySelector<HTMLElement>('[data-hud-n]');
  const hudL = root.querySelector<HTMLElement>('[data-hud-l]');
  const ring = root.querySelector<HTMLElement>('.wd-ring');
  let lastK = -1;
  return () => {
    if (ui.pass < 1) {
      letters.forEach(({ el, d, x }) => {
        const z = (1 - ui.title) * (-1500 - d * 700) + d * 36 + ui.pass * (900 + d * 600);
        el.style.transform = `translate3d(${x * 2 * ui.pass * 260}px, 0, ${z}px)`;
        el.style.opacity = String(ui.title * (1 - clamp01((ui.pass - 0.35) / 0.5)));
      });
    }
    if (open) open.style.visibility = ui.pass >= 1 ? 'hidden' : 'visible';
    const k = dim.activeIndex();
    if (k !== lastK && hudI && hudN) {
      lastK = k;
      hudI.textContent = pad2(k + 1);
      hudN.textContent = WORK_PROJECTS[k].name;
    }
    if (hudL) hudL.style.transform = `scaleX(${st.progress})`;
    const r = dim.ringOnScreen();
    if (r && ring) {
      const size = Math.round((r.radius + RING_GAP) * 2);
      ring.style.width = ring.style.height = `${size}px`;
      ring.style.left = `${r.x}px`;
      ring.style.top = `${r.y}px`;
    }
  };
}

/** Builds the scroll timeline and render loop. Returns cleanup for what GSAP's context does not own. */
function start(root: HTMLElement, dim: Dimension, fine: boolean): () => void {
  const ui: UiState = { title: 0, pass: 0 };
  const splits = makeSplits(root);
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top top', end: `+=${TOTAL * SCREENS_PER_UNIT * 100}%`, pin: true, scrub: 1, anticipatePin: 1 },
  });
  openingBeats(tl, dim, ui, root);
  projectBeats(tl, dim, root, splits);
  finaleBeats(tl, dim, root, splits);

  // Everything registered below is undone in reverse, also if a later step throws.
  const offs: Array<() => void> = [];
  const stop = () => offs.splice(0).reverse().forEach((off) => off());
  try {
    const pointer: Pointer = { x: 0, y: 0 };
    if (fine) offs.push(wirePointer(root, pointer));
    const domFrame = makeDomFrame(root, dim, ui, splits, tl.scrollTrigger as ScrollTrigger);
    let running = true;
    let vel = 0;
    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
    });
    io.observe(root);
    offs.push(() => io.disconnect());
    // scroll velocity: particles stream faster, screens bow, the lens widens a touch
    const tick = () => {
      if (!running) return;
      const dt = Math.min(0.05, gsap.ticker.deltaRatio() / 60);
      const lenis = getLenis();
      vel += (clamp01(Math.abs(lenis ? lenis.velocity : 0) / FULL_SPEED) - vel) * 0.08;
      dim.frame(dt, vel, pointer);
      domFrame();
    };
    gsap.ticker.add(tick);
    offs.push(() => gsap.ticker.remove(tick));
    const onResize = () => dim.resize();
    window.addEventListener('resize', onResize);
    offs.push(() => window.removeEventListener('resize', onResize));
  } catch (err) {
    stop();
    throw err;
  }
  return stop;
}

/**
 * The Digital Dimension. The three.js scene loads on demand once motion is
 * allowed; until it is ready, or if WebGL fails, the section stays a plain
 * readable list. One scrubbed timeline drives both the scene and the HTML.
 */
export function useDimension(rootRef: RefObject<HTMLElement | null>, stageRef: RefObject<HTMLDivElement | null>): void {
  useGSAP(
    () => {
      const root = rootRef.current;
      const stage = stageRef.current;
      if (!root || !stage) return;
      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_OK, fine: FINE_POINTER }, (self) => {
        const { motion, fine } = self.conditions as { motion: boolean; fine: boolean };
        if (!motion) return;
        let cancelled = false;
        let dim: Dimension | null = null;
        let stop: (() => void) | null = null;
        // A fresh canvas per run: a disposed scene force-loses its context, so canvases are never reused.
        const canvas = document.createElement('canvas');
        canvas.className = 'wd-canvas';
        stage.appendChild(canvas);
        root.classList.add('is-live', 'is-loading');

        const teardown = () => {
          stop?.();
          stop = null;
          dim?.dispose();
          dim = null;
          canvas.remove();
          root.classList.remove('is-live', 'is-loading');
        };

        import('./scene/createDimension')
          .then(({ createDimension }) => createDimension(canvas, WORK_PROJECTS, () => cancelled))
          .then((created) => {
            if (!created) return; // cancelled while loading; it freed itself
            if (cancelled) {
              created.dispose();
              return;
            }
            dim = created;
            // inside this matchMedia context, so its revert kills the timeline, pin and splits
            self.add(() => {
              stop = start(root, created, fine);
            });
            root.classList.remove('is-loading');
            ScrollTrigger.refresh();
          })
          .catch(() => {
            // No WebGL, an image failed, or setup threw: free everything and keep the readable list.
            if (cancelled) return;
            teardown();
            ScrollTrigger.refresh();
          });

        return () => {
          cancelled = true;
          teardown();
          // the section is back to its list height; later sections' triggers must re-measure
          requestAnimationFrame(() => ScrollTrigger.refresh());
        };
      });
    },
    { scope: rootRef }
  );
}
