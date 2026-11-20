import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isPreloadPending, onPreloadComplete } from './preload';

/**
 * One place to ask for a ScrollTrigger.refresh().
 *
 * A refresh re-measures every pinned and scroll-driven section; on this page
 * that is ~450ms of main thread. Before this existed, fonts loading, the
 * window load event, the Work scene finishing and every section's own rebuild
 * each fired their own, back to back, while the loader was animating: that was
 * the loader's lag.
 *
 * - Requests in the same frame coalesce into one refresh.
 * - While the loader is up, requests are only remembered; the loader runs the
 *   single refresh itself just before its exit (flushPendingRefresh), while
 *   the screen is still and nothing can visibly stutter.
 */

/** Long enough for the loader's exit (lift 1.2s, released 0.45s in) to finish. */
const AFTER_EXIT_MS = 900;

let frame = 0;
let deferred = false;
let unsubscribe: (() => void) | null = null;

export function requestRefresh(): void {
  if (typeof window === 'undefined') return;
  if (isPreloadPending()) {
    deferred = true;
    // Anything asked for after the loader's own refresh (or if the page is released by the
    // inline failsafe) runs once the exit has finished, never during it.
    unsubscribe ??= onPreloadComplete(() => {
      unsubscribe = null;
      window.setTimeout(() => deferred && requestRefresh(), AFTER_EXIT_MS);
    });
    return;
  }
  deferred = false;
  if (frame) return;
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    ScrollTrigger.refresh();
  });
}

/** The loader's pre-exit refresh: run now, and drop anything that was waiting. */
export function flushPendingRefresh(): void {
  deferred = false;
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
  ScrollTrigger.refresh();
}
