'use client';

import React, { useRef } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Button from '../ui/Button';
import DottedSurface from '../ui/DottedSurface';
import { TIER, addMotionTiers, GSAP_EASE } from '../../config/motion';
import type { SiteSettings } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface HeroProps {
  settings: SiteSettings | null;
  loading: boolean;
}

export const Hero: React.FC<HeroProps> = ({ settings, loading }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const dotsLayerRef = useRef<HTMLDivElement>(null);
  const typeLayerRef = useRef<HTMLDivElement>(null);
  const cardLayerRef = useRef<HTMLDivElement>(null);

  const supportingTagline = "Full Stack Developer with hands-on Shopify expertise, enterprise .NET & React architecture, and AI-assisted workflows.";

  /* ------------------------------------------------------------------ *
   * Layered depth parallax — DESKTOP ONLY, transform ONLY.
   *
   * Invariant I1 (Visibility):
   *   1. NO opacity is animated on the <h1> or ANY of its ancestors.
   *   2. NO pin is used.
   *   3. The title's reveal is pure CSS keyframes (.hero-line, globals.css),
   *      fully visible on first paint.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero) return;

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const amp = TIER[tier].amp;

        const layers: Array<[HTMLDivElement | null, number]> = [
          [dotsLayerRef.current, 80],   // deepest — lags behind the scroll
          [typeLayerRef.current, -14],  // heavy, anchored
          [cardLayerRef.current, -34],  // closest — moves ahead
        ];

        layers.forEach(([el, y]) => {
          if (!el) return;
          gsap.to(el, {
            y: y * amp,
            ease: GSAP_EASE.scrub,
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: heroRef, dependencies: [loading] }
  );

  const handleScrollToProjects = () => {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      const offsetPosition = projectsSection.offsetTop - 80;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const offsetPosition = contactSection.offsetTop - 80;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <section
        id="hero"
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16"
      >
        <DottedSurface opacity={0.65} size={7} className="absolute inset-0 z-0 pointer-events-none overflow-hidden" />
        <div className="w-full max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="h-6 w-48 bg-app-surface border border-app-border rounded-full animate-pulse mb-6" />
            <div className="h-24 sm:h-36 w-full bg-app-surface border border-app-border rounded-2xl animate-pulse mb-6" />
          </div>
          <div className="lg:col-span-5 flex flex-col items-start space-y-6">
            <div className="h-48 w-full bg-app-surface border border-app-border rounded-2xl animate-pulse" />
            <div className="h-16 w-full bg-app-surface border border-app-border rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16"
    >
      {/* Depth layer 1 (deepest) — ambient dotted surface, lags the scroll */}
      <div ref={dotsLayerRef} className="absolute inset-0 z-0 pointer-events-none">
        <DottedSurface opacity={0.7} size={8} className="absolute inset-0 z-0 pointer-events-none overflow-hidden" />
      </div>

      {/* Grid container with distinct non-overlapping columns */}
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
        
        {/* Left Column (58% / col-span-7): Author Name + Controlled Editorial Headline */}
        <div ref={typeLayerRef} className="lg:col-span-7 flex flex-col items-start text-left max-w-full">

          {/* Prominent Author Name Identity Marker */}
          <div className="hero-rise flex items-center gap-3 mb-4 sm:mb-6">
            <span className="text-sm sm:text-base font-black tracking-[0.25em] text-app-text-primary uppercase font-sans">
              ELIA ABDEL MASSIH
            </span>
            <span className="h-[1.5px] w-8 bg-app-accent inline-block" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-app-accent font-semibold">
              CREATIVE DEVELOPER
            </span>
          </div>

          {/*
            Primary Hero Display Headline — Strictly bounded within its 7-column grid area.
            Type scale:
              - Mobile (<640px): text-4xl (36px)
              - Tablet (640-1023px): text-5xl to text-6xl (48px - 60px)
              - Desktop (1024-1279px): text-[2.5rem] (40px)
              - Large Desktop (1280-1535px): text-[3.15rem] (50.4px)
              - Extra Large Desktop (1536px+): text-[3.6rem] (57.6px)
            
            Zero collision with right column (Image & CTAs) across all breakpoints.
          */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[2.5rem] xl:text-[3.15rem] 2xl:text-[3.6rem] font-black tracking-tight text-app-text-primary leading-[0.98] select-none font-sans mb-0 flex flex-col items-start max-w-full">
            <span className="overflow-hidden py-0.5 block max-w-full">
              <span className="hero-line block">FULL STACK</span>
            </span>
            <span className="overflow-hidden py-0.5 block max-w-full">
              <span className="hero-line block" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
                DEVELOPER
              </span>
            </span>
            <span className="overflow-hidden py-0.5 block max-w-full">
              <span
                className="hero-line whitespace-nowrap inline-block"
                style={{ '--reveal-delay': '160ms' } as React.CSSProperties}
              >
                &amp; AI SPECIALIST<span className="text-app-accent inline">.</span>
              </span>
            </span>
          </h1>

        </div>

        {/* Right Column (42% / col-span-5): Developer Image ABOVE Paragraph + CTAs */}
        <div className="hero-slide lg:col-span-5 flex flex-col items-start text-left w-full">
          {/* Depth layer 3 (closest) */}
          <div ref={cardLayerRef} className="w-full flex flex-col items-start text-left">

            {/* Developer Image Placement (ABOVE supporting paragraph) */}
            <div
              id="hero-image-slot"
              className="w-full h-48 sm:h-56 md:h-64 lg:h-52 xl:h-60 rounded-2xl overflow-hidden mb-4 relative bg-app-surface border border-app-border/80 group shadow-lg flex-shrink-0"
            >
              {/* Minimal Developer Frame */}
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
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-app-text-primary">
                    Elia Abdel Massih
                  </span>
                </div>
              </div>
            </div>

            {/* Supporting Sentence (directly below image with minimal spacing) */}
            <p className="text-sm sm:text-base text-app-text-secondary leading-relaxed mb-6 font-sans">
              {supportingTagline}
            </p>

            {/* Primary & Secondary Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-start items-stretch sm:items-center w-full">
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
          {/* end depth layer 3 */}

        </div>

      </div>
    </section>
  );
};

export default Hero;