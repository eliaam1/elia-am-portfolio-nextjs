import { getLenis } from './lenis';

/** Seconds a smooth jump takes. */
const JUMP_DURATION = 1.4;

/**
 * Scrolls to a section by id, or to the top for `null` / 'hero'. Smooth through
 * Lenis; native and instant when Lenis is off (reduced motion). Going to the top
 * also moves keyboard focus to the start of the content.
 */
export function scrollToSection(id: string | null): void {
  const toTop = id === null || id === 'hero';
  const el = toTop ? null : document.getElementById(id);
  if (!toTop && !el) return;
  if (toTop) document.getElementById('main-content')?.focus({ preventScroll: true });
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el ?? 0, { duration: JUMP_DURATION });
    return;
  }
  if (el) el.scrollIntoView();
  else window.scrollTo({ top: 0 });
}
