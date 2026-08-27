'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLenis, destroyLenis } from '@/lib/lenis';

const BackgroundScene = dynamic(
  () => import('../layout/BackgroundScene'),
  { ssr: false }
);

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/manage-x7k9')) {
      destroyLenis();
      return;
    }

    initLenis();

    // Debounced refresh. ScrollTrigger.refresh() recalculates every trigger's
    // start/end, so firing it unthrottled on every resize event (dozens per
    // second during a window drag) is a real cost. ignoreMobileResize is set
    // in initLenis() so browser-chrome collapse doesn't reach here at all.
    let refreshTimer: number | undefined;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };

    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('orientationchange', scheduleRefresh);

    // Web fonts change text metrics, which changes every trigger's start/end.
    // Refresh once fonts are settled rather than guessing with a timeout.
    let cancelled = false;
    const fontsReady =
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.ready
        : Promise.resolve();

    fontsReady.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    const initialRefresh = window.setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
      window.clearTimeout(initialRefresh);
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('orientationchange', scheduleRefresh);
      destroyLenis();

      // NOTE: deliberately does NOT call ScrollTrigger.getAll().kill().
      // That reached outside this provider's ownership and killed triggers
      // belonging to useGSAP scopes that manage their own lifecycle. When a
      // section's reveal trigger was killed before firing, its element was
      // left stranded at opacity: 0 — the shape of the recurring
      // invisible-content bug. Each useGSAP scope reverts its own work.
    };
  }, [pathname]);

  const isManage = pathname.startsWith('/manage-x7k9');

  return (
    <>
      {!isManage && <BackgroundScene />}
      {children}
    </>
  );
}
