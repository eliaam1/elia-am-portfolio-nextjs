import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

/*
 * Effects for the Stack posters, kept apart from the choreography in
 * useStackPosters. Effects borrowed from the movyo and Lando clones are named
 * after where they come from.
 */

export const all = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] => Array.from(root.querySelectorAll<T>(sel));

/* ---------- a tool ↔ what it powers ---------- */

/** Lights a tool everywhere it appears: its row, the parts it powers ([data-techs]), their labels. */
export function lightTool(scene: HTMLElement, id: string | null): void {
  all(scene, '[data-tech]').forEach((el) => el.classList.toggle('is-on', el.dataset.tech === id));
  all(scene, '[data-techs]').forEach((el) => el.classList.toggle('is-on', !!id && (el.dataset.techs ?? '').split(' ').includes(id)));
}

/** Hover, focus and tap light a tool; a tap keeps it lit until tapped again. Returns the teardown. */
export function wireTools(scene: HTMLElement): () => void {
  let pinned: string | null = null;
  const target = (e: Event) => (e.target as Element | null)?.closest<HTMLElement>('[data-tech]') ?? null;
  const over = (e: Event) => {
    const t = target(e);
    if (t) lightTool(scene, t.dataset.tech ?? null);
  };
  const out = (e: Event) => {
    const next = (e as FocusEvent | PointerEvent).relatedTarget as Element | null;
    if (target(e) && !next?.closest('[data-tech]')) lightTool(scene, pinned);
  };
  const press = (id: string | null) =>
    all(scene, 'button[data-tech]').forEach((b) => b.setAttribute('aria-pressed', String(!!id && b.dataset.tech === id)));
  // click covers mouse, touch, Enter and Space: the tool items are buttons
  const tap = (e: Event) => {
    const t = target(e);
    if (!t) return;
    pinned = pinned === t.dataset.tech ? null : (t.dataset.tech ?? null);
    press(pinned);
    lightTool(scene, pinned);
  };
  const evs: Array<[string, (e: Event) => void]> = [['pointerover', over], ['pointerout', out], ['focusin', over], ['focusout', out], ['click', tap]];
  evs.forEach(([ev, fn]) => scene.addEventListener(ev, fn));
  return () => {
    evs.forEach(([ev, fn]) => scene.removeEventListener(ev, fn));
    press(null);
    lightTool(scene, null);
  };
}

/* ---------- Lando's handwriting: a marker scribble on each headline's key word ---------- */

/**
 * Puts each scribble on its key word, at the word's real pixel size (a stretched
 * viewBox with non-scaling strokes breaks the dash-draw into pieces in Chrome).
 * Uses layout offsets, so line-rise transforms in flight don't skew it.
 */
export function placeMarks(root: HTMLElement, boxes: ReadonlyArray<{ x: number; y: number; w: number; h: number }>): void {
  all(root, '.pn').forEach((pn, i) => {
    // SplitText may leave an empty copy of the span behind: measure the one that has the word
    const mk = all(pn, '.mk').find((m) => m.offsetWidth > 0);
    const box = pn.querySelector<HTMLElement>('.pn-copy');
    const svg = pn.querySelector<SVGSVGElement>('.mark');
    const b = boxes[i];
    if (!mk || !box || !svg || !b) return;
    let x = 0;
    let y = 0;
    let el: HTMLElement | null = mk;
    while (el && el !== box) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    const W = b.w * mk.offsetWidth;
    const H = b.h * mk.offsetHeight;
    Object.assign(svg.style, { left: `${x + b.x * mk.offsetWidth}px`, top: `${y + b.y * mk.offsetHeight}px`, width: `${W}px`, height: `${H}px` });
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
    // every command in these shapes takes x,y pairs, so the numbers alternate x, y
    all<SVGPathElement>(svg, 'path').forEach((path) => {
      let n = 0;
      const d = (path.dataset.d ?? '').replace(/-?\d*\.?\d+/g, (v) => (n++ % 2 ? (Number(v) * H) / 30 : (Number(v) * W) / 100).toFixed(1));
      path.setAttribute('d', d);
    });
  });
}

/* ---------- Lando's highlight bar: a block sweeps each line in, carrying the text, then shrinks ---------- */

export function barWipe(el: HTMLElement, tl: gsap.core.Timeline, t0: number, d: number): SplitText {
  const split = SplitText.create(el, { type: 'lines', linesClass: 'ol' });
  split.lines.forEach((ln, k) => {
    const bar = document.createElement('i');
    bar.className = 'ol-bar';
    ln.appendChild(bar);
    const at = t0 + k * 0.15 * d;
    tl.fromTo(ln, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6 * d, ease: 'power2.out' }, at).fromTo(
      bar,
      { scaleX: 1 },
      { scaleX: 0, duration: 0.6 * d, ease: 'power2.inOut' },
      at + 0.3 * d
    );
  });
  return split;
}

/** Numbers count up from zero (tabular figures, so nothing shifts while they run). */
export function countUp(el: HTMLElement, tl: gsap.core.Timeline, at: number, d: number): void {
  const to = Number(el.dataset.to);
  const pre = el.dataset.pre ?? '';
  const o = { v: 0 };
  const show = (v: number) => {
    el.textContent = `${pre}${Math.round(v)}`;
  };
  // completion callbacks pin the end figures even when a scrub jumps over the whole tween in one frame
  tl.fromTo(o, { v: 0 }, { v: to, duration: 0.8 * d, ease: 'power1.out', onUpdate: () => show(o.v), onComplete: () => show(to), onReverseComplete: () => show(0) }, at);
}

/* ---------- movyo's process line: the run log's rail, a dot riding it, steps lighting as it passes ---------- */

export interface RunLog {
  place: () => void;
  runTo: (p: number) => void;
  start: () => void;
  stop: () => void;
  wrap: HTMLElement;
}

export function runLog(root: HTMLElement): RunLog | null {
  const wrap = root.querySelector<HTMLElement>('.log-wrap');
  const rows = wrap ? all(wrap, '.log li') : [];
  const rail = wrap?.querySelector<HTMLElement>('.rail');
  const fill = wrap?.querySelector<HTMLElement>('.rail-fill');
  const dot = wrap?.querySelector<HTMLElement>('.rail-dot');
  if (!wrap || !rail || !fill || !dot || rows.length < 2) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  let lastP = -1;
  const runTo = (p: number) => {
    if (p === lastP) return;
    lastP = p;
    gsap.set(fill, { scaleY: p });
    gsap.set(dot, { top: `${p * 100}%` });
    rows.forEach((r, k) => r.classList.toggle('is-run', k / (rows.length - 1) <= p + 0.001));
  };
  return {
    wrap,
    runTo,
    place: () => {
      const top = first.offsetTop + first.offsetHeight / 2;
      Object.assign(rail.style, { top: `${top}px`, height: `${last.offsetTop + last.offsetHeight / 2 - top}px` });
    },
    start: () => {
      wrap.classList.add('is-play');
      lastP = -1;
      runTo(0);
    },
    stop: () => {
      lastP = -1;
      gsap.set([fill, dot], { clearProps: 'all' });
      wrap.classList.remove('is-play');
      rows.forEach((r) => r.classList.remove('is-run'));
    },
  };
}

/* ---------- Lando's fan: hover a checkout phone, it lifts and its neighbours spring aside ---------- */

export function wireFan(root: HTMLElement): () => void {
  const phones = all(root, '.story .ph');
  const set = (i: number) =>
    phones.forEach((o, j) =>
      gsap.to(o, {
        yPercent: j === i ? -6 : 0,
        xPercent: i < 0 || j === i ? 0 : j < i ? -9 : 9,
        scale: j === i ? 1.05 : 1,
        duration: 0.7,
        ease: 'elastic.out(1, .75)',
        delay: i < 0 ? 0 : Math.abs(j - i) * 0.03,
        overwrite: 'auto',
      })
    );
  const offs = phones.map((ph, i) => {
    const on = () => set(i);
    const off = () => set(-1);
    ph.addEventListener('pointerenter', on);
    ph.addEventListener('pointerleave', off);
    return () => {
      ph.removeEventListener('pointerenter', on);
      ph.removeEventListener('pointerleave', off);
    };
  });
  return () => {
    offs.forEach((f) => f());
    gsap.set(phones, { clearProps: 'xPercent,yPercent,scale' });
  };
}

/* ---------- movyo's magnet: a sticker leans toward a nearby cursor and springs back ---------- */

const MAGNET_RADIUS = 170;
const MAGNET_PULL = 0.3;

/**
 * `active` returns the index of the sticker on screen: only that one is measured,
 * at most once per frame (pointermove fires far more often than frames).
 */
export function magnets(stickers: HTMLElement[], active: () => number): { move: (e: PointerEvent) => void; stop: () => void } {
  const m = stickers.map((s) => ({
    s,
    x: gsap.quickTo(s, 'x', { duration: 0.8, ease: 'elastic.out(1, .4)' }),
    y: gsap.quickTo(s, 'y', { duration: 0.8, ease: 'elastic.out(1, .4)' }),
  }));
  let ev: PointerEvent | null = null;
  let raf = 0;
  const frame = () => {
    raf = 0;
    const a = m[active()];
    if (!ev || !a) return;
    m.forEach((o) => o !== a && (o.x(0), o.y(0)));
    const r = a.s.getBoundingClientRect();
    const dx = ev.clientX - (r.left + r.width / 2 - Number(gsap.getProperty(a.s, 'x')));
    const dy = ev.clientY - (r.top + r.height / 2 - Number(gsap.getProperty(a.s, 'y')));
    const near = Math.hypot(dx, dy) < MAGNET_RADIUS;
    a.x(near ? dx * MAGNET_PULL : 0);
    a.y(near ? dy * MAGNET_PULL : 0);
  };
  return {
    move: (e) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop: () => cancelAnimationFrame(raf),
  };
}
