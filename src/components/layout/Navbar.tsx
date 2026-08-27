'use client';

import React, { useState, useRef } from 'react';
import { Menu } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { NAV_LINKS } from '../../config/constants';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { getLenis } from '../../lib/lenis';
import { MQ, GSAP_EASE } from '../../config/motion';
import MobileMenu from './MobileMenu';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  const sectionIds = NAV_LINKS.map((link) => link.id);
  const activeSection = useScrollSpy(sectionIds);

  /* ------------------------------------------------------------------ *
   * Scrolled state, direction-aware hide/reveal, progress hairline.
   *
   * All three read from ScrollTrigger rather than a window scroll listener,
   * so they share the single rAF loop Lenis already drives instead of adding
   * an unthrottled listener that fires hundreds of times a second.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      const shrink = ScrollTrigger.create({
        start: 'top -40px',
        onToggle: (self) => setIsScrolled(self.isActive),
      });

      const progress = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (progressRef.current) {
            gsap.set(progressRef.current, { scaleX: self.progress });
          }
        },
      });

      const mm = gsap.matchMedia();

      // Hide going down, reveal coming back up — but only past 140px, so the
      // bar never flickers away during the small scroll that happens on load
      // or when a hash link lands.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const hide = ScrollTrigger.create({
          start: 'top -140px',
          end: 'max',
          onUpdate: (self) => {
            // Never retract while the overlay is open: it owns the screen and
            // its close button lives in the header.
            if (document.documentElement.dataset.navOpen === 'true') return;
            gsap.to(header, {
              yPercent: self.direction === 1 ? -100 : 0,
              duration: 0.42,
              ease: GSAP_EASE.out,
              overwrite: true,
            });
          },
          onLeaveBack: () => {
            gsap.to(header, {
              yPercent: 0,
              duration: 0.3,
              ease: GSAP_EASE.out,
              overwrite: true,
            });
          },
        });

        return () => {
          hide.kill();
          gsap.set(header, { yPercent: 0 });
        };
      });

      return () => {
        shrink.kill();
        progress.kill();
        mm.revert();
      };
    },
    { scope: headerRef }
  );

  /* ------------------------------------------------------------------ *
   * Travelling underline.
   *
   * ONE bar that moves and resizes between links, rather than a per-link
   * underline that scales in and out. That difference is the whole effect: a
   * single object travelling reads as one continuous indicator, whereas five
   * independent bars read as five things blinking.
   *
   * Measured from live rects every time the active section changes, so it
   * stays correct when the font loads late or label widths differ.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const nav = navRef.current;
      const bar = underlineRef.current;
      if (!nav || !bar) return;

      const active = nav.querySelector<HTMLElement>(
        `[data-nav-id="${activeSection}"]`
      );

      if (!active) {
        gsap.to(bar, { opacity: 0, duration: 0.2, overwrite: true });
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const linkRect = active.getBoundingClientRect();
      const instant = window.matchMedia(MQ.reduced).matches;

      gsap.to(bar, {
        opacity: 1,
        x: linkRect.left - navRect.left,
        width: linkRect.width,
        duration: instant ? 0 : 0.42,
        ease: GSAP_EASE.out,
        overwrite: true,
      });
    },
    { scope: navRef, dependencies: [activeSection] }
  );

  const scrollTo = (target: number | HTMLElement) => {
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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollTo(0);
  };

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) scrollTo(element);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[999] transition-[background-color,border-color,height,backdrop-filter] duration-300 ease-out flex items-center ${
          isScrolled
            ? 'h-16 bg-app-bg/85 border-b border-app-border/80 backdrop-blur-md shadow-sm'
            : 'h-20 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Brand mark */}
          <a
            href="#hero"
            onClick={handleLogoClick}
            className="text-base sm:text-lg font-black tracking-tight text-app-text-primary hover:text-app-accent transition-colors duration-200 font-sans select-none"
          >
            Elia Abdel Massih<span className="text-app-accent">.</span>
          </a>

          {/* Desktop navigation */}
          <nav ref={navRef} className="relative hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  data-nav-id={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative py-1 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                    isActive
                      ? 'text-app-accent'
                      : 'text-app-text-secondary hover:text-app-text-primary'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            {/*
              The single travelling bar. Starts at width 0 and opacity 0, so
              it is invisible until the spy resolves a section — never a stray
              stripe at the left edge on first paint.
            */}
            <span
              ref={underlineRef}
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-[2px] rounded-full bg-app-accent pointer-events-none opacity-0"
              style={{ width: 0 }}
            />
          </nav>

          {/* Overlay trigger — present at every width, not just mobile. */}
          <button
            onClick={() => setIsMenuOpen(true)}
            type="button"
            className="p-2.5 rounded-full border border-app-border text-app-text-primary hover:text-app-accent hover:border-app-accent/50 focus:outline-none transition-colors duration-200 lg:ml-8"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/*
          Scroll progress hairline on the header's bottom edge. Driven by
          scaleX so each frame is a compositor-only write.
        */}
        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-app-accent/70 pointer-events-none"
          style={{ transform: 'scaleX(0)' }}
        />
      </header>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection={activeSection}
      />
    </>
  );
};

export default Navbar;
