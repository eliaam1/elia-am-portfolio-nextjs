'use client';

import React, { useRef, useCallback, ReactNode, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface ProjectCardTiltProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // degrees
}

/**
 * Wraps the featured project card with a restrained 3D mouse-tilt effect.
 * Uses Framer Motion springs for smooth tracking.
 * Strictly gated behind (hover: hover) and (pointer: fine) and respects prefers-reduced-motion.
 */
export const ProjectCardTilt: React.FC<ProjectCardTiltProps> = ({
  children,
  className = '',
  maxTilt = 5,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [isFinePointer, setIsFinePointer] = useState(false);
  const cachedRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsFinePointer(mq.matches);

      const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 120, damping: 18, mass: 0.3 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // 0..1 → -maxTilt..+maxTilt
  const rotateY = useTransform(x, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(y, [0, 1], [maxTilt, -maxTilt]);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      cachedRectRef.current = ref.current.getBoundingClientRect();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced || !isFinePointer) return;

      if (!cachedRectRef.current && ref.current) {
        cachedRectRef.current = ref.current.getBoundingClientRect();
      }

      const rect = cachedRectRef.current;
      if (!rect) return;

      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      mouseX.set(Math.max(0, Math.min(1, px)));
      mouseY.set(Math.max(0, Math.min(1, py)));
    },
    [reduced, isFinePointer, mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    cachedRectRef.current = null;
    if (reduced || !isFinePointer) return;
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [reduced, isFinePointer, mouseX, mouseY]);

  if (reduced || !isFinePointer) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1200,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ProjectCardTilt;
