'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { NAV_LINKS } from '../../config/constants';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { getLenis } from '../../lib/lenis';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const ScrollPath: React.FC = () => {
  const sectionIds = NAV_LINKS.map((link) => link.id);
  const activeSectionId = useScrollSpy(sectionIds);
  const fillRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Direct GPU scaleY scrub tracking total page scroll
  useGSAP(
    () => {
      const fill = fillRef.current;
      if (!fill) return;

      gsap.to(fill, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    },
    { scope: railRef }
  );

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(element, { offset: -80, duration: 1.2 });
    } else {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={railRef}
      className="fixed left-6 xl:left-8 2xl:left-12 top-1/2 -translate-y-1/2 h-[50vh] w-6 z-40 hidden xl:flex flex-col items-center pointer-events-none select-none"
    >
      {/* Vertical Path Rail */}
      <div className="relative h-full w-[2px] bg-app-border/30 rounded-full flex flex-col justify-between items-center pointer-events-auto">
        {/* Active Accent Fill Line — pure GPU transform */}
        <div
          ref={fillRef}
          className="absolute top-0 left-0 right-0 h-full bg-app-accent rounded-full origin-top"
          style={{ transform: 'scaleY(0)' }}
        />

        {/* Section Indicator Nodes */}
        {NAV_LINKS.map((link, index) => {
          const isActive = activeSectionId === link.id;
          const percentage = (index / (NAV_LINKS.length - 1)) * 100;

          return (
            <button
              key={link.id}
              onClick={() => handleScrollTo(link.id)}
              type="button"
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer group focus:outline-none z-10"
              style={{ top: `${percentage}%` }}
              aria-label={`Scroll to ${link.label}`}
            >
              {/* Single Clean Node Dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full border transition-[border-color,background-color,transform] duration-200 ${
                  isActive
                    ? 'bg-app-accent border-app-accent scale-125'
                    : 'bg-app-surface border-app-border/80 group-hover:border-app-accent/80 group-hover:scale-110'
                }`}
              />

              {/* Text Tooltip */}
              <div className="absolute left-7 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-200 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-app-surface border border-app-border/80 px-2.5 py-1.5 rounded-lg shadow-lg">
                  <span className="font-mono text-[9px] text-app-accent font-semibold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-sans text-[10px] text-app-text-primary font-bold uppercase tracking-wider whitespace-nowrap">
                    {link.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ScrollPath;
