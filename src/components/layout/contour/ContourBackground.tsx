'use client';

import { useEffect, useRef } from 'react';
import { createContourRenderer, type ContourRenderer } from './contourRenderer';

/** The sections the lines show through; the loop only runs while one is on screen. */
const SHOW_THROUGH = ['#profile'];
const TORCH_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
/** Per-frame easing at 60fps: the cursor follows at 4%, its pace settles at 2%. */
const MOUSE_EASE = 0.04;
const PACE_EASE = 0.02;
/** Cursor speed (viewport heights per second) is scaled by this into a 0..1 pace. */
const PACE_GAIN = 4;
/** Touch screens (no torch, drift only) draw at most this often. */
const TOUCH_FRAME_MS = 1000 / 30;
/** Height changes smaller than this (a mobile address bar) do not re-size the field. */
const MIN_HEIGHT_CHANGE = 160;

/**
 * Lime-torch contour lines: one fixed WebGL canvas behind every section
 * (z-index -1, under the body's own graphite). Slow topographic lines drift,
 * bend away from the cursor and light up lime around it. They show wherever a
 * section is transparent (Profile and the Stack deck); the hero, Statement,
 * Work and Contact keep their own surfaces.
 *
 * Paused off screen and in background tabs. Reduced motion: one still frame,
 * no torch. Touch screens: drift only. No WebGL: nothing is drawn.
 */
export function ContourBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: ContourRenderer | null = null;
    try {
      renderer = createContourRenderer(canvas);
    } catch {
      renderer = null; // a shader that will not compile: keep the plain page
    }
    if (!renderer) {
      canvas.style.display = 'none';
      return;
    }
    const r = renderer;
    const reduced = window.matchMedia(REDUCED_QUERY).matches;
    const torch = window.matchMedia(TORCH_QUERY);
    let lost = false;

    const aspect = () => window.innerWidth / window.innerHeight;
    const mouse = { x: aspect() / 2, y: 0.5, tx: aspect() / 2, ty: 0.5, pace: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerHeight;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    };

    let time = 0;
    let last = 0;
    let raf = 0;
    let onScreen = false;

    const drawStill = () => r.draw({ time, mouseX: mouse.x, mouseY: mouse.y, pace: 0, glow: 0 });
    // the canvas is opaque: paint once now so it never shows black before the loop starts
    drawStill();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!torch.matches && last && now - last < TOUCH_FRAME_MS) return;
      const dtS = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      const k = dtS * 60;
      time += dtS;
      const px = mouse.x;
      const py = mouse.y;
      mouse.x += (mouse.tx - mouse.x) * MOUSE_EASE * k;
      mouse.y += (mouse.ty - mouse.y) * MOUSE_EASE * k;
      const speed = Math.hypot(mouse.x - px, mouse.y - py) / dtS;
      mouse.pace += (Math.min(speed * PACE_GAIN, 1) - mouse.pace) * PACE_EASE * k;
      const lit = torch.matches ? 1 : 0;
      r.draw({ time, mouseX: mouse.x, mouseY: mouse.y, pace: mouse.pace * lit, glow: lit });
    };

    const run = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (lost || !onScreen || document.hidden) return;
      if (reduced) {
        drawStill();
        return;
      }
      // resume where the cursor is now, not with a burst of pace from while it was paused
      mouse.x = mouse.tx;
      mouse.y = mouse.ty;
      mouse.pace = 0;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      run();
    });
    SHOW_THROUGH.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) io.observe(el);
    });

    let size = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === size.w && Math.abs(h - size.h) < MIN_HEIGHT_CHANGE) return;
      size = { w, h };
      r.resize();
      drawStill();
    };
    // a lost context (GPU reset, app switch on phones) would leave a black or frozen
    // canvas over the page: hide it and let the body's graphite show instead
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      canvas.style.display = 'none';
    };
    canvas.addEventListener('webglcontextlost', onLost);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', run);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', run);
      canvas.removeEventListener('webglcontextlost', onLost);
      r.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="contour-bg" aria-hidden="true" />;
}

export default ContourBackground;
