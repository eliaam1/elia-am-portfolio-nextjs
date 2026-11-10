'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { FADE_UP, rebuildOnReflow, riseTitle } from '../../../lib/rise';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
/** Seconds of smoothing on the footer reveal, on top of Lenis. */
const REVEAL_SCRUB = 0.6;
/** How far the footer's stage sits up under the panel before it is uncovered (yPercent). */
const STAGE_LAG = -30;
/** The blade's own direction in mark units (BrandMark FULL_BLADE: top to bottom edge). */
const BLADE_RUN = { x: -38.34, y: -92 };
/** Letters start this far below the cap-height mask, in mark units. */
const LETTER_DROP = 64;

const all = (root: Element, sel: string): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(sel));

/** The panel's entrance: label, the heading rising line by line, then the facts and channels. */
export function useContactMotion(rootRef: RefObject<HTMLElement | null>): void {
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () =>
        // line splits must be re-measured when fonts load or the width changes
        rebuildOnReflow(() => {
          const title = root.querySelector<HTMLElement>('.ct-title');
          const start = { trigger: root.querySelector('.ct-in'), start: 'top 75%' };
          if (title) riseTitle(title, start);
          const fade = { y: FADE_UP.y, opacity: 0, duration: FADE_UP.duration, ease: FADE_UP.ease };
          gsap.from(all(root, '.ct-label'), { ...fade, scrollTrigger: start });
          gsap.from(all(root, '.ct-fact'), { ...fade, stagger: 0.08, delay: 0.4, scrollTrigger: start });
          gsap.from(all(root, '.ct-ch'), { ...fade, y: 28, stagger: 0.1, delay: 0.3, scrollTrigger: start });
        })
      );
      return () => mm.revert();
    },
    { scope: rootRef }
  );
}

/**
 * The curtain: as the Contact panel lifts off the footer, the footer's stage
 * eases down into place, the letters rise out of their mask, the blade slides
 * in along its own 22.6° line and the name tracks in. Scrubbed, so scrolling
 * back up puts the curtain back.
 */
export function useFooterReveal(footRef: RefObject<HTMLElement | null>): void {
  useGSAP(
    () => {
      const foot = footRef.current;
      if (!foot) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: REVEAL_SCRUB },
          })
          .from(foot.querySelector('.ft-stage'), { yPercent: STAGE_LAG, scale: 0.88, duration: 1 })
          .from(all(foot, '.ft-letter'), { y: LETTER_DROP, stagger: 0.08, ease: 'power2.out', duration: 0.6 }, 0)
          .from(foot.querySelector('.ft-blade'), { ...BLADE_RUN, opacity: 0, ease: 'power2.out', duration: 0.4 }, 0.5)
          .from(foot.querySelector('.ft-name'), { letterSpacing: '1.2em', opacity: 0, duration: 0.5 }, 0.45)
          .from(foot.querySelector('.ft-glow'), { opacity: 0, duration: 0.6 }, 0.4);
      });
      return () => mm.revert();
    },
    { scope: footRef }
  );
}

