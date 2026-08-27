import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LENIS_CONFIG } from '../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollState {
  scrollY: number;
  velocity: number;
  direction: number; // 1 (down), -1 (up), 0 (idle)
  progress: number;
}

const mutableScrollState: ScrollState = {
  scrollY: 0,
  velocity: 0,
  direction: 0,
  progress: 0,
};

/**
 * Exposes a lightweight, mutable scroll state signal for non-rendering consumers
 * (such as Three.js / WebGL particle fields, velocity-weighted parallax, and momentum transitions).
 */
export function getScrollState(): Readonly<ScrollState> {
  return mutableScrollState;
}

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;
let scrollHandler: ((e: { scroll: number; velocity: number; direction: number; progress: number }) => void) | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;

  // Always tear down completely first
  destroyLenis();

  // Users who ask for reduced motion get native unsmoothed scroll
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    ScrollTrigger.config({ ignoreMobileResize: true });
    return null;
  }

  // Tight, tracked momentum. See LENIS_CONFIG in config/motion.ts for why
  // this is lerp-based rather than the previous duration + exponential ease.
  lenisInstance = new Lenis({
    lerp: LENIS_CONFIG.lerp,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: LENIS_CONFIG.wheelMultiplier,
    touchMultiplier: LENIS_CONFIG.touchMultiplier,
  });

  // Synchronize Lenis scroll position with GSAP ScrollTrigger and update mutable scrollState
  scrollHandler = (e: { scroll: number; velocity: number; direction: number; progress: number }) => {
    mutableScrollState.scrollY = e.scroll || 0;
    mutableScrollState.velocity = e.velocity || 0;
    mutableScrollState.direction = e.direction || 0;
    mutableScrollState.progress = e.progress || 0;
    ScrollTrigger.update();
  };
  lenisInstance.on('scroll', scrollHandler);

  // Drive Lenis from the GSAP ticker so both share one rAF loop
  tickerCallback = (time: number) => {
    lenisInstance?.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);

  // Disable GSAP lag smoothing to prevent visual stuttering
  gsap.ticker.lagSmoothing(0);

  // Don't refresh on mobile browser-chrome resize
  ScrollTrigger.config({ ignoreMobileResize: true });

  return lenisInstance;
}

export function destroyLenis() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }

  if (lenisInstance) {
    if (scrollHandler) {
      lenisInstance.off('scroll', scrollHandler);
    }
    lenisInstance.destroy();
    lenisInstance = null;
  }

  mutableScrollState.scrollY = 0;
  mutableScrollState.velocity = 0;
  mutableScrollState.direction = 0;
  mutableScrollState.progress = 0;
  scrollHandler = null;
}
