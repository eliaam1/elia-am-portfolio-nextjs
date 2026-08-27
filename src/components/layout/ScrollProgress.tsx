'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const ScrollProgress: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  // Normalized document scroll tracking 0 -> 1 via scaleX GPU transform
  useGSAP(
    () => {
      const el = barRef.current;
      if (!el) return;

      gsap.to(el, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    },
    { scope: barRef }
  );

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 h-[2px] bg-app-accent z-[9999] origin-left pointer-events-none"
      style={{ transform: 'scaleX(0)' }}
    />
  );
};

export default ScrollProgress;
