import { useRef, useEffect } from 'react';

/**
 * Applies a restrained magnetic pull effect to the ref'd element on fine-pointer devices.
 * Avoids per-frame getBoundingClientRect() reads by caching bounding boxes on mouseenter.
 * Gated strictly behind (hover: hover) and (pointer: fine) and respects prefers-reduced-motion.
 *
 * @param strength The power of the pull effect (0 to 1). Defaults to 0.25.
 * @param radius The radius in pixels in which the effect triggers. Defaults to 40.
 */
export const useMagneticEffect = <T extends HTMLElement>(strength = 0.25, radius = 40) => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window === 'undefined') return;

    // Strict device & accessibility gate
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFinePointer || isReducedMotion) return;

    let cachedRect: DOMRect | null = null;

    const handleMouseEnter = () => {
      cachedRect = element.getBoundingClientRect();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!cachedRect) {
        cachedRect = element.getBoundingClientRect();
      }

      const centerX = cachedRect.left + cachedRect.width / 2;
      const centerY = cachedRect.top + cachedRect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const distance = Math.hypot(deltaX, deltaY);

      if (distance < radius) {
        element.style.transform = `translate(${deltaX * strength}px, ${deltaY * strength}px)`;
        element.style.transition = 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)';
      } else {
        element.style.transform = 'translate(0px, 0px)';
        element.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      }
    };

    const handleMouseLeave = () => {
      cachedRect = null;
      element.style.transform = 'translate(0px, 0px)';
      element.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.style.transform = '';
      element.style.transition = '';
    };
  }, [strength, radius]);

  return ref;
};

export default useMagneticEffect;
