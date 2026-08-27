import { PRELOAD_SESSION_KEY, PRELOAD_COMPLETE_EVENT } from '../config/constants';

/**
 * Load-state coordination.
 *
 * One shared contract for "is the loader still up?", so the loader and the
 * hero cannot disagree about it. The single source of truth is the
 * `data-preload` attribute on <html>, which a blocking inline script in
 * layout.tsx stamps before the first paint.
 *
 * This exists because the old arrangement had no contract at all: the
 * Preloader held its visibility in React state and the hero animated on
 * mount, so their ordering was whatever the browser happened to do that
 * load. The observed result was hero, then loader, then hero again.
 *
 * Reading an attribute rather than React state matters — the value is
 * correct on the very first frame, before any component has mounted.
 */

export type PreloadState = 'loading' | 'ready';

/** Fired once, on the window, the moment the loader finishes its exit. */
export { PRELOAD_COMPLETE_EVENT };

/**
 * Current load state.
 *
 * Returns 'ready' when the attribute is missing, which covers SSR, a
 * disabled-JS visitor, and a failed inline script. Defaulting to 'ready'
 * is deliberate: every unknown resolves toward showing content, never
 * toward holding a hero animation that will then never be released.
 */
export function getPreloadState(): PreloadState {
  if (typeof document === 'undefined') return 'ready';
  return document.documentElement.getAttribute('data-preload') === 'loading'
    ? 'loading'
    : 'ready';
}

/** True while the loader is still covering the page. */
export function isPreloadPending(): boolean {
  return getPreloadState() === 'loading';
}

/**
 * Run `callback` once the loader is gone.
 *
 * Fires synchronously if the loader has already finished (or never ran),
 * which is the common case on every navigation after the first. Returns an
 * unsubscribe function; callers inside useGSAP or useEffect must invoke it
 * on cleanup so a listener never outlives its component.
 */
export function onPreloadComplete(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  if (!isPreloadPending()) {
    callback();
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(PRELOAD_COMPLETE_EVENT, handler, { once: true });
  return () => window.removeEventListener(PRELOAD_COMPLETE_EVENT, handler);
}

/**
 * Release the page: flip the attribute, remember it for this tab, and
 * notify listeners.
 *
 * Idempotent. The inline script in layout.tsx also flips the attribute on a
 * failsafe timeout, so this can legitimately be reached after the page has
 * already been released; the guard keeps that from firing the event twice.
 */
export function markPreloadComplete(): void {
  if (typeof document === 'undefined') return;
  if (!isPreloadPending()) return;

  document.documentElement.setAttribute('data-preload', 'ready');

  try {
    sessionStorage.setItem(PRELOAD_SESSION_KEY, '1');
  } catch {
    // Private mode denies sessionStorage. The loader then shows once per
    // navigation instead of once per session, which is a cosmetic
    // regression and not worth failing the release over.
  }

  window.dispatchEvent(new CustomEvent(PRELOAD_COMPLETE_EVENT));
}
