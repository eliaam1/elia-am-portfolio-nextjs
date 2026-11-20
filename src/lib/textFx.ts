import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/** The EAM blade, tan(22.6deg). */
const BLADE = 0.416;
const LINE_MASK_PAD = '0.18em';
/** Share of a line's height the wipe's text window extends above and below it. */
const DESCENDER_PAD = 0.2;

/* ------------------------------------------------------------------------ */
/* 1 · Blade wipe: a bar cut at the blade angle sweeps across each line,     */
/*     carrying the text in, then pulls away (after landonorris.com's         */
/*     data-anim-high). Graphite by default; lime only on key lines.          */
/* ------------------------------------------------------------------------ */

export const WIPE = {
  /** Seconds the leading edge takes to cross a line. */
  duration: 0.6,
  /** The bar starts pulling away this long after it starts. */
  retract: 0.3,
  /** Lines cascade this far apart. */
  stagger: 0.15,
  /** Bar colours: quiet graphite on body copy, lime on key lines. */
  quiet: '#2b322c',
  key: '#bde66a',
} as const;

export interface BladeWipeOptions {
  /** Lime bar on every line of this element (titles, key facts). */
  isKey?: boolean;
}

/**
 * Splits `el` into lines and returns a paused timeline that wipes them in.
 * Lines holding `[data-wipe-key]` (every line when `el` itself carries it, or
 * when `isKey`) get the lime
 * bar. The caller places the timeline (own trigger or a parent timeline) and
 * must revert the returned split; useGSAP / gsap.context do it when it is
 * created inside their scope.
 */
export function bladeWipe(el: HTMLElement, { isKey = false }: BladeWipeOptions = {}): { tl: gsap.core.Timeline; split: SplitText } {
  // aria 'none': the lines are real text; 'auto' would hide them behind an aria-label a <p> cannot carry
  const split = SplitText.create(el, { type: 'lines', linesClass: 'fx-wipe-line', aria: 'none' });
  const tl = gsap.timeline({ paused: true });
  const allKey = isKey || el.hasAttribute('data-wipe-key');
  (split.lines as HTMLElement[]).forEach((line, i) => {
    const w = line.offsetWidth;
    const s = line.offsetHeight * BLADE;
    const bar = document.createElement('span');
    bar.className = 'fx-wipe-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.style.width = `${w + s + 2 * line.offsetHeight * DESCENDER_PAD * BLADE}px`;
    bar.style.background = allKey || line.querySelector('[data-wipe-key]') ? WIPE.key : WIPE.quiet;
    line.appendChild(bar);

    // head: the leading edge; tail: the trailing edge of the bar. Both lean at the blade angle.
    const p = { head: 0, tail: 0 };
    // the text's own window reaches past the line box so descenders are not shaved mid-wipe
    const pad = line.offsetHeight * DESCENDER_PAD;
    const se = s * (1 + (2 * pad) / line.offsetHeight);
    const draw = () => {
      const t = Math.min(p.tail, p.head);
      // nothing of the text shows until the bar's leading edge has reached it
      line.style.clipPath = `polygon(${-se}px ${-pad}px, ${p.head}px ${-pad}px, ${p.head - se}px calc(100% + ${pad}px), ${-se}px calc(100% + ${pad}px))`;
      bar.style.clipPath = `polygon(${t}px 0, ${p.head}px 0, ${p.head - s}px 100%, ${t - s}px 100%)`;
    };
    const done = () => {
      line.style.clipPath = 'none';
      bar.style.visibility = 'hidden';
    };
    draw();
    const at = i * WIPE.stagger;
    const end = w + se;
    tl.to(p, { head: end, duration: WIPE.duration, ease: 'power2.out', onUpdate: draw }, at).to(
      p,
      { tail: end, duration: WIPE.duration, ease: 'power2.inOut', onUpdate: draw, onComplete: done },
      at + WIPE.retract
    );
  });
  return { tl, split };
}

/** Where a wiped block starts: as it comes into view, never before (an off-screen wipe is a wasted one). */
export const WIPE_START = 'top 90%';

/**
 * Blade-wipes `el` once, when it scrolls into view. Its own trigger rather than
 * a parent timeline's, so it cannot play while still below the fold.
 */
export function wipeOnEnter(el: HTMLElement, options?: BladeWipeOptions): SplitText {
  const { tl, split } = bladeWipe(el, options);
  ScrollTrigger.create({ trigger: el, start: WIPE_START, once: true, onEnter: () => tl.play() });
  return split;
}

/* ------------------------------------------------------------------------ */
/* 3 · Oval lens: each line rises into an oval that opens from below, and    */
/*     its letters settle from the centre out (after data-oval-scroll, in     */
/*     the rising direction the site's titles use).                           */
/* ------------------------------------------------------------------------ */

export const LENS = {
  duration: 1.5,
  ease: 'power2.inOut',
  stagger: 0.15,
  /** Lines and letters start this far below their place (yPercent). */
  drop: 40,
  closed: 'ellipse(20% 0% at 50% 100%)',
  open: 'ellipse(100% 120% at 50% 100%)',
} as const;

/** Splits `el` and plays the lens once when `trigger` fires. Returns the split for reverting. */
export function ovalLens(el: HTMLElement, trigger: ScrollTrigger.Vars): SplitText {
  const split = SplitText.create(el, { type: 'lines,chars', mask: 'lines', charsClass: 'fx-lens-ch' });
  split.masks.forEach((m) => {
    const mask = m as HTMLElement;
    mask.style.paddingBottom = LINE_MASK_PAD;
    mask.style.marginBottom = `-${LINE_MASK_PAD}`;
  });
  const tl = gsap.timeline({ scrollTrigger: trigger });
  tl.fromTo(split.masks, { clipPath: LENS.closed }, { clipPath: LENS.open, duration: LENS.duration, ease: LENS.ease, stagger: LENS.stagger, clearProps: 'clipPath' }, 0);
  (split.lines as HTMLElement[]).forEach((line, i) => {
    const chars = Array.from(line.querySelectorAll<HTMLElement>('.fx-lens-ch'));
    tl.fromTo(line, { yPercent: LENS.drop }, { yPercent: 0, duration: LENS.duration, ease: LENS.ease }, LENS.stagger + 0.1 * i).fromTo(
      chars,
      { yPercent: LENS.drop },
      { yPercent: 0, duration: LENS.duration, ease: LENS.ease, stagger: { amount: 0.015 * chars.length, from: 'center' } },
      LENS.stagger * i
    );
  });
  return split;
}

/* ------------------------------------------------------------------------ */
/* 2 · Letter roll: on hover / focus each letter rolls up and a lime copy    */
/*     rolls in from below. The copy is a text-shadow, not a second node     */
/*     (after data-anim="text-hover"). Markup: <span data-roll>Text</span>    */
/*     inside the link; data-roll="ink" for text on a lime surface.           */
/* ------------------------------------------------------------------------ */

export const ROLL = { duration: 0.6, stagger: 0.02, ease: 'power3.out' } as const;
/** Hover-only devices with motion allowed; touch screens keep the plain links. */
export const ROLL_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/** Wires every [data-roll] under `root`. Returns the teardown. */
export function letterRoll(root: ParentNode): () => void {
  const offs: Array<() => void> = [];
  root.querySelectorAll<HTMLElement>('[data-roll]').forEach((text) => {
    const host = text.closest<HTMLElement>('a, button');
    if (!host) return;
    const split = SplitText.create(text, { type: 'words,chars', wordsClass: 'fx-roll-w', charsClass: 'fx-roll-ch' });
    text.classList.add('is-rolling');
    const go = (yPercent: number) => () =>
      gsap.to(split.chars, { yPercent, duration: ROLL.duration, ease: ROLL.ease, overwrite: true, stagger: ROLL.stagger });
    const up = go(-100);
    const down = go(0);
    host.addEventListener('mouseenter', up);
    host.addEventListener('mouseleave', down);
    host.addEventListener('focusin', up);
    host.addEventListener('focusout', down);
    // a click can hide the link (the island folds) before mouseleave ever fires
    host.addEventListener('click', down);
    offs.push(() => {
      host.removeEventListener('click', down);
      host.removeEventListener('mouseenter', up);
      host.removeEventListener('mouseleave', down);
      host.removeEventListener('focusin', up);
      host.removeEventListener('focusout', down);
      gsap.killTweensOf(split.chars);
      text.classList.remove('is-rolling');
      split.revert();
    });
  });
  return () => offs.forEach((off) => off());
}
