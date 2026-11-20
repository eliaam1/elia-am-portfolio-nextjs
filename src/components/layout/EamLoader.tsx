'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { flushPendingRefresh } from '../../lib/refresh';
import { MQ } from '../../config/motion';
import { markPreloadComplete, isPreloadPending } from '../../lib/preload';
import { getLenis } from '../../lib/lenis';
import { LETTER_A, LETTER_E, LETTER_M, FULL_BLADE, FULL_VIEWBOX } from '../brand/BrandMark';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Timings, from navigation start (performance.now()'s origin, which is also
 * when the CSS animations start: they run from first paint, before hydration).
 */
const INTRO_MS = 1500; // letters risen, blade in (globals.css .loader-*)
const COUNT_DELAY_MS = 150;
const COUNT_MS = 2400; // the odometer's run from 000 to 099
const COUNT_END_MS = COUNT_DELAY_MS + COUNT_MS;
/**
 * The exit waits for this many smooth frames in a row (each under
 * SMOOTH_FRAME_MS), so it starts on a calm main thread, but never waits
 * longer than QUIET_MAX_WAIT_MS for it.
 */
const QUIET_FRAMES = 6;
const SMOOTH_FRAME_MS = 25;
const QUIET_MAX_WAIT_MS = 1200;
/** Exit: the overlay lifts with a curved lower edge; its content leaves first. */
const EXIT = {
  liftMs: 1000,
  liftDelayMs: 200,
  /** power3.inOut / power2.in as cubic-beziers, for the Web Animations API. */
  liftEase: 'cubic-bezier(0.65, 0, 0.35, 1)',
  contentEase: 'cubic-bezier(0.55, 0, 1, 0.45)',
  contentMs: 450,
  contentStaggerMs: 40,
  /** When the page behind is released (its hero entrance starts as it is uncovered). */
  releaseAtMs: 450,
  /** Depth of the curved lower edge. */
  curve: '18svh',
} as const;

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const LETTERS = [LETTER_E, LETTER_A, LETTER_M];

/** Resolves once `promise` settles; failures count as done so nothing wedges. */
const settled = (promise: Promise<unknown>) => promise.then(() => undefined, () => undefined);

function trackAssets(): { done: () => boolean } {
  const jobs: Promise<void>[] = [];
  if ('fonts' in document) jobs.push(settled(document.fonts.ready));
  if (document.readyState !== 'complete') {
    jobs.push(new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true })));
  }
  document.querySelectorAll<HTMLImageElement>('#hero img').forEach((img) => {
    if (!img.complete) jobs.push(settled(img.decode()));
  });
  let left = jobs.length;
  jobs.forEach((job) => job.then(() => (left -= 1)));
  return { done: () => left === 0 };
}

/** One rolling digit: a column of digits behind a one-digit window. */
function OdoSlot({ digits, className }: { digits: string[]; className: string }) {
  return (
    <span className="loader-odo-slot">
      <span className={`loader-odo-col ${className}`}>
        {digits.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </span>
    </span>
  );
}

/**
 * First-visit loader. The EAM letters rise into place, the lime blade slides
 * in along its 22.6° line, an odometer rolls 000 → 099, then it reads 100 and
 * the screen lifts away with a curved edge onto the hero.
 *
 * Smoothness: everything that moves is transform/opacity on HTML-level boxes,
 * run by CSS (intro, odometer) or the Web Animations API (exit). Those run on
 * the compositor, so the page hydrating and measuring itself behind the
 * overlay cannot make any of it stutter. The one heavy re-measure
 * (ScrollTrigger refresh, deferred by lib/refresh) runs while the screen holds
 * still on "100", just before the exit.
 *
 * Contract (shared with layout.tsx and lib/preload.ts):
 *   - The overlay is in the server HTML and shown only by CSS while
 *     html[data-preload='loading']; repeat views this session never see it.
 *   - It reads 100 only once real work (fonts, window load, hero image) is
 *     done AND the odometer has run.
 *   - markPreloadComplete() is called part-way through the exit, so the
 *     hero's CSS entrance plays as it is uncovered. The overlay is held
 *     visible with an inline display until the exit finishes, because the
 *     attribute flip alone would hide it instantly.
 *   - The inline failsafe in layout.tsx still releases the page if this
 *     component never runs.
 */
export function EamLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
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

      // Keep keyboard focus out of the page behind the overlay; overflow:hidden
      // stops scrolling but not Tab.
      const behind = Array.from(document.querySelectorAll<HTMLElement>('main, header'));
      const setInert = (on: boolean) => behind.forEach((el) => (el.inert = on));
      setInert(true);

      /* ---------- exit ---------- */
      const finish = () => {
        setInert(false);
        markPreloadComplete();
      };

      const exit = () => {
        const hide = () => {
          root.style.display = 'none';
        };
        if (reduced) {
          finish();
          root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out', fill: 'forwards' }).onfinish = hide;
          return;
        }
        [mark, metaRef.current, counterRef.current].forEach((el, i) =>
          el?.animate(
            [
              { transform: 'translateY(0)', opacity: 1 },
              { transform: 'translateY(-24px)', opacity: 0 },
            ],
            { duration: EXIT.contentMs, delay: i * EXIT.contentStaggerMs, easing: EXIT.contentEase, fill: 'forwards' }
          )
        );
        // extend the overlay below the screen so its curved edge starts out of sight
        Object.assign(root.style, {
          bottom: `calc(-1 * ${EXIT.curve})`,
          borderBottomLeftRadius: `50% ${EXIT.curve}`,
          borderBottomRightRadius: `50% ${EXIT.curve}`,
          willChange: 'transform',
        });
        root.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], {
          duration: EXIT.liftMs,
          delay: EXIT.liftDelayMs,
          easing: EXIT.liftEase,
          fill: 'forwards',
        }).onfinish = hide;
        window.setTimeout(finish, EXIT.releaseAtMs);
      };

      const release = () => {
        released = true;
        gsap.ticker.remove(frame);
        counterRef.current?.classList.add('is-done'); // the odometer reads 100
        // Keep the overlay painted after the attribute flips mid-exit.
        root.style.display = 'flex';
        // The one heavy re-measure of every pinned section, done now while the
        // screen holds still on "100" (lib/refresh deferred all the others).
        getLenis()?.resize();
        flushPendingRefresh();
        // start on a fresh frame, after that work has been painted
        requestAnimationFrame(() => requestAnimationFrame(exit));
      };

      /* ---------- when to release, checked on the shared ticker ---------- */
      let lastFrameAt = performance.now();
      let smoothFrames = 0;
      let readySince = 0;
      const frame = () => {
        if (released) return;
        // The inline failsafe released the page first: stand down without
        // re-showing the overlay over a hero that has already entered.
        if (!isPreloadPending()) {
          released = true;
          gsap.ticker.remove(frame);
          setInert(false);
          root.style.display = 'none';
          return;
        }
        const now = performance.now();
        smoothFrames = now - lastFrameAt < SMOOTH_FRAME_MS ? smoothFrames + 1 : 0;
        lastFrameAt = now;
        const ready = assets.done() && (reduced || (now >= INTRO_MS && now >= COUNT_END_MS));
        if (!ready) return;
        readySince ||= now;
        if (smoothFrames >= QUIET_FRAMES || now - readySince > QUIET_MAX_WAIT_MS) release();
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
      style={{ '--count-ms': `${COUNT_MS}ms`, '--count-delay': `${COUNT_DELAY_MS}ms` } as React.CSSProperties}
      role="status"
      aria-label="Loading"
    >
      <div ref={markRef} className="loader-mark relative w-[min(520px,72vw)] -translate-y-[4svh]" aria-hidden="true">
        {/* sizes the box to the mark's viewBox */}
        <svg viewBox={FULL_VIEWBOX} className="block w-full" />
        {/* the letters rise out of a cap-height window */}
        <div className="loader-letters">
          {LETTERS.map((letter, i) => (
            <svg
              key={i}
              viewBox={FULL_VIEWBOX}
              className="loader-letter"
              style={{ '--i': i } as React.CSSProperties}
              fill="var(--color-text-primary)"
            >
              {letter}
            </svg>
          ))}
        </div>
        <svg viewBox={FULL_VIEWBOX} className="loader-blade">
          <polygon points={FULL_BLADE} fill="var(--color-accent)" />
        </svg>
      </div>

      <p
        ref={metaRef}
        className="loader-meta absolute bottom-[clamp(24px,6svh,56px)] left-[clamp(16px,4vw,56px)] font-mono text-[10px] sm:text-[11px] uppercase leading-loose tracking-[0.24em] text-app-text-secondary"
      >
        Elia Abdel Massih
        <br />
        <span className="opacity-60">Portfolio · 2026</span>
      </p>

      {/* aria-hidden: it is decoration; the status role carries the state. */}
      <span
        ref={counterRef}
        aria-hidden="true"
        className="loader-odo absolute bottom-[clamp(16px,5svh,44px)] right-[clamp(16px,4vw,56px)] font-heading text-[clamp(56px,9vw,128px)] font-extrabold tracking-[-0.05em] tabular-nums text-app-text-primary"
      >
        <OdoSlot digits={['0', '1']} className="loader-odo-hundreds" />
        <OdoSlot digits={DIGITS} className="loader-odo-tens" />
        <OdoSlot digits={DIGITS} className="loader-odo-ones" />
      </span>
    </div>
  );
}

export default EamLoader;
