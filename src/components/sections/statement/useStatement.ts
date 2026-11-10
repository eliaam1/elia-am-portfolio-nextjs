'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { rebuildOnReflow, splitLines } from '../../../lib/rise';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
/** Scroll length of the pin, in screens. */
const PIN_SCREENS = 1.2;
/** Seconds of scroll smoothing on top of Lenis. */
const SCRUB = 0.5;
/** Beats sit this far below / above their masks (yPercent), clear of the descender padding. */
const BEAT_OFF = 125;
/** Screens into the Dimension's pin over which this light fades as the scene's own light comes up. */
const HANDOFF_FADE = 0.16;
/** Pin progress where the light appears out of the dark, and how long it takes. */
const LIGHT_AT = 0.9;
const LIGHT_IN = 0.08;
/** The camera's push through the sentence. */
const PUSH_SCALE = 3.2;

const all = (root: Element, sel: string): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(sel));
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
/** The Dimension draws its own light only once its WebGL scene has loaded. */
const dimensionReady = (): boolean => document.querySelector('.wd.is-live:not(.is-loading)') !== null;
/** While the Dimension is live it is pulled up under this section (statement.css), so its pin starts where ours ends. */
const dimensionOverlaps = (): boolean => document.querySelector('.wd.is-live') !== null;

/** The pinned, scrubbed sequence. Returns the timeline (its ScrollTrigger holds the pin). */
function buildTimeline(root: HTMLElement): gsap.core.Timeline {
  const title = root.querySelector<HTMLElement>('.st-title');
  const lines = title ? splitLines(title).lines : [];
  const beats = all(root, '.st-beat-w');
  const [label, ...rest] = all(root, '.st-fade');
  // opacity, not autoAlpha: the heading and proof stay in the accessibility tree
  gsap.set(beats, { yPercent: BEAT_OFF });
  gsap.set(lines, { yPercent: 110 });
  gsap.set([label, ...rest], { opacity: 0, y: 16 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top top', end: `+=${PIN_SCREENS * 100}%`, pin: true, scrub: SCRUB, anticipatePin: 1 },
  });
  // three beats, each cutting in from below and out through the top
  beats.forEach((b, i) => {
    const s = i * 0.13;
    tl.to(b, { yPercent: 0, duration: 0.06, ease: 'power3.out' }, s).to(b, { yPercent: -BEAT_OFF, duration: 0.06, ease: 'power3.in' }, s + 0.09);
  });
  // then the whole line, with the label and the proof
  tl.to(lines, { yPercent: 0, duration: 0.12, stagger: 0.03, ease: 'power3.out' }, 0.4)
    .to(label, { opacity: 1, y: 0, duration: 0.06 }, 0.4)
    .to(rest, { opacity: 1, y: 0, duration: 0.08 }, 0.56)
    // and the camera pushes through it into the dark (the light is driven by lightAlpha)
    .to(root.querySelector('.st-in'), { scale: PUSH_SCALE, opacity: 0, filter: 'blur(10px)', duration: 0.2, ease: 'power2.in' }, 0.76)
    .to(root.querySelector('.st-void'), { opacity: 1, duration: 0.16 }, 0.82);
  return tl;
}

/**
 * How lit the light is at scroll position `y`. A pure function of position, so
 * rebuilds, refreshes and fast jumps can never leave it stale:
 * it comes up out of the dark near the end of the pin, then fades during the
 * first part of the Dimension's pin (which starts right where ours ends), as the
 * scene's own light comes up at the same spot.
 * Without a loaded scene there is no light to hand to, so it is off past the pin.
 */
function lightAlpha(pin: ScrollTrigger, y: number): number {
  if (y < pin.end) return clamp01(((y - pin.start) / (pin.end - pin.start) - LIGHT_AT) / LIGHT_IN);
  if (!dimensionReady()) return 0;
  return clamp01(1 - (y - pin.end) / window.innerHeight / HANDOFF_FADE);
}

/**
 * The light's only writer, and the section's visibility past its pin (transparent
 * there when the Dimension lies under it, so the scene shows through instead of
 * this section scrolling away over it). Both are pure functions of scroll.
 */
function driveHandOff(root: HTMLElement, tl: gsap.core.Timeline, light: HTMLElement): void {
  const pin = tl.scrollTrigger as ScrollTrigger;
  const sync = (self: ScrollTrigger) => {
    const y = self.scroll();
    gsap.set(light, { autoAlpha: lightAlpha(pin, y) });
    // opacity, not visibility: the heading stays reachable by assistive tech
    const under = y > pin.end && dimensionOverlaps();
    root.style.opacity = under ? '0' : '';
    root.style.pointerEvents = under ? 'none' : '';
  };
  // Spans the whole page, so it updates on every scroll: a narrower range misses
  // jumps that land on the far side of it (a nav link from Contact back to the top).
  const st = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: sync,
    // also when the Dimension finishes loading: useDimension refreshes ScrollTrigger then
    onRefresh: sync,
  });
  sync(st);
}

/** Wires the Statement's motion. Reduced motion keeps the plain, fully visible heading. */
export function useStatement(rootRef: RefObject<HTMLElement | null>, lightRef: RefObject<HTMLSpanElement | null>): void {
  useGSAP(
    () => {
      const root = rootRef.current;
      const light = lightRef.current;
      if (!root || !light) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        root.classList.add('is-live');
        light.style.display = 'block';
        // line splits must be re-measured when fonts load or the width changes
        const stop = rebuildOnReflow(() => {
          driveHandOff(root, buildTimeline(root), light);
        });
        return () => {
          stop();
          root.classList.remove('is-live');
          root.style.opacity = '';
          root.style.pointerEvents = '';
          gsap.set(light, { clearProps: 'all' });
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef }
  );
}
