'use client';

import React, { useRef } from 'react';
import { ArrowDown, Phone } from 'lucide-react';
import { CONTACT } from '../../config/constants';
import { getLenis } from '../../lib/lenis';
import { useBladeSweep } from './hero/useBladeSweep';

type Delay = React.CSSProperties & { '--reveal-delay': string };
const delay = (ms: number): Delay => ({ '--reveal-delay': `${ms}ms` });

const NAME_LINES = ['Elia', 'Abdel', 'Massih'] as const;
const LINE_STAGGER_MS = 80;
const NAME_START_MS = 120;

const PORTRAIT = { src: '/assets/images/hero-portrait.webp', width: 908, height: 1264 } as const;

/**
 * Hero — "Split".
 *
 * Stacked name on the left, the cut-out portrait standing on the lime blade
 * on the right. The blade is the EAM mark's cut at the same 22.6 degrees,
 * and it is also the hand-off: on scroll it sweeps the screen into Profile
 * (see useBladeSweep).
 *
 * Entrance is CSS (hero-line / hero-rise / hero-wipe), held by
 * html[data-preload='loading'] until the loader leaves. GSAP never touches
 * an element that carries one of those classes: CSS animations with
 * fill-mode `both` would override GSAP's inline transform, so every GSAP
 * target here is a wrapper around the animated node.
 */
export function HeroSplit() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const fadesRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useBladeSweep({
    section: sectionRef,
    stage: stageRef,
    bg: bgRef,
    band: bandRef,
    name: nameRef,
    portrait: portraitRef,
    fades: fadesRef,
    label: labelRef,
  });

  const scrollToWork = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('work');
    if (!target) return;
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, { offset: -80, duration: 1.6 });
      return;
    }
    target.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} id="hero" aria-label="Introduction" className="hero-sweep relative z-10 h-svh">
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden pointer-events-none select-none">
        <div ref={bgRef} className="absolute inset-0 bg-app-bg" />

        {/* The blade. Wrapper carries the CSS entrance; the band's clip-path is JS. */}
        <div className="hero-wipe absolute inset-0" style={delay(0)} aria-hidden="true">
          <div ref={bandRef} className="hero-band absolute inset-0 bg-app-accent" />
        </div>

        {/* Portrait: GSAP moves the img, CSS entrance lives on the wrapper. */}
        <div className="hero-rise absolute inset-0" style={delay(260)}>
          <img
            ref={portraitRef}
            src={PORTRAIT.src}
            width={PORTRAIT.width}
            height={PORTRAIT.height}
            alt="Portrait of Elia in a dark suit"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="absolute bottom-0 right-[-10vw] h-[min(56svh,125vw)] w-auto max-w-none sm:right-[-2vw] lg:right-[1.5vw] lg:h-[min(87svh,62vw)]"
          />
        </div>

        <div className="absolute inset-0 px-[clamp(16px,4vw,56px)] pt-[clamp(96px,13svh,132px)]">
          <div ref={nameRef} className="w-max">
            <p className="hero-rise mb-4 lg:mb-6 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-app-text-secondary" style={delay(60)}>
              <span className="text-app-accent">Full-stack developer</span>
              <span className="mx-2 opacity-60">/</span>AI specialist
              <span className="hidden sm:inline">
                <span className="mx-2 opacity-60">/</span>Zahl&eacute;, LB
              </span>
            </p>
            <h1
              aria-label="Elia Abdel Massih"
              className="font-heading font-extrabold uppercase leading-[0.82] tracking-[-0.045em] text-app-text-primary text-[min(21vw,13svh)] lg:text-[min(13.2vw,21svh)]"
            >
              {NAME_LINES.map((line, i) => (
                <span key={line} className="reveal-mask" aria-hidden="true">
                  <span className="hero-line block" style={delay(NAME_START_MS + i * LINE_STAGGER_MS)}>
                    {line}
                    {i === NAME_LINES.length - 1 && <span className="text-app-accent">.</span>}
                  </span>
                </span>
              ))}
            </h1>
          </div>
        </div>

        {/* Everything that simply fades on the hand-off. Direct children are GSAP targets. */}
        <div ref={fadesRef}>
          <div className="absolute inset-x-0 bottom-0 px-[clamp(16px,4vw,56px)] pb-[clamp(24px,6svh,56px)]">
            <div className="hero-rise flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-9" style={delay(420)}>
              <p className="hidden md:block max-w-[360px] text-base leading-relaxed text-[#c9ccc3]">
                Shopify storefronts, enterprise .NET &amp; React systems, and AI-assisted workflows.
              </p>
              <div className="pointer-events-auto flex gap-2.5">
                <a
                  href="#work"
                  onClick={scrollToWork}
                  className="group inline-flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-full bg-app-accent px-6 text-[15px] font-semibold text-app-on-accent shadow-[0_0_0_1px_var(--color-bg)] transition-[background-color,transform] duration-200 hover:bg-accent-400 active:scale-[0.97] lg:flex-none"
                >
                  See the work
                  <ArrowDown aria-hidden="true" className="h-4 w-4 transition-transform duration-300 hover-fine:group-hover:translate-y-0.5" />
                </a>
                <a
                  href={CONTACT.phoneHref}
                  aria-label={`Call ${CONTACT.phoneDisplay}`}
                  className="inline-flex h-[52px] w-[52px] items-center justify-center gap-2 rounded-full border border-app-border bg-app-bg text-[15px] font-semibold text-app-text-primary transition-colors duration-200 hover:border-app-accent/60 lg:w-auto lg:px-6"
                >
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden lg:inline">{CONTACT.phoneDisplay}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Availability badge, desktop only. */}
          <div className="absolute right-[clamp(16px,4vw,56px)] top-[clamp(96px,13svh,120px)] hidden lg:block">
            <div className="hero-rise relative grid h-[132px] w-[132px] place-items-center rounded-full border border-app-border bg-app-bg" style={delay(520)}>
              <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-1.5 motion-safe:animate-[spin_26s_linear_infinite]">
                <defs>
                  <path id="hero-badge-ring" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <text className="fill-app-text-secondary font-mono" fontSize="9.2" letterSpacing="2.4">
                  <textPath href="#hero-badge-ring">AVAILABLE · FOR · REMOTE · WORK · </textPath>
                </text>
              </svg>
              <span className="h-3 w-3 rounded-full bg-app-accent shadow-[0_0_0_4px_rgba(189,230,106,0.18)]" />
              <span className="sr-only">Available for remote work</span>
            </div>
          </div>
        </div>

        {/* Chapter label, shown only while the band covers the screen. */}
        <div ref={labelRef} className="invisible absolute inset-0 grid place-items-center opacity-0" aria-hidden="true">
          <p className="font-mono text-sm sm:text-[22px] uppercase tracking-[0.32em] text-app-on-accent">01 — Profile</p>
        </div>
      </div>
    </section>
  );
}

export default HeroSplit;
