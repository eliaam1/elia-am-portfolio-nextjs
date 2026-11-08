'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export const CustomCursor: React.FC = () => {
  const isFinePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const prefersReduced = usePrefersReducedMotion();

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const labelTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer || prefersReduced) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const labelText = labelTextRef.current;
    if (!dot || !ring || !label || !labelText) return;

    /*
     * Contextual labels. Any element with data-cursor-label="Text" swaps the
     * ring for a larger labelled circle while the pointer is inside it; the
     * nearest labelled ancestor wins, so a section can say "Scroll" and a
     * button inside it "Visit". data-cursor-fill fills the circle lime.
     */
    const setLabelX = gsap.quickTo(label, 'x', { duration: 0.35, ease: 'power3' });
    const setLabelY = gsap.quickTo(label, 'y', { duration: 0.35, ease: 'power3' });
    let labelled: HTMLElement | null = null;
    const updateLabel = (target: HTMLElement | null) => {
      const el = target?.closest<HTMLElement>('[data-cursor-label]') ?? null;
      if (el === labelled) return;
      labelled = el;
      if (!el) {
        gsap.to(label, { scale: 0.3, opacity: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(ring, { autoAlpha: 1, duration: 0.2, overwrite: 'auto' });
        return;
      }
      labelText.textContent = el.dataset.cursorLabel ?? '';
      label.dataset.fill = String(el.hasAttribute('data-cursor-fill'));
      gsap.to(label, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(ring, { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
    };

    // Fast quickTo setters for 120fps hardware-composited tracking
    const setDotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const setDotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const setRingX = gsap.quickTo(ring, 'x', { duration: 0.3, ease: 'power2.out' });
    const setRingY = gsap.quickTo(ring, 'y', { duration: 0.3, ease: 'power2.out' });

    let isVisible = false;

    const handleMouseMove = (e: MouseEvent) => {
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
      setLabelX(e.clientX);
      setLabelY(e.clientY);

      if (!isVisible) {
        isVisible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.2, overwrite: 'auto' });
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
      // leaving the window never fires mouseover, so reset the label here
      labelled = null;
      gsap.to(label, { scale: 0.3, opacity: 0, duration: 0.2, overwrite: 'auto' });
      gsap.set(ring, { visibility: 'visible' });
      gsap.to([dot, ring], { opacity: 0, duration: 0.2, overwrite: 'auto' });
    };

    const handleMouseEnter = () => {
      isVisible = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.2, overwrite: 'auto' });
    };

    // Event delegation for contextual interactive hover states — zero mutation observer
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      updateLabel(target);

      const interactive = target.closest('a, button, [role="button"], input, textarea, select, [data-cursor="pointer"]');
      if (interactive) {
        gsap.to(ring, {
          scale: 1.5,
          opacity: 0.7,
          backgroundColor: 'rgba(15, 61, 222, 0.15)',
          duration: 0.25,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 0.5,
          duration: 0.2,
          overwrite: 'auto',
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest('a, button, [role="button"], input, textarea, select, [data-cursor="pointer"]');
      if (interactive) {
        gsap.to(ring, {
          scale: 1,
          opacity: 1,
          backgroundColor: 'transparent',
          duration: 0.25,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 1,
          duration: 0.2,
          overwrite: 'auto',
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isFinePointer, prefersReduced]);

  if (!isFinePointer || prefersReduced) return null;

  return (
    <>
      {/* Center sharp dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-app-accent pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 opacity-0 mix-blend-difference"
        aria-hidden="true"
      />
      {/* Outer spring-smoothed follower ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-7 h-7 rounded-full border border-app-accent/80 pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 opacity-0 mix-blend-difference"
        aria-hidden="true"
      />
      {/* Labelled circle for [data-cursor-label] regions ("Scroll", "Visit", ...) */}
      <div
        ref={labelRef}
        data-fill="false"
        className="fixed top-0 left-0 grid h-[76px] w-[76px] place-items-center rounded-full border border-app-accent/70 pointer-events-none z-[9997] -translate-x-1/2 -translate-y-1/2 scale-[0.3] opacity-0 text-app-accent data-[fill=true]:bg-app-accent data-[fill=true]:text-app-on-accent"
        aria-hidden="true"
      >
        <span ref={labelTextRef} className="font-mono text-[10px] uppercase tracking-[0.18em]" />
      </div>
    </>
  );
};

export default CustomCursor;
