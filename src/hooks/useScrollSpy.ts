import { useState, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Tracks the section currently in view using GSAP ScrollTrigger callbacks.
 *
 * @param ids Array of section HTML element IDs to monitor.
 * @param _offset Optional offset parameter preserved for API compatibility.
 *
 * Implementation note: the effect keys on a joined string, not on the array
 * identity. Callers build the array inline (`NAV_LINKS.map(l => l.id)`), so a
 * new identity arrived on every render. Combined with this hook's own
 * setActiveId, that produced a feedback loop: scroll -> onToggle -> setState
 * -> re-render -> new array identity -> effect cleanup kills all 8 triggers
 * -> 100ms setTimeout -> recreate. The spy tore itself down and rebuilt, with
 * a 100ms blind window, on every section change.
 */
export const useScrollSpy = (ids: readonly string[], _offset?: number): string => {
  const [activeId, setActiveId] = useState<string>(ids[0] || '');

  // Value-based dependency key — stable across renders for the same ids.
  const idsKey = ids.join('|');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableIds = useMemo(() => idsKey.split('|').filter(Boolean), [idsKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || stableIds.length === 0) return;

    const triggers: ScrollTrigger[] = [];

    // One frame of grace so sections have laid out before measuring.
    const raf = requestAnimationFrame(() => {
      stableIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: 'top 45%',
            end: 'bottom 45%',
            onToggle: (self) => {
              if (self.isActive) setActiveId(id);
            },
          })
        );
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      triggers.forEach((t) => t.kill());
    };
  }, [stableIds]);

  return activeId;
};

export default useScrollSpy;
