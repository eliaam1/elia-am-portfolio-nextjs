'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { FADE_UP, rebuildOnReflow, riseTitle } from '../../../lib/rise';
import { STACK } from './stackData';
import { all, barWipe, countUp, lightTool, magnets, placeMarks, runLog, wireFan, wireTools, type RunLog } from './posterFx';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
/** Desktop with a mouse: the section holds while the posters stack. Everything else scrolls natively. */
const PIN_OK = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
/** Timeline units: a poster's hold, extra hold on the last one for the run log, scroll per unit (% of viewport). */
const HOLD = 0.5;
const RUN = 0.7;
const SCROLL_PER_UNIT = 48;
const PICTURES = '.pic';
const BOXES = STACK.map((n) => n.scribble.box);
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** A poster's entrance; `d` stretches or compresses it. Splits are reverted by the owning context. */
function entrance(pn: HTMLElement, tl: gsap.core.Timeline, t0: number, d: number): void {
  const q = (sel: string) => all(pn, sel);
  // movyo: the headline's letters rise out of their line masks with a slight tilt
  const split = SplitText.create(pn.querySelector('.pn-h'), { type: 'lines,chars', mask: 'lines' });
  split.masks.forEach((m) => gsap.set(m, { paddingBottom: '.18em', marginBottom: '-.18em' }));
  tl.from(split.chars, { yPercent: 115, rotate: 6, stagger: 0.016 * d, duration: 0.7 * d, ease: 'expo.out' }, t0)
    .from(q('.pn-eye, .hint-c'), { y: 20, autoAlpha: 0, stagger: 0.06 * d, duration: 0.35 * d, ease: 'power3.out' }, t0 + 0.1 * d)
    // movyo's stamp: the sticker slams down from above
    .from(q('.stk'), { scale: 2.4, rotation: '+=18', autoAlpha: 0, duration: 0.4 * d, ease: 'power4.in' }, t0 + 0.2 * d)
    .fromTo(q('.mark path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.15 * d, duration: 0.45 * d, ease: 'power2.inOut' }, t0 + 0.5 * d)
    .from(q('.bt .tk'), { y: 18, autoAlpha: 0, stagger: 0.04 * d, duration: 0.3 * d, ease: 'power2.out' }, t0 + 0.3 * d)
    // movyo: the picture opens upward in a rounded frame (oversized, so nothing gets cropped)
    .fromTo(q(PICTURES), { clipPath: 'inset(100% -30% -30% -30% round 28px)' }, { clipPath: 'inset(-30% -30% -30% -30% round 28px)', duration: 0.8 * d, ease: 'expo.inOut' }, t0 + 0.05 * d);
  const out = pn.querySelector<HTMLElement>('.pn-out');
  if (out) barWipe(out, tl, t0 + 0.35 * d, d);
  q('.cnt').forEach((c) => countUp(c, tl, t0 + 0.6 * d, d));
  pictureEntrance(pn, tl, t0, d);
}

/** Each picture's own arrival. */
function pictureEntrance(pn: HTMLElement, tl: gsap.core.Timeline, t0: number, d: number): void {
  const q = (sel: string) => all(pn, sel);
  if (pn.classList.contains('pn-web')) {
    tl.from(q('.ex-l'), { autoAlpha: 0, y: (k: number) => 60 + k * 30, stagger: 0.1 * d, duration: 0.5 * d, ease: 'power3.out' }, t0 + 0.1 * d)
      .from(q('.ex-cap'), { x: 24, autoAlpha: 0, stagger: 0.08 * d, duration: 0.35 * d }, t0 + 0.35 * d);
  } else if (pn.classList.contains('pn-store')) {
    tl.from(q('.story .ph'), { y: 80, rotationY: -20, transformPerspective: 900, autoAlpha: 0, stagger: 0.12 * d, duration: 0.5 * d, ease: 'power3.out' }, t0 + 0.1 * d)
      .from(q('.story-n'), { autoAlpha: 0, y: 10, stagger: 0.12 * d, duration: 0.3 * d }, t0 + 0.2 * d)
      // yPercent, not y: the scroll drift owns the toast's y
      .from(q('.toast'), { yPercent: 40, scale: 0.9, autoAlpha: 0, duration: 0.35 * d, ease: 'back.out(2)' }, t0 + 0.55 * d);
  } else if (pn.classList.contains('pn-apps')) {
    tl.fromTo(q('.col'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', stagger: 0.12 * d, duration: 0.45 * d, ease: 'power3.inOut' }, t0 + 0.1 * d)
      .from(q('.map-ln'), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.12 * d, duration: 0.3 * d }, t0 + 0.4 * d)
      .from(q('.api p, .tbl2 div'), { x: -10, autoAlpha: 0, stagger: 0.04 * d, duration: 0.25 * d }, t0 + 0.35 * d);
  } else {
    tl.from(q('.log li'), { x: -20, autoAlpha: 0, stagger: 0.07 * d, duration: 0.3 * d, ease: 'power2.out' }, t0 + 0.1 * d)
      .from(q('.wa > *'), { y: 16, autoAlpha: 0, stagger: 0.12 * d, duration: 0.3 * d }, t0 + 0.2 * d);
  }
}

/** Scroll-linked depth while a poster is on top: layers move at their own speeds, no easing. */
function drift(pn: HTMLElement, tl: gsap.core.Timeline, t0: number, d: number): void {
  const add = (sel: string, vars: gsap.TweenVars) => {
    const els = all(pn, sel);
    if (els.length) tl.to(els, { ...vars, duration: d, ease: 'none' }, t0);
  };
  add('.ex-wire', { z: -50 });
  add('.ex-site', { z: 60 });
  add('.ex-motion', { z: 170 });
  add('.ex-site .site', { yPercent: -16 });
  add('.sp-a', { y: -20 });
  add('.sp-b', { y: -44 });
  add('.sp-c', { y: -28 });
  add('.toast', { y: -60 });
  add('.col-ph .ph:last-child', { y: -18 });
}

/* ---------- desktop: the posters stack; each rises over the last, which sinks back ---------- */
function buildPinned(root: HTMLElement, log: RunLog | null): () => void {
  const stage = root.querySelector<HTMLElement>('.skp-stage');
  const pns = all(root, '.pn');
  if (!stage || pns.length < 2) return () => undefined;
  root.classList.add('is-pin');
  const n = pns.length;
  const startOf = (k: number) => HOLD + (k - 1) * (1 + HOLD);
  pns.forEach((p, k) => {
    p.style.zIndex = String(k + 1);
    if (k) gsap.set(p, { yPercent: 102 });
  });
  gsap.set(all(root, '.ex-site'), { z: 30 });
  gsap.set(all(root, '.ex-motion'), { z: 90 });
  const { mark, current, reset } = progressMarker(root, pns);
  const total = HOLD + (n - 1) * (1 + HOLD) + RUN;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: stage, start: 'top top', end: () => `+=${total * SCROLL_PER_UNIT}%`, pin: true, scrub: true, invalidateOnRefresh: true },
  });
  tl.eventCallback('onUpdate', () => {
    let k = 0;
    for (let j = 1; j < n; j++) if (tl.time() >= startOf(j) + 0.5) k = j;
    mark(k);
  });
  drift(pns[0], tl, 0, HOLD);
  for (let k = 1; k < n; k++) stackStep(tl, pns[k - 1], pns[k], startOf(k));
  // the run log plays through on the last poster, step by step, with the scroll
  if (log) {
    log.start();
    const run = { p: 0 };
    tl.to(run, { p: 1, duration: HOLD + RUN - 0.1, onUpdate: () => log.runTo(run.p) }, startOf(n - 1) + 1.1);
  }
  const first = gsap.timeline({ paused: true });
  entrance(pns[0], first, 0, 1.6);
  ScrollTrigger.create({ trigger: stage, start: 'top 75%', once: true, onEnter: () => void first.play() });
  const offPointer = wirePointer(root, stage, current);
  return () => {
    offPointer();
    log?.stop();
    reset();
    resetCounts(root);
    root.classList.remove('is-pin');
    pns.forEach((p) => p.style.removeProperty('z-index'));
  };
}

/** Counters are written as text while they run: put the final figures back on teardown. */
function resetCounts(root: HTMLElement): void {
  all(root, '.cnt').forEach((c) => {
    c.textContent = `${c.dataset.pre ?? ''}${c.dataset.to ?? ''}`;
  });
}

/** One step of the stack: `next` rises over `prev` with an arched edge, `prev` sinks back. */
function stackStep(tl: gsap.core.Timeline, prev: HTMLElement, next: HTMLElement, t0: number): void {
  tl.to(next, { yPercent: 0, duration: 0.8 }, t0)
    // Lando's curtain: the poster rises with an arched top that flattens as it lands
    .fromTo(next, { clipPath: 'ellipse(70% 100% at 50% 100%)' }, { clipPath: 'ellipse(240% 170% at 50% 100%)', duration: 0.8, ease: 'power2.in' }, t0)
    .to(prev.querySelector('.pn-in'), { scale: 0.94, rotationX: 4, y: -10, transformPerspective: 1600, duration: 0.8 }, t0)
    .to(prev.querySelector('.pn-shade'), { opacity: 0.55, duration: 0.8 }, t0)
    // the picture travels further than its poster: depth
    .from(all(next, PICTURES), { y: 140, duration: 0.8 }, t0);
  // compressed so every reveal has finished by the time the poster settles
  entrance(next, tl, t0 + 0.4, 0.6);
  drift(next, tl, t0 + 1, HOLD);
}

/**
 * The 01 / 04 pill, and keyboard reach: only the poster on top keeps its tool
 * buttons in the tab order. The covered posters stay in the accessibility tree
 * (screen readers read every heading); they just cannot take focus.
 */
function progressMarker(root: HTMLElement, pns: HTMLElement[]): { mark: (k: number) => void; current: () => number; reset: () => void } {
  const num = root.querySelector<HTMLElement>('[data-fn]');
  const lab = root.querySelector<HTMLElement>('[data-fl]');
  const reach = (k: number) => pns.forEach((p, j) => all(p, 'button[data-tech]').forEach((b) => (b.tabIndex = j === k ? 0 : -1)));
  const write = (k: number) => {
    if (num) num.textContent = pad2(k + 1);
    if (lab) lab.textContent = STACK[k].short;
  };
  let cur = 0;
  write(0); // the DOM may still show a previous build's poster
  reach(0);
  return {
    current: () => cur,
    mark: (k) => {
      if (k === cur) return;
      cur = k;
      reach(k);
      write(k);
      gsap.fromTo([num, lab], { yPercent: 110 }, { yPercent: 0, stagger: 0.04, duration: 0.45, ease: 'power3.out', overwrite: true });
    },
    reset: () => {
      gsap.killTweensOf([num, lab]);
      gsap.set([num, lab], { clearProps: 'transform' });
      write(0);
      pns.forEach((p) => all(p, 'button[data-tech]').forEach((b) => b.removeAttribute('tabindex')));
    },
  };
}

/** Mouse only: the exploded site turns toward the cursor, the top sticker is magnetic, the phones fan. */
function wirePointer(root: HTMLElement, stage: HTMLElement, current: () => number): () => void {
  const ex = all(root, '.ex-stack');
  gsap.set(ex, { rotationX: 56, rotationZ: -36 });
  const rz = gsap.quickTo(ex, 'rotationZ', { duration: 1, ease: 'power3' });
  const rx = gsap.quickTo(ex, 'rotationX', { duration: 1, ease: 'power3' });
  const pull = magnets(all(root, '.stk'), current);
  const lean = (e: PointerEvent) => {
    if (current() === 0) {
      rz(-36 + (e.clientX / window.innerWidth - 0.5) * 10);
      rx(56 - (e.clientY / window.innerHeight - 0.5) * 8);
    }
    pull.move(e);
  };
  stage.addEventListener('pointermove', lean);
  const offFan = wireFan(root);
  return () => {
    stage.removeEventListener('pointermove', lean);
    pull.stop();
    offFan();
  };
}

/* ---------- touch screens and narrow windows: the same posters stack as you scroll (sticky, native) ---------- */
function buildFlow(root: HTMLElement, log: RunLog | null): () => void {
  const pns = all(root, '.pn');
  // a poster taller than the screen sticks by its bottom edge, so all of it is seen before the
  // next covers it. Reads first, then writes; only on width changes (a phone's address bar
  // showing or hiding must not re-seat the stack mid-scroll).
  let lastWidth = -1;
  let raf = 0;
  const fit = () => {
    raf = 0;
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    const tops = pns.map((p) => Math.min(0, window.innerHeight - p.offsetHeight));
    pns.forEach((p, i) => {
      p.style.position = 'sticky';
      p.style.top = `${tops[i]}px`;
    });
  };
  const onResize = () => {
    if (!raf) raf = requestAnimationFrame(fit);
  };
  fit();
  window.addEventListener('resize', onResize);
  pns.forEach((p, i) => {
    const tl = gsap.timeline({ paused: true });
    entrance(p, tl, 0, 1.4);
    ScrollTrigger.create({ trigger: p, start: 'top 75%', once: true, onEnter: () => void tl.play() });
    drift(p, gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } }), 0, 1);
    if (i < pns.length - 1) {
      // covered by the next poster: sink back a little and darken
      const cover = () => ({ trigger: pns[i + 1], start: 'top bottom', end: 'top 20%', scrub: true });
      gsap.to(p.querySelector('.pn-in'), { scale: 0.95, transformOrigin: '50% 100%', ease: 'none', scrollTrigger: cover() });
      gsap.to(p.querySelector('.pn-shade'), { opacity: 0.5, ease: 'none', scrollTrigger: cover() });
    }
  });
  if (log) {
    log.start();
    ScrollTrigger.create({ trigger: log.wrap, start: 'top 70%', end: 'bottom 45%', scrub: true, onUpdate: (st) => log.runTo(st.progress) });
  }
  return () => {
    log?.stop();
    resetCounts(root);
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    pns.forEach((p) => {
      p.style.removeProperty('position');
      p.style.removeProperty('top');
    });
  };
}

/** Layout-dependent pieces that every mode needs (reduced motion included): scribbles and the rail. */
function wireLayout(root: HTMLElement, log: RunLog | null): () => void {
  let raf = 0;
  let alive = true;
  const place = () => {
    raf = 0;
    if (!alive) return;
    placeMarks(root, BOXES);
    log?.place();
  };
  // at most once per frame, however many resize / refresh events arrive together
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(place);
  };
  place();
  void document.fonts.ready.then(schedule);
  window.addEventListener('resize', schedule);
  ScrollTrigger.addEventListener('refresh', schedule);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', schedule);
    ScrollTrigger.removeEventListener('refresh', schedule);
  };
}

/**
 * Stack choreography. Reduced motion gets the plain posters (no pin, no
 * sticky, no reveals) but keeps the tool ↔ picture highlighting. Splits and
 * timelines are rebuilt on font load and width changes (rebuildOnReflow).
 */
export function useStackPosters(rootRef: RefObject<HTMLElement | null>): void {
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const log = runLog(root);
      const offTools = all(root, '.pn').map(wireTools);
      const offLayout = wireLayout(root, log);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // the stickers' rings turn with the scroll through the whole section
        gsap.to(all(root, '.stk-ring'), { rotation: -360, svgOrigin: '50 50', ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true, refreshPriority: -1 } }); // measured after the pin adds its length
        return rebuildOnReflow(() => {
          const title = root.querySelector<HTMLElement>('.skp-title');
          const split = title ? riseTitle(title) : null;
          all(root, '.skp-eyebrow, .skp-lead').forEach((el) =>
            gsap.from(el, { y: FADE_UP.y, autoAlpha: 0, duration: FADE_UP.duration, ease: FADE_UP.ease, scrollTrigger: { trigger: el, start: FADE_UP.start } })
          );
          return () => split?.revert();
        });
      });

      mm.add({ motion: MOTION_OK, pin: PIN_OK }, (ctx) => {
        const { motion } = ctx.conditions as { motion: boolean; pin: boolean };
        if (!motion) return;
        // decide pinned vs sticky on every rebuild, not once: a width-triggered rebuild
        // must not reuse a stale answer if the media-query change has not fired yet
        return rebuildOnReflow(() => (window.matchMedia(PIN_OK).matches ? buildPinned(root, log) : buildFlow(root, log)));
      });

      return () => {
        offTools.forEach((off) => off());
        offLayout();
        all(root, '.pn').forEach((p) => lightTool(p, null));
      };
    },
    { scope: rootRef }
  );
}
