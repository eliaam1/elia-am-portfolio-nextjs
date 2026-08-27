'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WEBGL_AMBIENT_BREAKPOINT } from '../../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

function ParticleField({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 150;

  // Generate sparse particle positions and colors (Accent + Neutral tones)
  const { positions, colors } = useMemo(() => {
    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);

    const accentColor = new THREE.Color('#0f3dde');
    const neutralColor = new THREE.Color('#888888');

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 22;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 22;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 14;

      // 30% Accent particles, 70% neutral theme particles
      const isAccent = Math.random() < 0.3;
      const c = isAccent ? accentColor : neutralColor;

      colArr[i * 3] = c.r;
      colArr[i * 3 + 1] = c.g;
      colArr[i * 3 + 2] = c.b;
    }

    return { positions: posArr, colors: colArr };
  }, [count]);

  const scrollRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        scrollRef.current = self.progress;
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || prefersReducedMotion) return;

    // Slow ambient drift
    pointsRef.current.rotation.y += delta * 0.02;
    pointsRef.current.rotation.x += delta * 0.01;

    // Subtle scroll-driven Y-drift parallax
    const targetY = -scrollRef.current * 2.0;
    pointsRef.current.position.y += (targetY - pointsRef.current.position.y) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function BackgroundScene() {
  const [isVisible, setIsVisible] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);

    // Gate is WEBGL_AMBIENT_BREAKPOINT (768px), NOT the motion breakpoint.
    // Scroll choreography now runs at every width, but this field renders
    // every frame while it is on screen, so phones opt out: a standing
    // render loop is a real battery and thermal cost for what is background
    // texture. Tablets are wide and powerful enough to keep it.
    const viewport = window.matchMedia(`(min-width: ${WEBGL_AMBIENT_BREAKPOINT}px)`);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncViewport = () => setIsNarrow(!viewport.matches);
    const syncMotion = () => setPrefersReducedMotion(motion.matches);

    syncViewport();
    syncMotion();

    viewport.addEventListener('change', syncViewport);
    motion.addEventListener('change', syncMotion);

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      viewport.removeEventListener('change', syncViewport);
      motion.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Under reduced motion, don't mount the canvas at all rather than mounting it
  // and freezing useFrame — a full-viewport moving background is exactly what
  // that preference is asking us not to create.
  if (!mounted || !isVisible || isNarrow || prefersReducedMotion) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)}
        style={{ pointerEvents: 'none' }}
      >
        <ParticleField prefersReducedMotion={prefersReducedMotion} />
      </Canvas>
    </div>
  );
}
