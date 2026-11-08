'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** The EAM blade angle, in degrees off vertical, from the mark geometry. */
export const BLADE_DEG = 22.6;
const TAN = Math.tan((BLADE_DEG * Math.PI) / 180);

/**
 * Band resting geometry as fractions of the stage: left/right edge x at
 * mid-height (of width) and the flat top edge (of height). Two layouts,
 * matching the hero's own lg breakpoint.
 */
const REST = {
  wide: { l: 0.7, r: 0.852, top: 0.11 },
  narrow: { l: 0.6, r: 0.9, top: 0.42 },
} as const;
const WIDE_MQ = '(min-width: 1024px)';

/** Opt-in attribute; globals.css only lengthens the hero while it is set. */
const SWEEP_ATTR = 'data-sweep';

interface BandPx {
  l: number;
  r: number;
  top: number;
}

/** clip-path polygon for a parallelogram at the blade angle. */
export function bandPolygon({ l, r, top }: BandPx, h: number): string {
  const atTop = (x: number) => x + (h / 2 - top) * TAN;
  const atBottom = (x: number) => x - (h / 2) * TAN;
  return `polygon(${atTop(l)}px ${top}px, ${atTop(r)}px ${top}px, ${atBottom(r)}px ${h}px, ${atBottom(l)}px ${h}px)`;
}

export interface BladeSweepRefs {
  section: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  bg: RefObject<HTMLDivElement | null>;
  band: RefObject<HTMLDivElement | null>;
  name: RefObject<HTMLDivElement | null>;
  portrait: RefObject<HTMLImageElement | null>;
  fades: RefObject<HTMLDivElement | null>;
  label: RefObject<HTMLDivElement | null>;
}

/**
 * The Hero -> Profile hand-off ("Blade sweep").
 *
 * The hero section is lengthened (CSS, keyed off data-sweep) and its stage
 * is position:sticky, so the pin is native and never jumps when a mobile
 * address bar collapses. Profile is pulled up underneath the stage by the
 * same CSS rule, which is why the band can "wipe off" onto real content.
 *
 * Scroll timeline (progress of the lengthened section):
 *   0    -> 0.42  band widens behind the content to cover the screen;
 *                 name slides off, portrait drops, CTAs fade
 *   0.42          hero background removed (band is fully opaque here)
 *   0.43 -> 0.56  chapter label in and out
 *   0.50 -> 0.90  band exits right-to-left, revealing Profile beneath
 *
 * Reduced motion: none of this runs and data-sweep is never set, so the
 * hero is a normal 100svh block followed by Profile. A JS failure lands in
 * the same state, never on an opaque stage covering Profile.
 */
export function useBladeSweep(refs: BladeSweepRefs): void {
  useGSAP(
    () => {
      const section = refs.section.current;
      const stage = refs.stage.current;
      const band = refs.band.current;
      if (!section || !stage || !band) return;

      const state: BandPx = { l: 0, r: 0, top: 0 };
      const size = () => ({ w: stage.clientWidth, h: stage.clientHeight });
      const rest = () => (window.matchMedia(WIDE_MQ).matches ? REST.wide : REST.narrow);
      const restPx = (): BandPx => {
        const { w, h } = size();
        const f = rest();
        return { l: f.l * w, r: f.r * w, top: f.top * h };
      };
      const draw = () => {
        band.style.clipPath = bandPolygon(state, size().h);
      };
      const placeAtRest = () => {
        Object.assign(state, restPx());
        draw();
      };

      // Always draw the band at its exact resting geometry, motion or not.
      placeAtRest();
      const onResize = () => {
        if (!section.hasAttribute(SWEEP_ATTR)) placeAtRest();
      };
      window.addEventListener('resize', onResize, { passive: true });

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        section.setAttribute(SWEEP_ATTR, 'on');

        const full = () => {
          const { w, h } = size();
          // Wide enough that both slanted edges sit off-screen at top and bottom.
          return { l: -(h / 2) * TAN - 40, r: w + (h / 2) * TAN + 40, top: 0 };
        };
        const gone = () => {
          const { h } = size();
          return { l: -(h * TAN) - 400, r: -(h / 2) * TAN - 40 };
        };

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              if (self.progress === 0) placeAtRest();
            },
          },
        });

        tl.fromTo(
          state,
          { l: () => restPx().l, r: () => restPx().r, top: () => restPx().top },
          { l: () => full().l, r: () => full().r, top: 0, duration: 0.42, ease: 'power2.in', onUpdate: draw },
          0
        )
          .to(refs.name.current, { xPercent: -45, autoAlpha: 0, duration: 0.32, ease: 'power1.in' }, 0.04)
          .to(refs.fades.current?.children ?? [], { autoAlpha: 0, y: 20, duration: 0.2 }, 0.02)
          .to(refs.portrait.current, { yPercent: 16, autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0.14)
          .set(refs.bg.current, { autoAlpha: 0 }, 0.42)
          .fromTo(refs.label.current, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.43)
          .to(refs.label.current, { autoAlpha: 0, y: -14, duration: 0.06 }, 0.5)
          .fromTo(
            state,
            { l: () => full().l, r: () => full().r },
            { l: () => gone().l, r: () => gone().r, duration: 0.4, ease: 'power2.inOut', onUpdate: draw, immediateRender: false },
            0.5
          )
          .to({}, { duration: 0.1 });

        ScrollTrigger.refresh();

        return () => {
          section.removeAttribute(SWEEP_ATTR);
          placeAtRest();
          ScrollTrigger.refresh();
        };
      });

      return () => {
        window.removeEventListener('resize', onResize);
        mm.revert();
      };
    },
    { scope: refs.section }
  );
}
