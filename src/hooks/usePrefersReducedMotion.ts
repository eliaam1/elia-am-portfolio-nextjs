'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe hook that returns true when the user has enabled
 * prefers-reduced-motion. Returns false on first render to avoid
 * hydration mismatches; flips to true after mount.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

export default usePrefersReducedMotion;
