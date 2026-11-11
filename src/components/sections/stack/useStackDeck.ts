'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { getLenis } from '../../../lib/lenis';
import { FADE_UP, rebuildOnReflow, riseTitle, splitLines } from '../../../lib/rise';
import { STACK, STACK_SLOTS } from './stackData';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** Scroll per need, in % of the viewport, plus a short hold on the last one. */
const STEP_VH = 38;
const OUTRO_VH = 15;
/** Glide to the nearest need once scrolling settles (s). */
const SNAP_DURATION = 0.7;
const JUMP_DURATION = 1.2;
/** Ghost word: fills this share of the width, never taller than this share of the height. */
const GHOST_WIDTH = 0.96;
const GHOST_MAX_H = 0.5;
const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

const pad2 = (n: number): string => String(n).padStart(2, '0');
const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

/** Lenis owns the scroll when it is running; native smooth scroll otherwise. */
function scrollToY(y: number, duration: number): void {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration, easing: easeOutQuart });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

interface DeckParts {
  deck: HTMLElement;
  steps: HTMLElement[];
  segs: HTMLButtonElement[];
  ghosts: HTMLElement[];
  faces: HTMLElement[][];
  lines: Element[][];
  peeks: (HTMLElement | null)[];
}

/** Ghost words are sized to the deck's width (capped by height for short words like "AI"). */
function fitGhosts(deck: HTMLElement, ghosts: HTMLElement[]): void {
  ghosts.forEach((g) => {
    g.style.fontSize = '100px';
    const size = Math.min((100 * deck.clientWidth * GHOST_WIDTH) / g.scrollWidth, window.innerHeight * GHOST_MAX_H);
    g.style.fontSize = `${size.toFixed(1)}px`;
    g.style.marginTop = `${(-size * 0.4).toFixed(1)}px`;
  });
}

/** Marks the current need on the jump buttons and the "now" line. */
function makeMarker(parts: DeckParts): (i: number) => void {
  const nowN = parts.deck.querySelector<HTMLElement>('[data-now-n]');
  const nowLabel = parts.deck.querySelector<HTMLElement>('[data-now-label]');
  let current = -1;
  return (i) => {
    if (i === current) return;
    current = i;
    parts.segs.forEach((s, j) => {
      if (j === i) s.setAttribute('aria-current', 'step');
      else s.removeAttribute('aria-current');
      s.tabIndex = j === i ? 0 : -1;
    });
    if (nowN) nowN.textContent = pad2(i + 1);
    if (nowLabel) nowLabel.textContent = STACK[i].short;
  };
}

/** One timeline unit per need; labels s0..s5 are the resting points. */
function buildTimeline(parts: DeckParts, mark: (i: number) => void): gsap.core.Timeline {
  const { deck, segs, ghosts, faces, lines, peeks } = parts;
  const n = STACK.length;
  const blade = deck.querySelector('.sd-blade');
  const counter = deck.querySelector('.sd-counter-col');

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: () => mark(Math.min(n - 1, Math.floor(tl.time() + 0.45))),
    scrollTrigger: {
      trigger: deck,
      start: 'top top',
      end: `+=${(n - 1) * STEP_VH + OUTRO_VH}%`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  tl.addLabel('s0', 0);
  for (let i = 1; i < n; i++) {
    const at = i - 1;
    tl.to(segs[i - 1].querySelector('.sd-seg-fill'), { scaleX: 1, duration: 1 }, at)
      // the blade crosses; everything swaps underneath it
      .fromTo(blade, { x: () => -0.6 * window.innerWidth }, { x: () => 1.25 * window.innerWidth, duration: 0.55, immediateRender: false }, at + 0.22)
      .to(lines[i - 1], { yPercent: -130, stagger: 0.05, duration: 0.4 }, at + 0.22)
      .to(peeks[i - 1], { y: -20, autoAlpha: 0, duration: 0.25 }, at + 0.22)
      // flip board: old faces fall away slot by slot, new ones drop in
      .to(faces[i - 1], { rotationX: -90, stagger: 0.025, duration: 0.2 }, at + 0.25)
      .set(faces[i - 1], { autoAlpha: 0 }, at + 0.25 + 0.2 + 0.025 * STACK_SLOTS)
      .set(faces[i], { autoAlpha: 1 }, at + 0.42)
      .fromTo(faces[i], { rotationX: 90 }, { rotationX: 0, stagger: 0.035, duration: 0.26, immediateRender: false }, at + 0.42)
      .to(counter, { yPercent: (-100 / n) * i, duration: 0.45 }, at + 0.35)
      .to(ghosts[i - 1], { xPercent: -62, autoAlpha: 0, duration: 0.4 }, at + 0.25)
      .fromTo(ghosts[i], { xPercent: -38, autoAlpha: 0 }, { xPercent: -50, autoAlpha: 1, duration: 0.45, immediateRender: false }, at + 0.45)
      .to(lines[i], { yPercent: 0, stagger: 0.05, duration: 0.42 }, at + 0.55)
      .to(peeks[i], { y: 0, autoAlpha: 1, duration: 0.3 }, at + 0.7)
      .addLabel(`s${i}`, at + 1);
  }
  tl.to(segs[n - 1].querySelector('.sd-seg-fill'), { scaleX: 1, duration: 0.4 }, n - 1);
  return tl;
}

/**
 * Jump buttons (click / arrow keys) and the settle-snap. The snap is driven
 * by Lenis rather than ScrollTrigger's own snap: two smoothers pulling the
 * page at once is what makes a pinned section feel sticky.
 */
function wireNavigation(parts: DeckParts, tl: gsap.core.Timeline): () => void {
  const st = tl.scrollTrigger;
  if (!st) return () => undefined;
  const n = STACK.length;
  const yOf = (i: number) => st.start + (st.end - st.start) * (tl.labels[`s${i}`] / tl.duration());
  // Arrow keys move from the focused button (aria-current lags while the jump scrolls).
  const currentIndex = () => {
    const focused = parts.segs.indexOf(document.activeElement as HTMLButtonElement);
    return focused >= 0 ? focused : parts.segs.findIndex((s) => s.hasAttribute('aria-current'));
  };

  const onClick = (e: MouseEvent) => {
    const seg = (e.target as HTMLElement).closest<HTMLElement>('.sd-seg');
    if (seg) scrollToY(yOf(Number(seg.dataset.i)), JUMP_DURATION);
  };
  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(n - 1, currentIndex() + dir));
    parts.segs[i].focus();
    scrollToY(yOf(i), JUMP_DURATION);
  };
  const settle = () => {
    if (!st.isActive) return;
    const t = st.progress * tl.duration();
    // Past the last need is the outro hold: let the section release, never pull back.
    if (t >= n - 1) return;
    const i = Math.round(Math.max(0, t));
    const y = yOf(i);
    if (Math.abs(y - window.scrollY) > 2) scrollToY(y, SNAP_DURATION);
  };

  const segBar = parts.deck.querySelector<HTMLElement>('.sd-segs');
  segBar?.addEventListener('click', onClick);
  segBar?.addEventListener('keydown', onKey);
  ScrollTrigger.addEventListener('scrollEnd', settle);
  return () => {
    segBar?.removeEventListener('click', onClick);
    segBar?.removeEventListener('keydown', onKey);
    ScrollTrigger.removeEventListener('scrollEnd', settle);
  };
}

/** Mouse only: the board leans toward the pointer; jump buttons are magnetic. */
function wirePointer(parts: DeckParts): () => void {
  const board = parts.deck.querySelector('.sd-board');
  const rx = gsap.quickTo(board, 'rotationX', { duration: 0.9, ease: 'power3' });
  const ry = gsap.quickTo(board, 'rotationY', { duration: 0.9, ease: 'power3' });
  const lean = (e: PointerEvent) => {
    ry((e.clientX / window.innerWidth - 0.5) * 14);
    rx(-(e.clientY / window.innerHeight - 0.5) * 10);
  };
  parts.deck.addEventListener('pointermove', lean);

  const offs = parts.segs.map((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.18);
      my((e.clientY - r.top - r.height / 2) * 0.35);
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
    parts.deck.removeEventListener('pointermove', lean);
    offs.forEach((off) => off());
  };
}

/** First need's entrance. Wrappers only, never what the scrubbed timeline owns. */
function entrance(parts: DeckParts, st: ScrollTrigger): void {
  const { deck } = parts;
  const enter = { trigger: deck, start: 'top 60%' };
  gsap.from(deck.querySelector('.sd-counter'), { yPercent: 30, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: deck, start: 'top 70%' } });
  gsap.from(parts.steps[0], { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: enter });
  gsap.from(deck.querySelectorAll('.sd-slot'), { y: 40, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out', scrollTrigger: enter });
  const ghostLayer = deck.querySelector('.sd-ghosts');
  gsap.from(ghostLayer, { autoAlpha: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: enter });
  gsap.fromTo(ghostLayer, { x: 30 }, { x: -30, ease: 'none', scrollTrigger: { trigger: deck, start: 'top top', end: () => st.end, scrub: true } });
}

/** Builds the pinned deck inside a rebuildable context. Returns its cleanup. */
function buildDeck(deck: HTMLElement, fine: boolean): () => void {
  const all = (sel: string): HTMLElement[] => Array.from(deck.querySelectorAll<HTMLElement>(sel));
  const steps = all('.sd-step');
  const splits = steps.map((s) => splitLines(s.querySelector<HTMLElement>('.sd-need') ?? s));
  const parts: DeckParts = {
    deck,
    steps,
    segs: all('.sd-seg') as HTMLButtonElement[],
    ghosts: all('.sd-ghost'),
    faces: STACK.map((_, ci) => all(`.sd-face[data-ci="${ci}"]`)),
    lines: splits.map((sp) => sp.lines),
    peeks: steps.map((s) => s.querySelector<HTMLElement>('.sd-peek')),
  };

  const refit = () => fitGhosts(deck, parts.ghosts);
  refit();
  window.addEventListener('resize', refit);

  // Resting state: need 0 showing, the rest parked.
  parts.lines.forEach((l, i) => i > 0 && gsap.set(l, { yPercent: 130 }));
  parts.peeks.forEach((p, i) => i > 0 && gsap.set(p, { y: 24, autoAlpha: 0 }));
  parts.faces.forEach((f, ci) => gsap.set(f, ci ? { rotationX: 90, autoAlpha: 0 } : { rotationX: 0, autoAlpha: 1 }));
  gsap.set(parts.ghosts, { xPercent: -50, autoAlpha: 0 });
  gsap.set(parts.ghosts[0], { autoAlpha: 1 });

  const mark = makeMarker(parts);
  mark(0);
  const tl = buildTimeline(parts, mark);
  const offNav = wireNavigation(parts, tl);
  const offPointer = fine ? wirePointer(parts) : () => undefined;
  if (tl.scrollTrigger) entrance(parts, tl.scrollTrigger);

  return () => {
    window.removeEventListener('resize', refit);
    offNav();
    offPointer();
    splits.forEach((sp) => sp.revert());
    parts.ghosts.forEach((g) => {
      g.style.removeProperty('font-size');
      g.style.removeProperty('margin-top');
    });
  };
}

/**
 * The Stack deck's choreography. The pin runs on every screen size (the
 * address-bar resize is ignored globally via ignoreMobileResize); reduced
 * motion gets no pin and the plain stacked list. Both the title and the deck
 * are rebuilt on font load / width change, because their line splits and the
 * timeline targeting those lines depend on measured widths.
 */
export function useStackDeck(rootRef: RefObject<HTMLElement | null>): void {
  useGSAP(
    () => {
      const deck = rootRef.current;
      if (!deck) return;
      const mm = gsap.matchMedia();

      // Title rises line by line; eyebrow and lead fade up.
      mm.add(MOTION_OK, () =>
        rebuildOnReflow(() => {
          const title = deck.querySelector<HTMLElement>('.sd-title');
          const split = title ? riseTitle(title) : null;
          deck.querySelectorAll<HTMLElement>('.sd-eyebrow, .sd-lead').forEach((el) =>
            gsap.from(el, { y: FADE_UP.y, autoAlpha: 0, duration: FADE_UP.duration, ease: FADE_UP.ease, scrollTrigger: { trigger: el, start: FADE_UP.start } })
          );
          return () => split?.revert();
        })
      );

      mm.add({ motion: MOTION_OK, fine: FINE_POINTER }, (ctx) => {
        const { motion, fine } = ctx.conditions as { motion: boolean; fine: boolean };
        if (!motion) return;
        deck.classList.add('is-pinned');
        const teardown = rebuildOnReflow(() => buildDeck(deck, fine));
        return () => {
          teardown();
          deck.classList.remove('is-pinned');
        };
      });
    },
    { scope: rootRef }
  );
}
