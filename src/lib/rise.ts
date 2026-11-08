import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * Section titles rise into place line by line (movyo's headingReveals).
 *
 * Each line sits in its own mask; the mask is padded so descenders are not
 * shaved off by the clip. Fires once: replaying it on every pass fights the
 * reader. Callers own the returned split and must revert it (useGSAP does
 * this when the split is created inside its scope).
 */
const LINE_MASK_PAD = '0.18em';

export const RISE = {
  yPercent: 105,
  duration: 1.3,
  stagger: 0.1,
  ease: 'power4.out',
  start: 'top 86%',
} as const;

/** Eyebrow labels and leads beside a rising title fade up. */
export const FADE_UP = { y: 24, duration: 0.9, ease: 'power3.out', start: 'top 90%' } as const;

export function splitLines(el: HTMLElement, words = false): SplitText {
  const split = SplitText.create(el, { type: words ? 'lines,words' : 'lines', mask: 'lines' });
  split.masks.forEach((m) => {
    const mask = m as HTMLElement;
    mask.style.paddingBottom = LINE_MASK_PAD;
    mask.style.marginBottom = `-${LINE_MASK_PAD}`;
  });
  return split;
}

const RESIZE_DEBOUNCE_MS = 200;

/**
 * Runs `build` in its own GSAP context and rebuilds it when line breaks can
 * change: once web fonts finish loading (if they had not yet) and whenever
 * the viewport WIDTH changes. Height-only resizes (a mobile address bar) are
 * ignored. Line splits measured before either event would leave hard-wrapped
 * lines that re-wrap inside their masks. Returns the teardown.
 */
export function rebuildOnReflow(build: () => void | (() => void)): () => void {
  let ctx: gsap.Context | null = null;
  let cancelled = false;
  const run = () => {
    ctx?.revert();
    ctx = gsap.context(build);
  };
  const rerun = () => {
    if (cancelled) return;
    run();
    ScrollTrigger.refresh();
  };
  run();

  if (document.fonts.status !== 'loaded') document.fonts.ready.then(rerun);

  let lastWidth = window.innerWidth;
  let timer: number | undefined;
  const onResize = () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    window.clearTimeout(timer);
    timer = window.setTimeout(rerun, RESIZE_DEBOUNCE_MS);
  };
  window.addEventListener('resize', onResize);

  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    window.removeEventListener('resize', onResize);
    ctx?.revert();
  };
}

/** Rise a title's lines, starting at `trigger` (defaults to the title itself). */
export function riseTitle(
  el: HTMLElement,
  trigger: ScrollTrigger.Vars = { trigger: el, start: RISE.start }
): SplitText {
  const split = splitLines(el);
  gsap.from(split.lines, {
    yPercent: RISE.yPercent,
    duration: RISE.duration,
    stagger: RISE.stagger,
    ease: RISE.ease,
    scrollTrigger: trigger,
  });
  return split;
}

export function fadeUp(els: gsap.TweenTarget, trigger: ScrollTrigger.Vars): void {
  gsap.from(els, { y: FADE_UP.y, autoAlpha: 0, duration: FADE_UP.duration, ease: FADE_UP.ease, scrollTrigger: trigger });
}
