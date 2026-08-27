'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { cn } from '../../lib/utils';
import { WEBGL_AMBIENT_BREAKPOINT } from '../../config/motion';
import { getScrollState } from '../../lib/lenis';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'> & {
  size?: number;
  opacity?: number;
  sizeAttenuation?: boolean;
  /** Optional normalized scroll progress ref (0 to 1) for direct ScrollTrigger synchronization */
  scrollProgressRef?: React.MutableRefObject<number>;
};

/**
 * Ambient animated dot field (WebGL).
 * Synchronized with Lenis scroll velocity, ScrollTrigger progress, and GSAP ticker.
 *
 * Performance Gates:
 *  1. Viewport   — not rendered below WEBGL_AMBIENT_BREAKPOINT (768px),
 *                  so tablets get the field and phones do not. Phones
 *                  skip it because it renders every frame while on
 *                  screen, and that is a battery cost for background
 *                  texture.
 *  2. Motion     — not rendered under prefers-reduced-motion.
 *  3. Visibility — ticker rendering paused when off-screen (IntersectionObserver) or
 *                  when the tab is hidden.
 */
export function DottedSurface({
  className,
  size = 8,
  opacity = 0.8,
  sizeAttenuation = true,
  scrollProgressRef,
  ...props
}: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Gates 1 + 2. Resolved after mount so SSR and hydration agree.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const viewport = window.matchMedia(`(min-width: ${WEBGL_AMBIENT_BREAKPOINT}px)`);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => setEnabled(viewport.matches && !motion.matches);

    evaluate();
    viewport.addEventListener('change', evaluate);
    motion.addEventListener('change', evaluate);

    return () => {
      viewport.removeEventListener('change', evaluate);
      motion.removeEventListener('change', evaluate);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const SEPARATION = 150;
    const AMOUNTX = 30;
    const AMOUNTY = 45; // 1350 points
    const TOTAL = AMOUNTX * AMOUNTY;

    const getSize = () => ({
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
    });

    const initial = getSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      initial.width / initial.height,
      1,
      10000
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(initial.width, initial.height);
    container.appendChild(renderer.domElement);

    // Alternating two-colour pattern: #0f3dde / #6b6b6b
    const colorA = new THREE.Color('#0f3dde');
    const colorB = new THREE.Color('#6b6b6b');

    const positions = new Float32Array(TOTAL * 3);
    const colors = new Float32Array(TOTAL * 3);

    let p = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[p * 3] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        positions[p * 3 + 1] = 0; // animated
        positions[p * 3 + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        const c = p % 2 === 0 ? colorA : colorB;
        colors[p * 3] = c.r;
        colors[p * 3 + 1] = c.g;
        colors[p * 3 + 2] = c.b;
        p++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size,
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity,
      sizeAttenuation,
      fog: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const positionArray = positionAttribute.array as Float32Array;

    let count = 0;
    let onScreen = true;
    let running = false;

    const renderFrame = () => {
      if (!onScreen || document.hidden) return;

      const scrollState = getScrollState();
      const progress = scrollProgressRef ? scrollProgressRef.current : Math.min((scrollState.scrollY || 0) / 800, 1);
      
      // Modulate particle wave velocity based on scroll momentum
      const velocityInfluence = Math.min(Math.abs(scrollState.velocity || 0) * 0.012, 0.2);
      const waveSpeed = 0.05 + velocityInfluence;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positionArray[i * 3 + 1] =
            Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
          i++;
        }
      }
      positionAttribute.needsUpdate = true;

      // Coherent camera pitch and depth response to scroll progress & velocity
      const pitchOffset = progress * 75;
      const momentumTilt = (scrollState.velocity || 0) * 0.15;
      camera.position.y = 355 - pitchOffset - Math.max(-25, Math.min(25, momentumTilt));
      camera.position.z = 1220 - progress * 110;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      count += waveSpeed;
    };

    const start = () => {
      if (running) return;
      running = true;
      gsap.ticker.add(renderFrame);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(renderFrame);
    };

    const sync = () => {
      if (onScreen && !document.hidden) start();
      else stop();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: '100px' }
    );
    observer.observe(container);

    document.addEventListener('visibilitychange', sync);

    const handleResize = () => {
      const next = getSize();
      camera.aspect = next.width / next.height;
      camera.updateProjectionMatrix();
      renderer.setSize(next.width, next.height);
      if (!running) renderFrame();
    };
    window.addEventListener('resize', handleResize);

    renderFrame();
    sync();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', handleResize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [enabled, size, opacity, sizeAttenuation, scrollProgressRef]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      {...props}
    />
  );
}

export default DottedSurface;
