'use client';

import React, { useRef } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Button from '../ui/Button';
import DottedSurface from '../ui/DottedSurface';
import {
  MQ,
  TIER,
  addMotionTiers,
  HERO_CHOREOGRAPHY_CONFIG,
  HERO_NAME_MOTION_CONFIG,
} from '../../config/motion';
import { getScrollState, getLenis } from '../../lib/lenis';
import type { SiteSettings } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export interface HeroLenisConfig {
  enableLetterChoreography?: boolean;
  enableVelocityDistortion?: boolean;
  enableCursorInfluence?: boolean;
  enableThreeJsBackground?: boolean;
  enableEntranceReveal?: boolean;
}

export interface HeroLenisExperienceProps {
  settings: SiteSettings | null;
  loading: boolean;
  config?: HeroLenisConfig;
}

const DEFAULT_CONFIG: HeroLenisConfig = {
  enableLetterChoreography: true,
  enableVelocityDistortion: true,
  enableCursorInfluence: true,
  enableThreeJsBackground: true,
  enableEntranceReveal: true,
};

interface TypographicLine {
  id: string;
  word: {
    id: string;
    chars: string[];
  };
  /**
   * Where the per-character stagger originates. Replaces the previous
   * `entryDirection`, which flew whole lines in from outside the viewport
   * at 0.75x viewport distance apiece.
   */
  staggerFrom: 'start' | 'end' | 'center';
  /**
   * Per-character stagger offset (s). Only the stagger lives here — the
   * travel duration and curve are CSS (.hero-glyph in globals.css).
   */
  stagger: number;
}

/**
 * Three lines, three stagger origins, so each reads as a distinct gesture
 * without any of them leaving its own layout box:
 *   ELIA    left to right
 *   ABDEL   right to left
 *   MASSIH  outward from the centre
 */
const THREE_NAME_LINES: TypographicLine[] = [
  {
    id: 'name-line-1',
    word: { id: 'w-elia', chars: ['E', 'L', 'I', 'A'] },
    staggerFrom: 'start',
    stagger: HERO_NAME_MOTION_CONFIG.line1Stagger,
  },
  {
    id: 'name-line-2',
    word: { id: 'w-abdel', chars: ['A', 'B', 'D', 'E', 'L'] },
    staggerFrom: 'end',
    stagger: HERO_NAME_MOTION_CONFIG.line2Stagger,
  },
  {
    id: 'name-line-3',
    word: { id: 'w-massih', chars: ['M', 'A', 'S', 'S', 'I', 'H'] },
    staggerFrom: 'center',
    stagger: HERO_NAME_MOTION_CONFIG.line3Stagger,
  },
];

/** Milliseconds between the start of one line and the start of the next. */
const LINE_OVERLAP_MS = 180;

/** First secondary element starts here; the name is still finishing. */
const SECONDARY_START_MS = 540;
const SECONDARY_STAGGER_MS = 50;

/**
 * Entrance delay for one glyph, in milliseconds.
 *
 * Lines overlap rather than queue, and each line staggers from a different
 * origin so the three read as distinct gestures. Computed during render so
 * the value is identical on server and client, and so the entrance needs no
 * JS sequencer at all.
 */
function glyphDelayMs(line: TypographicLine, lineIndex: number, charIndex: number): number {
  const count = line.word.chars.length;
  const step = line.stagger * 1000;

  let position: number;
  if (line.staggerFrom === 'end') {
    position = count - 1 - charIndex;
  } else if (line.staggerFrom === 'center') {
    position = Math.abs(charIndex - (count - 1) / 2);
  } else {
    position = charIndex;
  }

  return Math.round(lineIndex * LINE_OVERLAP_MS + position * step);
}

/**
 * Entrance delay for the nth secondary element (subtitle, portrait, copy,
 * CTAs). These overlap the tail of the name rather than queueing behind it,
 * which is what keeps the whole entrance near 1.1s instead of the 4.2s the
 * fully-sequenced version measured.
 */
function secondaryDelayMs(index: number): number {
  return SECONDARY_START_MS + index * SECONDARY_STAGGER_MS;
}

interface CachedCursorNode {
  cx: number;
  cy: number;
  setX: gsap.QuickToFunc;
  setY: gsap.QuickToFunc;
  setRot: gsap.QuickToFunc;
}

/**
 * HeroLenisExperience
 *
 * Full-screen (100vh) cinematic Hero architecture reproducing the physical typography
 * and momentum interaction philosophy of Lenis.dev:
 *  - Dominant 3-line name layout: "ELIA" / "ABDEL" / "MASSIH."
 *  - Cinematic off-screen directional entrance:
 *      1. ELIA arrives from top of screen (E -> L -> I -> A)
 *      2. ABDEL arrives from left edge (A -> B -> D -> E -> L)
 *      3. MASSIH arrives from bottom of screen (M -> A -> S -> S -> I -> H)
 *  - Subsequent sequential reveal of secondary Hero metadata (subtitle, copy, portrait, CTAs)
 *  - Strong vertical Lenis-style scroll choreography (Layer 2)
 *  - Fine-pointer magnetic proximity influence (Layer 1)
 *  - Lenis scroll velocity momentum distortion (Layer 0)
 *  - Unified Three.js environmental depth
 *
 * Invariants Preserved:
 *  - I1: All markup renders 100% visible in initial SSR HTML.
 *  - I2: Scoped useGSAP lifecycle with clean ticker and event listener removal.
 *  - I3: Desktop ceiling (>= 1024px); mobile receives the full 3-line directional entrance with responsive scaling.
 */
export const HeroLenisExperience: React.FC<HeroLenisExperienceProps> = ({
  settings,
  loading,
  config = DEFAULT_CONFIG,
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const heroContainerRef = useRef<HTMLDivElement>(null);
  const backgroundLayerRef = useRef<HTMLDivElement>(null);
  const typographyStageRef = useRef<HTMLDivElement>(null);
  const velocityLayerRef = useRef<HTMLDivElement>(null);
  const mediaStageRef = useRef<HTMLDivElement>(null);

  // Decoupled node registries for each independent transform layer.
  // There is deliberately no registry for the entrance: that is CSS now
  // (.hero-glyph in globals.css), so no JS holds the glyph nodes.
  const characterNodesRef = useRef<Map<string, HTMLSpanElement>>(new Map());
  const cursorNodesRef = useRef<Map<string, HTMLSpanElement>>(new Map());
  const scrollProgressRef = useRef<number>(0);

  const supportingTagline =
    settings?.hero_tagline ||
    'Full Stack Developer with hands-on Shopify expertise, enterprise .NET & React architecture, and AI-assisted workflows.';

  /* ------------------------------------------------------------------ *
   * Scoped GSAP Orchestration: Off-screen Directional Entrance & Scrub
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const hero = heroContainerRef.current;
      const velocityLayer = velocityLayerRef.current;
      if (!hero) return;

      const mm = gsap.matchMedia();

      // Every width, motion allowed. The scrub and the velocity layer are
      // pure transforms and cost the same at any size; only their
      // amplitude scales. The pointer proximity field further down
      // self-gates on MQ.hover, so touch devices skip it without needing a
      // width query at all.
      addMotionTiers(mm, (tier) => {
        const amp = TIER[tier].amp;
        // The entrance is CSS (see .hero-glyph in globals.css). GSAP owns
        // only what CSS cannot express: scroll scrub, velocity skew and
        // pointer magnetism.

        // Master Scroll-Coupled Scrubbed Timeline (Vertical Lenis Choreography)
        const scrubTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              scrollProgressRef.current = self.progress;
            },
          },
        });

        // Deep background WebGL layer scrub
        if (backgroundLayerRef.current) {
          scrubTimeline.to(
            backgroundLayerRef.current,
            {
              y: HERO_CHOREOGRAPHY_CONFIG.parallaxDots * amp,
              ease: 'none',
            },
            0
          );
        }

        // Heavy typography container differential drift
        if (typographyStageRef.current) {
          scrubTimeline.to(
            typographyStageRef.current,
            {
              y: HERO_CHOREOGRAPHY_CONFIG.parallaxType * amp,
              ease: 'none',
            },
            0
          );
        }

        // Foreground media stage forward motion & subtle depth fade
        if (mediaStageRef.current) {
          scrubTimeline.to(
            mediaStageRef.current,
            {
              y: HERO_CHOREOGRAPHY_CONFIG.parallaxMedia * amp,
              opacity: 0.88,
              ease: 'none',
            },
            0
          );
        }

        // Tier 1: Strong Vertical Lenis-Style Character Scrub
        if (mergedConfig.enableLetterChoreography) {
          THREE_NAME_LINES.forEach((line) => {
            const allCharsInLine: HTMLSpanElement[] = [];
            line.word.chars.forEach((_, charIdx) => {
              const nodeKey = `${line.word.id}-${charIdx}`;
              const el = characterNodesRef.current.get(nodeKey);
              if (el) allCharsInLine.push(el);
            });

            const count = allCharsInLine.length;
            const midIndex = (count - 1) / 2;

            allCharsInLine.forEach((el, index) => {
              // Normalized signed distance from optical center (-1 to 1)
              const normalized = midIndex === 0 ? 0 : (index - midIndex) / midIndex;

              // Vertical travel opening trajectory: outer characters disperse up/down
              // Every amount here is multiplied by the tier amplitude. The
              // horizontal drift matters most: 48px of outward drift on a
              // 375px screen would push the outer glyphs past the edge.
              const yTravel = normalized * HERO_NAME_MOTION_CONFIG.maxVerticalTravel * amp;
              const yArch =
                -Math.abs(normalized) * HERO_NAME_MOTION_CONFIG.maxParabolicArch * amp;
              const yTotal = yTravel + yArch;

              // Restrained horizontal drift
              const xDrift = normalized * HERO_NAME_MOTION_CONFIG.maxHorizontalDrift * amp;

              // Radial tilt & center swell
              const rot = normalized * HERO_NAME_MOTION_CONFIG.maxRotation * amp;
              const scaleFactor =
                1.0 + (1 - Math.abs(normalized)) * HERO_NAME_MOTION_CONFIG.centerSwell * amp;

              scrubTimeline.to(
                el,
                {
                  y: yTotal,
                  x: xDrift,
                  rotation: rot,
                  scale: scaleFactor,
                  ease: 'none',
                },
                0
              );
            });
          });
        }

        // Tier 2: Lenis Scroll Velocity Momentum Distortion
        let cleanupTicker: (() => void) | null = null;

        if (mergedConfig.enableVelocityDistortion && velocityLayer) {
          const setSkewY = gsap.quickTo(velocityLayer, 'skewY', {
            duration: HERO_NAME_MOTION_CONFIG.dampingDuration,
            ease: HERO_NAME_MOTION_CONFIG.dampingEase,
          });
          const setScaleY = gsap.quickTo(velocityLayer, 'scaleY', {
            duration: HERO_NAME_MOTION_CONFIG.dampingDuration,
            ease: HERO_NAME_MOTION_CONFIG.dampingEase,
          });
          const setShiftY = gsap.quickTo(velocityLayer, 'y', {
            duration: HERO_NAME_MOTION_CONFIG.dampingDuration,
            ease: HERO_NAME_MOTION_CONFIG.dampingEase,
          });

          let isHeroInView = true;

          const observer = new IntersectionObserver(
            ([entry]) => {
              isHeroInView = entry.isIntersecting;
              if (!isHeroInView) {
                setSkewY(0);
                setScaleY(1);
                setShiftY(0);
              }
            },
            { rootMargin: '50px' }
          );
          observer.observe(hero);

          const updateVelocityDistortion = () => {
            if (!isHeroInView || document.hidden) return;
            const scrollState = getScrollState();
            const rawVel = scrollState.velocity || 0;

            const clampedSkew = Math.max(
              -HERO_NAME_MOTION_CONFIG.maxVelocitySkew,
              Math.min(HERO_NAME_MOTION_CONFIG.maxVelocitySkew, rawVel * HERO_NAME_MOTION_CONFIG.velocitySkewMultiplier)
            );

            const absVel = Math.abs(rawVel);
            const clampedStretch = Math.min(
              HERO_NAME_MOTION_CONFIG.maxVelocityStretch,
              absVel * HERO_NAME_MOTION_CONFIG.velocityStretchMultiplier
            );

            const clampedShift = Math.max(
              -HERO_NAME_MOTION_CONFIG.maxVelocityShift,
              Math.min(HERO_NAME_MOTION_CONFIG.maxVelocityShift, rawVel * HERO_NAME_MOTION_CONFIG.velocityShiftMultiplier)
            );

            setSkewY(clampedSkew);
            setScaleY(1 + clampedStretch);
            setShiftY(clampedShift);
          };

          gsap.ticker.add(updateVelocityDistortion);

          cleanupTicker = () => {
            gsap.ticker.remove(updateVelocityDistortion);
            observer.disconnect();
          };
        }

        // Tier 3: Desktop Fine-Pointer Proximity Field
        let cleanupPointer: (() => void) | null = null;

        if (mergedConfig.enableCursorInfluence && window.matchMedia(MQ.hover).matches) {
          const cachedNodes: CachedCursorNode[] = [];

          const initCachedNodes = () => {
            cachedNodes.length = 0;
            cursorNodesRef.current.forEach((el) => {
              const rect = el.getBoundingClientRect();
              cachedNodes.push({
                cx: rect.left + rect.width / 2,
                cy: rect.top + rect.height / 2,
                setX: gsap.quickTo(el, 'x', { duration: HERO_NAME_MOTION_CONFIG.cursorDuration, ease: HERO_NAME_MOTION_CONFIG.cursorEase }),
                setY: gsap.quickTo(el, 'y', { duration: HERO_NAME_MOTION_CONFIG.cursorDuration, ease: HERO_NAME_MOTION_CONFIG.cursorEase }),
                setRot: gsap.quickTo(el, 'rotation', { duration: HERO_NAME_MOTION_CONFIG.cursorDuration, ease: HERO_NAME_MOTION_CONFIG.cursorEase }),
              });
            });
          };

          const handlePointerEnter = () => {
            initCachedNodes();
          };

          const handlePointerMove = (e: PointerEvent) => {
            if (cachedNodes.length === 0) initCachedNodes();
            const px = e.clientX;
            const py = e.clientY;
            const radius = HERO_NAME_MOTION_CONFIG.cursorRadius;

            for (let i = 0; i < cachedNodes.length; i++) {
              const node = cachedNodes[i];
              const dx = px - node.cx;
              const dy = py - node.cy;
              const distSq = dx * dx + dy * dy;

              if (distSq < radius * radius && distSq > 0.001) {
                const dist = Math.sqrt(distSq);
                const factor = 1 - dist / radius;
                const smoothFactor = factor * factor;

                const targetX = (dx / dist) * smoothFactor * HERO_NAME_MOTION_CONFIG.maxCursorDisplacement;
                const targetY = (dy / dist) * smoothFactor * HERO_NAME_MOTION_CONFIG.maxCursorDisplacement;
                const targetRot = (dx / radius) * HERO_NAME_MOTION_CONFIG.maxCursorRotation * smoothFactor;

                node.setX(targetX);
                node.setY(targetY);
                node.setRot(targetRot);
              } else {
                node.setX(0);
                node.setY(0);
                node.setRot(0);
              }
            }
          };

          const handlePointerLeave = () => {
            for (let i = 0; i < cachedNodes.length; i++) {
              cachedNodes[i].setX(0);
              cachedNodes[i].setY(0);
              cachedNodes[i].setRot(0);
            }
          };

          const handleVisibilityChange = () => {
            if (document.hidden) handlePointerLeave();
          };

          hero.addEventListener('pointerenter', handlePointerEnter, { passive: true });
          hero.addEventListener('pointermove', handlePointerMove, { passive: true });
          hero.addEventListener('pointerleave', handlePointerLeave, { passive: true });
          window.addEventListener('resize', handlePointerLeave, { passive: true });
          document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

          cleanupPointer = () => {
            hero.removeEventListener('pointerenter', handlePointerEnter);
            hero.removeEventListener('pointermove', handlePointerMove);
            hero.removeEventListener('pointerleave', handlePointerLeave);
            window.removeEventListener('resize', handlePointerLeave);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            handlePointerLeave();
          };
        }

        return () => {
          if (cleanupTicker) cleanupTicker();
          if (cleanupPointer) cleanupPointer();
        };
      });

      // Reduced-motion mode: Static presentation without spatial travel
      mm.add(MQ.reduced, () => {});

      return () => mm.revert();
    },
    {
      scope: heroContainerRef,
      dependencies: [
        loading,
        mergedConfig.enableLetterChoreography,
        mergedConfig.enableVelocityDistortion,
        mergedConfig.enableCursorInfluence,
        mergedConfig.enableEntranceReveal,
      ],
    }
  );

  /**
   * Anchor scrolling must go through Lenis.
   *
   * These two were calling window.scrollTo({ behavior: 'smooth' }) while
   * Lenis owned the scroll position, so the native smooth scroll and the
   * Lenis loop fought each other for it. Navbar, Footer and Services
   * already used this pattern; the hero was the odd one out.
   */
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(element, { offset: -80, duration: 1.1 });
      return;
    }
    window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
  };

  const handleScrollToProjects = () => scrollToSection('projects');
  const handleScrollToContact = () => scrollToSection('contact');

  const registerCharNode = (key: string) => (el: HTMLSpanElement | null) => {
    if (el) {
      characterNodesRef.current.set(key, el);
    } else {
      characterNodesRef.current.delete(key);
    }
  };

  const registerCursorNode = (key: string) => (el: HTMLSpanElement | null) => {
    if (el) {
      cursorNodesRef.current.set(key, el);
    } else {
      cursorNodesRef.current.delete(key);
    }
  };

  if (loading) {
    return (
      <section
        id="hero"
        className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden pt-20"
      >
        <DottedSurface opacity={0.65} size={7} className="absolute inset-0 z-0 pointer-events-none overflow-hidden" />
        <div className="w-full max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="h-8 w-64 bg-app-surface border border-app-border rounded-full animate-pulse mb-6" />
            <div className="h-32 sm:h-44 w-full bg-app-surface border border-app-border rounded-2xl animate-pulse mb-6" />
          </div>
          <div className="lg:col-span-5 flex flex-col items-start space-y-6">
            <div className="aspect-[4/5] max-w-[280px] w-full bg-app-surface border border-app-border rounded-2xl animate-pulse" />
            <div className="h-16 w-full bg-app-surface border border-app-border rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={heroContainerRef}
      id="hero"
      className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden pt-20 pb-10 lg:pt-24 lg:pb-12 select-none"
    >
      {/* Environmental Three.js Depth Layer (Synchronized with ScrollTrigger & Lenis Velocity) */}
      {mergedConfig.enableThreeJsBackground && (
        <div ref={backgroundLayerRef} className="absolute inset-0 z-0 pointer-events-none">
          <DottedSurface
            scrollProgressRef={scrollProgressRef}
            opacity={0.7}
            size={8}
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          />
        </div>
      )}

      {/* Grid container with distinct non-overlapping columns */}
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
        
        {/* Left Column (col-span-7): 3-Line Dominant Name Typography + Secondary Subtitle */}
        <div ref={typographyStageRef} className="lg:col-span-7 flex flex-col items-start text-left max-w-full">
          
          {/* Secondary Professional Role Subtitle (Reveals after 3-line name finishes) */}
          <div
            className="hero-secondary-element hero-rise flex items-center gap-3 mb-3 sm:mb-4"
            style={{ '--reveal-delay': secondaryDelayMs(0) + 'ms' } as React.CSSProperties}
          >
            <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.25em] text-app-accent font-bold">
              FULL STACK DEVELOPER
            </span>
            <span className="h-[1.5px] w-6 bg-app-accent/60 inline-block" />
            <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-app-text-secondary font-semibold">
              &amp; AI SPECIALIST
            </span>
          </div>

          {/*
            Lenis.dev-Inspired THREE-LINE DOMINANT NAME Visual Hero
            Displays "ELIA", "ABDEL", and "MASSIH." on three separate lines with directional off-screen assembly.
          */}
          <div ref={velocityLayerRef} className="hero-velocity-layer w-full origin-left will-change-transform">
            <h1
              aria-label="Elia Abdel Massih"
              className="text-4xl sm:text-6xl md:text-7xl lg:text-[4.25rem] xl:text-[5.15rem] 2xl:text-[6.25rem] font-black tracking-tight text-app-text-primary leading-[0.88] select-none uppercase font-sans mb-0 flex flex-col items-start max-w-full"
            >
              {THREE_NAME_LINES.map((line, lineIndex) => (
                <span key={line.id} className="py-0.5 block max-w-full">
                  <span className="inline-flex items-center">
                    {line.word.chars.map((char, charIdx) => {
                      const nodeKey = `${line.word.id}-${charIdx}`;
                      const cursorKey = `cursor-${nodeKey}`;
                      return (
                        <span
                          key={cursorKey}
                          ref={registerCursorNode(cursorKey)}
                          className="hero-cursor-char inline-block will-change-transform"
                        >
                          <span
                            ref={registerCharNode(nodeKey)}
                            data-char={char}
                            className="hero-char inline-block will-change-transform"
                          >
                            {/* Clip parent for the masked rise: the glyph
                                starts at translateY(110%) inside this box, so
                                it is never visible outside its own layout
                                area and never bleeds into the line above. */}
                            <span className="inline-block align-baseline overflow-clip">
                              <span
                                className="hero-reveal-node hero-glyph inline-block will-change-transform"
                                style={
                                  {
                                    '--reveal-delay': glyphDelayMs(line, lineIndex, charIdx) + 'ms',
                                  } as React.CSSProperties
                                }
                              >
                                {char}
                              </span>
                            </span>
                          </span>
                        </span>
                      );
                    })}
                  </span>
                </span>
              ))}
            </h1>
          </div>

        </div>

        {/* Right Column (col-span-5): Developer Media Stage, Supporting Copy & CTAs */}
        <div ref={mediaStageRef} className="lg:col-span-5 flex flex-col items-start text-left w-full">
          
          {/* Developer Media Frame (Reveals after name assembly) - 4:5 Aspect Ratio */}
          <div
            id="hero-image-slot-lenis"
            data-portrait-slot="hero"
            className="hero-secondary-element hero-rise aspect-[4/5] max-w-[260px] sm:max-w-[290px] md:max-w-[320px] lg:max-w-[280px] xl:max-w-[330px] w-full mb-4 relative flex-shrink-0"
            style={{ '--reveal-delay': secondaryDelayMs(1) + 'ms' } as React.CSSProperties}
          >
            {/*
              The slot above is the measuring box for TravellingPortrait, so
              it carries layout ONLY. Everything paintable lives on
              .portrait-visual, which means a slot rect is always the true
              frame geometry no matter what transforms are in flight.
            */}
            <div className="portrait-visual absolute inset-0 rounded-2xl overflow-hidden bg-app-surface border border-app-border/80 group shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-app-bg/90 via-app-bg/40 to-transparent z-10 pointer-events-none" />
              <div className="w-full h-full bg-app-surface flex items-center justify-center relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
                  alt="Elia Abdel Massih - Developer"
                  className="w-full h-full object-cover grayscale contrast-[1.08] transition-transform duration-700 ease-out hover-fine:group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span
                    data-portrait-label=""
                    className="text-[10px] font-mono font-bold uppercase tracking-wider text-app-text-primary"
                  >
                    Available for Remote Work
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Copy (Reveals after name assembly) */}
          <p
            className="hero-secondary-element hero-rise text-sm sm:text-base text-app-text-secondary leading-relaxed mb-6 font-sans"
            style={{ '--reveal-delay': secondaryDelayMs(2) + 'ms' } as React.CSSProperties}
          >
            {supportingTagline}
          </p>

          {/* CTAs (Reveals after name assembly) */}
          <div
            className="hero-secondary-element hero-rise flex flex-col sm:flex-row gap-3 justify-start items-stretch sm:items-center w-full"
            style={{ '--reveal-delay': secondaryDelayMs(3) + 'ms' } as React.CSSProperties}
          >
            <Button
              onClick={handleScrollToProjects}
              variant="primary"
              size="md"
              isMagnetic
              className="group gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider"
            >
              VIEW WORK
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>

            <Button
              onClick={handleScrollToContact}
              variant="outline"
              size="md"
              isMagnetic
              className="w-full sm:w-auto gap-2 px-6 py-3 font-semibold text-xs uppercase tracking-wider"
            >
              <Mail className="w-4 h-4" />
              CONTACT ME &rarr;
            </Button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HeroLenisExperience;
