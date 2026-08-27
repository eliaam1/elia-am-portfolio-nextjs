'use client';

import React, { useRef } from 'react';
import { ArrowUp, ArrowUpRight, MessageCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { NAV_LINKS } from '../../config/constants';
import { getLenis } from '../../lib/lenis';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { MQ, TIER, addMotionTiers, GSAP_EASE, DUR } from '../../config/motion';
import type { SiteSettings } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

interface FooterProps {
  settings: SiteSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const footerRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLParagraphElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  /* ------------------------------------------------------------------ *
   * Closing wordmark.
   *
   * The name is set at a clamped display size so it spans the viewport at
   * every width, and rises line by line behind clip masks as the footer
   * arrives — the last piece of motion on the page.
   *
   * It is a <p>, not a heading: the page already has its four chapter <h2>s
   * and this is a wordmark, not a section title. Screen readers still get
   * the name from the copyright line below.
   *
   * Visibility (I1): authored fully visible with no opacity-0. The masks and
   * the split exist only inside a matchMedia branch and revert on cleanup,
   * so a JS failure leaves the entire footer readable.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const root = footerRef.current;
      if (!root) return;

      const q = gsap.utils.selector(root);
      const eyebrow = q('.footer-eyebrow')[0];
      const wordmark = wordmarkRef.current;
      const rule = q('.footer-rule')[0];
      const meta = q('.footer-meta');

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        const splits: SplitText[] = [];

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: 'top 88%', once: true },
        });

        if (eyebrow) {
          tl.from(eyebrow, {
            yPercent: 130,
            duration: 0.5,
            ease: GSAP_EASE.snap,
          });
        }

        if (wordmark) {
          const split = SplitText.create(wordmark, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'footer-wordmark-line',
            aria: 'auto',
          });
          splits.push(split);
          tl.from(
            split.lines,
            {
              yPercent: 110,
              duration: 0.8,
              stagger: 0.1,
              ease: GSAP_EASE.snap,
            },
            '-=0.3'
          );
        }

        if (rule) {
          tl.from(
            rule,
            {
              scaleX: 0,
              duration: 0.7,
              ease: GSAP_EASE.out,
              transformOrigin: 'left center',
            },
            '-=0.5'
          );
        }

        if (meta.length > 0) {
          tl.from(
            meta,
            {
              opacity: 0,
              y: T.item,
              duration: T.dur,
              stagger: 0.08,
              ease: GSAP_EASE.out,
            },
            '-=0.45'
          );
        }

        return () => splits.forEach((s) => s.revert());
      });

      mm.add(MQ.reduced, () => {
        gsap.fromTo(
          root,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: root, start: 'top 92%', once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: footerRef }
  );

  const scrollTo = (target: number | HTMLElement) => {
    if (prefersReduced) {
      window.scrollTo({
        top: typeof target === 'number' ? target : target.offsetTop - 80,
      });
      return;
    }

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, {
        offset: typeof target === 'number' ? 0 : -80,
        duration: 1.2,
      });
      return;
    }

    window.scrollTo({
      top: typeof target === 'number' ? target : target.offsetTop - 80,
      behavior: 'smooth',
    });
  };

  const handleScrollTop = (e?: React.MouseEvent) => {
    e?.preventDefault();
    scrollTo(0);
  };

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) scrollTo(element);
  };

  const heroTitle = settings?.hero_title || 'Elia Abdel Massih';
  const heroSubtitle = settings?.hero_subtitle || 'Full Stack Developer & AI Specialist';
  const socialWhatsapp = settings?.social_whatsapp || 'https://wa.me/96176330429';
  const socialGithub = settings?.social_github || 'https://github.com';

  return (
    <footer
      ref={footerRef}
      className="relative bg-app-surface/30 border-t border-app-border overflow-hidden select-none"
    >
      {/* Accent hairline */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-app-accent/45 to-transparent" />

      {/*
        @container establishes an inline-size query context so the wordmark
        below can be sized in cqw. vw would be wrong here: this wrapper is
        max-w-7xl, so past roughly 1360px the viewport keeps growing while
        the wrapper does not, and a vw-sized wordmark overflows it.
      */}
      <div className="@container max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-10">
        {/* Eyebrow CTA */}
        <span className="reveal-mask-inline">
          <a
            href="#contact"
            onClick={(e) => handleLinkClick(e, 'contact')}
            className="footer-eyebrow inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-[0.25em] text-app-accent hover:text-app-text-primary transition-colors duration-200"
          >
            Let&rsquo;s build something
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </span>

        {/*
          Edge-to-edge wordmark. Sized in cqw against the wrapper above, so
          the name spans the full content width identically at every
          viewport — no breakpoints, no cap, and no floor. A clamp() would
          defeat the point: its ceiling is exactly what stopped the name
          growing on wide screens, and its floor is what made it
          proportionally larger (and wrap) on narrow ones.

          The coefficient is tuned to the glyph advance of this specific
          name at font-black, and is verified by measurement rather than
          taste — see the width assertion noted in the session log.
        */}
        <p
          ref={wordmarkRef}
          className="mt-6 font-black tracking-[-0.03em] leading-[0.86] text-app-text-primary font-sans whitespace-nowrap"
          style={{ fontSize: '11.6cqw' }}
        >
          Elia Abdel Massih
        </p>

        {/* Drawn rule — a real element, because a border cannot be scaled. */}
        <span className="footer-rule mt-12 md:mt-16 block h-px w-full origin-left bg-app-border" />

        {/* Compact meta row */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-start justify-between gap-10">
          <div className="footer-meta">
            <p className="text-sm font-semibold text-app-text-primary font-sans">
              {heroSubtitle}
            </p>
            <p className="text-[11px] font-mono text-app-text-secondary mt-1.5">
              Zahl&eacute;, Lebanon &middot; Available for select projects
            </p>
          </div>

          <nav className="footer-meta flex flex-wrap gap-x-7 gap-y-3" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleLinkClick(e, link.id)}
                className="text-xs font-bold tracking-[0.12em] text-app-text-secondary hover:text-app-accent uppercase transition-colors duration-200 font-sans"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="footer-meta flex items-center gap-3">
            {socialWhatsapp && (
              <a
                href={socialWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full border border-app-border/80 bg-app-bg text-app-accent hover:border-app-accent/50 transition-[border-color,transform] duration-200 hover-fine:hover:-translate-y-0.5"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {socialGithub && (
              <a
                href={socialGithub}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full border border-app-border/80 bg-app-bg text-app-accent hover:border-app-accent/50 transition-[border-color,transform] duration-200 hover-fine:hover:-translate-y-0.5"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </a>
            )}
            <button
              onClick={handleScrollTop}
              type="button"
              className="p-2.5 rounded-full border border-app-border/80 bg-app-bg text-app-text-secondary hover:text-app-accent hover:border-app-accent/50 focus:outline-none transition-[color,border-color] duration-200 group active:scale-95"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-1" />
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-meta mt-10 pt-6 border-t border-app-border/20 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-app-text-secondary/60">
          <p>
            &copy; {new Date().getFullYear()} {heroTitle}. All rights reserved.
          </p>
          <p>Designed &amp; engineered by Elia Abdel Massih.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
