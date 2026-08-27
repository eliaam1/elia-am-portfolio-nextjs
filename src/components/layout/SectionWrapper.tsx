'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MQ, TIER, addMotionTiers, GSAP_EASE, DUR, REVEAL_START } from '../../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface SectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared section entrance reveal. Used by About, Skills, Services, Projects,
 * Experience, Testimonials and Contact.
 *
 * Visibility invariant (I1): the container carries NO authored opacity-0 class.
 * The hidden state is applied at runtime by GSAP inside a matchMedia branch, so
 * if JS fails, hydration is delayed, or no query matches, content stays
 * VISIBLE by default rather than waiting on a ScrollTrigger that may never
 * fire. Every branch is once-only and no branch's resting state is below
 * opacity 1.
 */
export const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      // Same shape at every width. Travel distance and duration are the
      // only things that scale, because 48px reads very differently on a
      // 1440px screen and a 375px one.
      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        gsap.fromTo(
          el,
          { opacity: 0, y: T.travel },
          {
            opacity: 1,
            y: 0,
            duration: T.dur,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
          }
        );
      });

      // Reduced motion — opacity only, no position change. Gentler, not zero.
      mm.add(MQ.reduced, () => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  const hasCustomPadding = className.includes('py-') || className.includes('pt-');
  const paddingClass = hasCustomPadding ? '' : 'py-16 md:py-24 lg:py-32';

  return (
    <section id={id} className={`${paddingClass} relative overflow-x-clip ${className}`}>
      <div
        ref={containerRef}
        className="w-full max-w-6xl mx-auto px-6 md:px-10 relative"
      >
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;
