'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { PRELOAD_MIN_MS } from '../../config/constants';
import { MQ } from '../../config/motion';
import { markPreloadComplete, isPreloadPending } from '../../lib/preload';
import { getLenis } from '../../lib/lenis';
import { LETTER_A, LETTER_E, LETTER_M, FULL_BLADE, FULL_VIEWBOX } from '../brand/BrandMark';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** Counter easing toward its target, per frame. */
const COUNTER_LERP = 0.12;
/**
 * Length of the CSS intro (draw 0.9s + stagger, fill, blade slice ends at
 * ~1.37s) measured from navigation start, which is also performance.now()'s
 * origin. The intro is CSS so it runs from first paint, before hydration.
 */
const INTRO_MS = 1400;

/** Letters as individual shapes with a normalised path length for the CSS draw. */
type ShapeElement = React.ReactElement<React.SVGProps<SVGElement>>;
const LETTER_SHAPES = ([LETTER_E, LETTER_A, LETTER_M] as React.ReactElement<{ children?: React.ReactNode }>[])
  .flatMap((node): ShapeElement[] =>
    node.type === React.Fragment
      ? (React.Children.toArray(node.props.children) as ShapeElement[])
      : [node as ShapeElement]
  )
  .map((shape, i) =>
    React.cloneElement(shape, {
      key: i,
      pathLength: 1,
      style: { '--i': i } as React.CSSProperties,
    })
  );

/** Resolves once `promise` settles; failures count as done so nothing wedges. */
const settled = (promise: Promise<unknown>) => promise.then(() => undefined, () => undefined);

function trackAssets(): { progress: () => number } {
  const jobs: Promise<void>[] = [];
  if ('fonts' in document) jobs.push(settled(document.fonts.ready));
  if (document.readyState !== 'complete') {
    jobs.push(new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true })));
  }
  document.querySelectorAll<HTMLImageElement>('#hero img').forEach((img) => {
    if (!img.complete) jobs.push(settled(img.decode()));
  });

  let done = 0;
  jobs.forEach((job) => job.then(() => (done += 1)));
  return { progress: () => (jobs.length === 0 ? 1 : done / jobs.length) };
}

/**
 * First-visit loader. The EAM mark draws in, the lime blade slices down
 * through the A while a counter runs 000 → 100, then the screen wipes up
 * with a curved edge onto the hero. The intro is CSS (.loader-* in
 * globals.css) so it starts on first paint; this component drives only
 * the counter and the exit.
 *
 * Contract (shared with layout.tsx and lib/preload.ts):
 *   - The overlay is in the server HTML and shown only by CSS while
 *     html[data-preload='loading']; repeat views this session never see it.
 *   - The counter can only reach 100 once real work (fonts, window load,
 *     hero image) is done AND PRELOAD_MIN_MS has passed.
 *   - markPreloadComplete() is called part-way through the wipe, so the
 *     hero's CSS entrance plays as it is uncovered. The overlay is held
 *     visible with an inline display until the wipe finishes, because the
 *     attribute flip alone would hide it instantly.
 *   - The inline failsafe in layout.tsx still releases the page if this
 *     component never runs.
 */
export function EamLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<SVGSVGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const mark = markRef.current;
      if (!root || !mark || !isPreloadPending()) return;

      const reduced = window.matchMedia(MQ.reduced).matches;
      const assets = trackAssets();
      let released = false;
      let shown = 0;

      // Keep keyboard focus out of the page behind the overlay; overflow:hidden
      // stops scrolling but not Tab.
      const behind = Array.from(document.querySelectorAll<HTMLElement>('main, header'));
      const setInert = (on: boolean) => behind.forEach((el) => (el.inert = on));
      setInert(true);

      /* ---------- exit ---------- */
      const finish = () => {
        setInert(false);
        markPreloadComplete();
        // Lenis measured the page while scrolling was locked.
        getLenis()?.resize();
        ScrollTrigger.refresh();
      };

      const release = () => {
        released = true;
        gsap.ticker.remove(frame);
        if (counterRef.current) counterRef.current.textContent = '100';
        // Keep the overlay painted after the attribute flips mid-wipe.
        gsap.set(root, { display: 'flex' });
        const hide = () => gsap.set(root, { display: 'none' });

        if (reduced) {
          gsap.to(root, { autoAlpha: 0, duration: 0.3, ease: 'power2.out', onStart: finish, onComplete: hide });
          return;
        }

        gsap
          .timeline({ onComplete: hide })
          .to([mark, metaRef.current, counterRef.current], { y: -24, autoAlpha: 0, duration: 0.45, stagger: 0.04, ease: 'power2.in' }, 0)
          .fromTo(
            root,
            { clipPath: 'ellipse(150% 150% at 50% 0%)' },
            { clipPath: 'ellipse(150% 0% at 50% 0%)', duration: 1, ease: 'power3.inOut' },
            0.2
          )
          .add(finish, 0.45);
      };

      /* ---------- counter, on the shared ticker ---------- */
      const frame = () => {
        if (released) return;
        // The inline failsafe released the page first: stand down without
        // re-showing the overlay over a hero that has already entered.
        if (!isPreloadPending()) {
          released = true;
          gsap.ticker.remove(frame);
          setInert(false);
          gsap.set(root, { display: 'none' });
          return;
        }
        // performance.now() counts from navigation start, like the CSS intro.
        const byTime = performance.now() / PRELOAD_MIN_MS;
        const introDone = reduced || performance.now() >= INTRO_MS;
        const target = Math.max(0, Math.min(1, byTime, assets.progress()));
        shown += (target - shown) * COUNTER_LERP;
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.min(100, Math.round(shown * 100))).padStart(3, '0');
        }
        if (target >= 1 && shown > 0.995 && introDone) release();
      };
      gsap.ticker.add(frame);

      return () => {
        gsap.ticker.remove(frame);
        setInert(false);
      };
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className="preloader-root fixed inset-0 z-[10000] items-center justify-center bg-app-bg"
      role="status"
      aria-label="Loading"
    >
      <svg
        ref={markRef}
        viewBox={FULL_VIEWBOX}
        aria-hidden="true"
        className="w-[min(520px,72vw)] overflow-visible -translate-y-[4svh]"
      >
        <g className="loader-shape" fill="var(--color-text-primary)" stroke="var(--color-text-primary)" strokeWidth="1.2">
          {LETTER_SHAPES}
        </g>
        <polygon className="loader-blade" points={FULL_BLADE} fill="var(--color-accent)" />
      </svg>

      <p
        ref={metaRef}
        className="loader-meta absolute bottom-[clamp(24px,6svh,56px)] left-[clamp(16px,4vw,56px)] font-mono text-[10px] sm:text-[11px] uppercase leading-loose tracking-[0.24em] text-app-text-secondary"
      >
        Elia Abdel Massih
        <br />
        <span className="opacity-60">Portfolio · 2026</span>
      </p>

      {/* aria-hidden: it ticks every frame; the status role carries the state. */}
      <span
        ref={counterRef}
        aria-hidden="true"
        className="absolute bottom-[clamp(16px,5svh,44px)] right-[clamp(16px,4vw,56px)] font-heading text-[clamp(56px,9vw,128px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums text-app-text-primary"
      >
        000
      </span>
    </div>
  );
}

export default EamLoader;
