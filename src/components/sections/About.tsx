'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import DottedSurface from '../ui/DottedSurface';
import {
  MQ,
  TIER,
  addMotionTiers,
  GSAP_EASE,
  ABOUT_MOTION_CONFIG,
  ABOUT_REVEAL_CONFIG,
} from '../../config/motion';
import type { SiteSettings } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

interface AboutProps {
  settings: SiteSettings | null;
  loading: boolean;
}

interface StatItem {
  label: string;
  target: number;
  suffix: string;
}

const STATS: StatItem[] = [
  { label: 'Years Experience', target: 4, suffix: '+' },
  { label: 'Projects Delivered', target: 30, suffix: '+' },
  { label: 'Client Partners', target: 25, suffix: '+' },
];

/**
 * Probe for the Hero portrait slot. Used to answer exactly one question:
 * will TravellingPortrait be able to bind? If it will, its arrival IS this
 * section's portrait entrance, and a second entrance underneath would be
 * animating the very box the traveller is trying to land on.
 */
const HERO_PORTRAIT_PROBE = '[data-portrait-slot="hero"] .portrait-visual img';

/**
 * About Section — editorial chapter with scroll-driven reveals.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * This section was not unanimated before. It ran five arrivals that were
 * byte-for-byte identical: opacity 0 -> 1, y 28, 0.75s power3.out. Five
 * blocks performing the same gesture in sequence reads as nothing
 * happening, which is the "dead" complaint. Each block now has its own verb:
 *
 *   index tag   masked rise, no fade         (sets the rhythm)
 *   heading     per-line masked rise         (SplitText, the centrepiece)
 *   callout     accent rule draws down, copy wipes in from the left
 *   body        scrubbed word-by-word brighten, tied to scroll POSITION
 *   stats       masked numerals + drawn underlines + scrubbed counters
 *   portrait    arrives from the Hero via TravellingPortrait
 *
 * Visibility invariant: every hidden state is applied at runtime by GSAP
 * inside a matchMedia branch. The authored markup is fully visible, so a JS
 * failure, a hydration delay or an unmatched query leaves readable content
 * rather than a blank column. The scrubbed body copy has a floor opacity for
 * the same reason — it is never invisible, only dim.
 */
export const About: React.FC<AboutProps> = ({ settings, loading }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const portraitVisualRef = useRef<HTMLDivElement>(null);
  const imageParallaxRef = useRef<HTMLImageElement>(null);
  const textColumnRef = useRef<HTMLDivElement>(null);

  // One ref per block, because each one now animates differently.
  const tagRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statNumbersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const scrollProgressRef = useRef<number>(0);

  const aboutText =
    settings?.about_text ||
    'Trilingual (Arabic, English, French) Full Stack Developer based in Zahlé, Bekaa, Lebanon. Enterprise experience across web, desktop, and e-commerce platforms (React, Node, .NET, SQL). Backed by a full-scholarship University Diploma in Artificial Intelligence from USJ, bringing AI-assisted workflows (MCP, LLM tooling) into rapid prototyping and modern e-commerce architecture.';

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const R = ABOUT_REVEAL_CONFIG;

      const tagLine = tagRef.current?.querySelector<HTMLElement>('.reveal-line') ?? null;
      const heading = headingRef.current;
      const summary = summaryRef.current;
      const rule = summary?.querySelector<HTMLElement>('.about-rule') ?? null;
      const callout = summary?.querySelector<HTMLElement>('.about-callout') ?? null;
      const bodyCopy = bodyRef.current?.querySelector<HTMLElement>('p') ?? null;
      const statsEl = statsRef.current;
      const visual = portraitVisualRef.current;
      const imgEl = imageParallaxRef.current;
      const textCol = textColumnRef.current;

      const mm = gsap.matchMedia();

      /* ------------------------------------------------------------ *
       * Shared pieces
       * ------------------------------------------------------------ */

      /**
       * Masked rise. The parent `.reveal-mask` clips; this only moves the
       * child, so the authored markup stays fully visible with no JS and
       * nothing here ever animates opacity.
       */
      const maskRise = (el: HTMLElement | null, start: string) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: R.maskRise,
            ease: GSAP_EASE.snap,
            scrollTrigger: { trigger: el, start, once: true },
          }
        );
      };

      /**
       * Stat counters.
       *
       * Scrubbed on desktop, so scrolling back up counts back down and the
       * numbers belong to the scroll rather than to a moment that already
       * passed. `immediateRender: false` keeps the authored values on screen
       * until the scroll actually reaches them.
       */
      const setupCountUp = (scrubbed: boolean, scrubAmount: number) => {
        if (!statsEl) return;

        const counts = { v0: 0, v1: 0, v2: 0 };
        const write = () => {
          const values = [counts.v0, counts.v1, counts.v2];
          for (let i = 0; i < STATS.length; i++) {
            const span = statNumbersRef.current[i];
            if (span) span.textContent = `${Math.round(values[i])}${STATS[i].suffix}`;
          }
        };

        gsap.fromTo(
          counts,
          { v0: 0, v1: 0, v2: 0 },
          {
            v0: STATS[0].target,
            v1: STATS[1].target,
            v2: STATS[2].target,
            duration: scrubbed ? 1 : 1.2,
            ease: scrubbed ? GSAP_EASE.scrub : GSAP_EASE.out,
            immediateRender: false,
            onUpdate: write,
            scrollTrigger: scrubbed
              ? { trigger: statsEl, start: 'top 92%', end: 'top 55%', scrub: scrubAmount }
              : { trigger: statsEl, start: 'top 88%', once: true },
          }
        );
      };

      /** The accent rule draws downward, then the copy wipes in behind it. */
      const drawCallout = (wipeDuration: number) => {
        if (rule) {
          gsap.fromTo(
            rule,
            { scaleY: 0 },
            {
              scaleY: 1,
              duration: R.ruleDraw,
              ease: GSAP_EASE.snap,
              scrollTrigger: { trigger: summary, start: 'top 88%', once: true },
            }
          );
        }
        if (callout) {
          gsap.fromTo(
            callout,
            { clipPath: 'inset(0% 100% 0% 0%)', x: -14 },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              x: 0,
              duration: wipeDuration,
              delay: 0.12,
              ease: GSAP_EASE.snap,
              scrollTrigger: { trigger: summary, start: 'top 88%', once: true },
            }
          );
        }
      };

      /** Stat numerals rise out of their masks; underlines draw left to right. */
      const revealStats = () => {
        if (!statsEl) return;

        gsap.fromTo(
          statsEl.querySelectorAll('.about-stat-value'),
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: R.maskRise,
            stagger: R.statStagger,
            ease: GSAP_EASE.snap,
            scrollTrigger: { trigger: statsEl, start: 'top 90%', once: true },
          }
        );

        gsap.fromTo(
          statsEl.querySelectorAll('.about-stat-rule'),
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.5,
            stagger: R.statStagger,
            ease: GSAP_EASE.snap,
            scrollTrigger: { trigger: statsEl, start: 'top 90%', once: true },
          }
        );
      };

      /* ------------------------------------------------------------ *
       * Every width, motion allowed.
       *
       * Phones and tablets used to get a stripped-down version of this: no
       * SplitText, no scrub, no parallax. They now run the identical
       * choreography with tier-scaled amounts, because none of these
       * techniques is actually expensive -- SplitText is a one-time layout
       * pass and a scrubbed opacity is cheaper than the fade it replaced.
       * ------------------------------------------------------------ */
      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        const splits: SplitText[] = [];

        // Master progress feed for the Three.js depth field. Attached to no
        // tween — DottedSurface samples the ref directly.
        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            scrollProgressRef.current = self.progress;
          },
        });

        // 1. Index tag — the cheapest gesture, and it sets the rhythm.
        maskRise(tagLine, 'top 92%');

        // 2. Heading — per-line masked rise. The only reveal in the section
        //    that earns a SplitText, because it is the centrepiece.
        if (heading) {
          const split = SplitText.create(heading, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'about-heading-line',
          });
          splits.push(split);
          gsap.fromTo(
            split.lines,
            { yPercent: 115 },
            {
              yPercent: 0,
              duration: R.headingDuration,
              stagger: R.headingStagger,
              ease: GSAP_EASE.snap,
              scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
            }
          );
        }

        // 3. Callout — two different verbs on one block.
        drawCallout(R.calloutWipe);

        // 4. Body copy — the one reveal tied to scroll POSITION rather than a
        //    moment, so reading the paragraph feels like driving it. The
        //    floor opacity means no word is ever actually invisible.
        if (bodyCopy) {
          const split = SplitText.create(bodyCopy, {
            type: 'words',
            wordsClass: 'about-body-word',
          });
          splits.push(split);
          gsap.fromTo(
            split.words,
            { opacity: R.bodyFloor },
            {
              opacity: 1,
              duration: 0.4,
              stagger: R.bodyWordStagger,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                trigger: bodyCopy,
                start: 'top 88%',
                end: 'top 42%',
                scrub: T.scrub,
              },
            }
          );
        }

        // 5. Stats — masked numerals, drawn underlines, scrubbed counters.
        revealStats();
        setupCountUp(true, T.scrub);

        /* ---------------------------------------------------------- *
         * 6. Portrait.
         *
         * TravellingPortrait binds under exactly this media query and flies
         * the Hero portrait into this frame, so its arrival IS the
         * entrance. This tween therefore only runs when the traveller
         * provably cannot bind — no Hero slot in the DOM, which is what
         * happens when USE_EXPERIMENTAL_HERO is off.
         *
         * Note it targets .portrait-visual, never the slot around it. The
         * slot is the traveller's measuring box and stays untransformed.
         * ---------------------------------------------------------- */
        const travellerWillBind = !!document.querySelector(HERO_PORTRAIT_PROBE);
        if (visual && !travellerWillBind) {
          gsap.fromTo(
            visual,
            { opacity: 0, scale: 0.94, y: 36 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.8,
              ease: GSAP_EASE.snap,
              scrollTrigger: { trigger: visual, start: 'top 90%', once: true },
            }
          );
        }

        // 7. Internal image parallax. Lives on the <img> inside an
        //    overflow-hidden wrapper, so it never changes the frame rect the
        //    traveller has to land on.
        if (imgEl) {
          gsap.fromTo(
            imgEl,
            { y: ABOUT_MOTION_CONFIG.imageParallaxTravel * T.amp },
            {
              y: -ABOUT_MOTION_CONFIG.imageParallaxTravel * T.amp,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );
        }

        // 8. Text column counter-drift against the portrait.
        if (textCol) {
          gsap.fromTo(
            textCol,
            { y: ABOUT_MOTION_CONFIG.textDrift * T.amp },
            {
              y: -ABOUT_MOTION_CONFIG.textDrift * T.amp,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );
        }

        // 9. Fine-pointer 3D tilt on the portrait visual (cached geometry).
        let cleanupTilt: (() => void) | null = null;

        if (visual && window.matchMedia(MQ.hover).matches) {
          const setRotX = gsap.quickTo(visual, 'rotationX', {
            duration: ABOUT_MOTION_CONFIG.tiltDuration,
            ease: ABOUT_MOTION_CONFIG.tiltEase,
          });
          const setRotY = gsap.quickTo(visual, 'rotationY', {
            duration: ABOUT_MOTION_CONFIG.tiltDuration,
            ease: ABOUT_MOTION_CONFIG.tiltEase,
          });

          let bounds = { left: 0, top: 0, width: 1, height: 1 };

          const updateBounds = () => {
            const rect = visual.getBoundingClientRect();
            bounds = {
              left: rect.left,
              top: rect.top,
              width: rect.width || 1,
              height: rect.height || 1,
            };
          };

          const handlePointerEnter = () => {
            updateBounds();
          };

          const handlePointerMove = (e: PointerEvent) => {
            const relX = (e.clientX - bounds.left) / bounds.width - 0.5;
            const relY = (e.clientY - bounds.top) / bounds.height - 0.5;

            setRotX(-relY * (ABOUT_MOTION_CONFIG.maxTiltPitch * 2));
            setRotY(relX * (ABOUT_MOTION_CONFIG.maxTiltYaw * 2));
          };

          const handlePointerLeave = () => {
            setRotX(0);
            setRotY(0);
          };

          visual.addEventListener('pointerenter', handlePointerEnter, { passive: true });
          visual.addEventListener('pointermove', handlePointerMove, { passive: true });
          visual.addEventListener('pointerleave', handlePointerLeave, { passive: true });
          window.addEventListener('resize', handlePointerLeave, { passive: true });

          cleanupTilt = () => {
            visual.removeEventListener('pointerenter', handlePointerEnter);
            visual.removeEventListener('pointermove', handlePointerMove);
            visual.removeEventListener('pointerleave', handlePointerLeave);
            window.removeEventListener('resize', handlePointerLeave);
            handlePointerLeave();
          };
        }

        return () => {
          if (cleanupTilt) cleanupTilt();
          // SplitText must be reverted, or the wrapper elements it injected
          // survive the media-query change and the copy ends up double-split.
          splits.forEach((s) => s.revert());
        };
      });

      // Reduced motion: the authored markup is already the resting state, so
      // there is nothing to do. No branch means nothing is ever hidden.
      mm.add(MQ.reduced, () => {});

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [loading] }
  );

  if (loading) {
    return (
      <div className="relative py-20 md:py-28 overflow-hidden">
        <DottedSurface opacity={0.5} size={7} className="absolute inset-0 z-0 pointer-events-none overflow-hidden" />
        <div className="absolute inset-0 bg-app-bg/60 backdrop-blur-md z-[1] pointer-events-none border-y border-app-border/40" />
        <div className="w-full max-w-6xl mx-auto px-6 md:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="aspect-[4/5] max-w-[280px] sm:max-w-[320px] lg:max-w-[340px] xl:max-w-[380px] w-full rounded-2xl bg-app-surface border border-app-border/80 animate-pulse" />
            </div>
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              <div className="h-4 w-24 bg-app-surface border border-app-border/80 rounded-md animate-pulse" />
              <div className="h-10 w-48 bg-app-surface border border-app-border/80 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-app-surface border border-app-border/80 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-20 md:py-28 overflow-hidden">

      {/* Full-bleed Environmental Three.js Depth Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <DottedSurface
          scrollProgressRef={scrollProgressRef}
          opacity={0.65}
          size={7}
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        />
      </div>

      {/* Glassmorphism Backdrop Overlay (Allows dots to shine through with soft blur) */}
      <div className="absolute inset-0 bg-app-bg/60 backdrop-blur-md z-[1] pointer-events-none border-y border-app-border/40" />

      {/* Section Content Container */}
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 relative z-10">
        <div ref={sectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">

          {/* Left Column (5/12): Editorial portrait — the landing site for the
              Hero portrait's scroll flight. */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative perspective-[1000px]">

            {/*
              Measuring slot for TravellingPortrait. Carries the aspect ratio
              and the width constraints and NOTHING else — no transform, no
              entrance, no tilt — so its rect is always the true resting
              geometry of this frame.
            */}
            <div
              data-portrait-slot="about"
              className="aspect-[4/5] max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[340px] xl:max-w-[380px] w-full relative"
            >
              <div
                ref={portraitVisualRef}
                className="portrait-visual absolute inset-0 rounded-2xl border border-app-border/80 bg-app-surface/80 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden shadow-2xl group will-change-transform transform-gpu"
              >
                {/* Subtle Gradient Shadow Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/90 via-app-bg/20 to-transparent z-10 pointer-events-none" />

                {/* Parallax Image Node */}
                <div className="relative w-full h-[120%] -top-[10%] overflow-hidden">
                  <img
                    ref={imageParallaxRef}
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
                    alt="Elia Abdel Massih - About"
                    className="w-full h-full object-cover grayscale contrast-[1.08] transition-transform duration-700 ease-out hover-fine:group-hover:scale-105 will-change-transform"
                    loading="lazy"
                  />
                </div>

                {/* Live Status Badge */}
                <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span
                    data-portrait-label=""
                    className="text-[10px] font-mono font-bold uppercase tracking-wider text-app-text-primary"
                  >
                    Available for Remote Roles
                  </span>
                </div>

                <div className="absolute inset-0 rounded-2xl border border-app-border/40 pointer-events-none z-20" />
              </div>
            </div>

          </div>

          {/* Right Column (7/12): Editorial Identity Composition */}
          <div ref={textColumnRef} className="lg:col-span-7 flex flex-col items-start text-left will-change-transform">

            {/* 1. Section index tag — masked rise, no fade. */}
            <div ref={tagRef} className="reveal-mask mb-3">
              <span className="reveal-line flex items-center gap-3 will-change-transform">
                <span className="text-xs font-mono font-bold text-app-accent">01</span>
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-app-text-secondary font-semibold">
                  / PROFILE
                </span>
              </span>
            </div>

            {/* 2. Primary statement — split into masked lines on desktop. */}
            <h2
              ref={headingRef}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-app-text-primary tracking-tight font-sans leading-tight mb-6"
            >
              Engineering Digital Products with Precision &amp; Detail<span className="text-app-accent">.</span>
            </h2>

            {/*
              3. Editorial callout. The accent edge is a real element rather
              than a border-left, because a border cannot be scaled — and
              drawing it downward is the whole gesture.
            */}
            <div ref={summaryRef} className="relative pl-6 mb-6 max-w-2xl">
              <span
                className="about-rule absolute left-0 top-0 block h-full w-[2px] origin-top bg-app-accent"
                aria-hidden="true"
              />
              <p className="about-callout text-base sm:text-lg font-medium text-app-text-primary leading-relaxed font-sans">
                Trilingual Full Stack Developer specializing in React, Next.js, Shopify custom theme engineering, enterprise .NET APIs, and AI-assisted software workflows.
              </p>
            </div>

            {/* 4. Narrative body — scrubbed word brighten on desktop. */}
            <div ref={bodyRef} className="mb-10 max-w-2xl">
              <p className="text-sm sm:text-base text-app-text-secondary leading-relaxed font-sans">
                {aboutText}
              </p>
            </div>

            {/* 5. Metrics — masked numerals, drawn underlines, scrubbed counters. */}
            <div ref={statsRef} className="w-full">
              <div className="grid grid-cols-3 gap-6 w-full pt-6 border-t border-app-border/40">
                {STATS.map((stat, idx) => (
                  <div key={stat.label} className="flex flex-col text-left">
                    <span className="reveal-mask">
                      <span
                        ref={(el) => { statNumbersRef.current[idx] = el; }}
                        className="about-stat-value block text-3xl sm:text-4xl lg:text-5xl font-black text-app-accent font-mono tabular-nums select-none will-change-transform"
                      >
                        {stat.target}{stat.suffix}
                      </span>
                    </span>
                    <span
                      className="about-stat-rule block h-px w-full my-2 origin-left bg-app-accent/40"
                      aria-hidden="true"
                    />
                    <span className="text-[10px] sm:text-xs tracking-wider uppercase text-app-text-secondary font-mono font-medium leading-snug">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
