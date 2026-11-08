'use client';

import React, { useState, useRef } from 'react';
import { Menu } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { NAV_LINKS, CONTACT } from '../../config/constants';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { getLenis } from '../../lib/lenis';
import { MQ, GSAP_EASE } from '../../config/motion';
import BrandMark from '../brand/BrandMark';
import MobileMenu from './MobileMenu';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** The logo already returns to the top, so "Home" is not repeated in the pill. */
const PILL_LINKS = NAV_LINKS.filter((link) => link.id !== 'hero');

/** Scroll distance before the bar gains its glass background. */
const GLASS_AFTER_PX = 40;
/** Scroll distance before direction-aware hide/reveal kicks in. */
const HIDE_AFTER_PX = 140;
/** Header height used as the anchor-scroll offset. */
const HEADER_OFFSET_PX = 88;
const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const sectionIds = NAV_LINKS.map((link) => link.id);
  const activeSection = useScrollSpy(sectionIds);

  /* ------------------------------------------------------------------ *
   * Glass state + direction-aware hide/reveal.
   *
   * Both read from ScrollTrigger rather than a scroll listener, so they share
   * the single rAF loop Lenis already drives.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      const glass = ScrollTrigger.create({
        start: `top -${GLASS_AFTER_PX}px`,
        onToggle: (self) => setIsScrolled(self.isActive),
      });

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const hide = ScrollTrigger.create({
          start: `top -${HIDE_AFTER_PX}px`,
          end: 'max',
          onUpdate: (self) => {
            // Never retract while the overlay is open.
            if (document.documentElement.dataset.navOpen === 'true') return;
            gsap.to(header, {
              yPercent: self.direction === 1 ? -110 : 0,
              duration: 0.45,
              ease: GSAP_EASE.out,
              overwrite: true,
            });
          },
          onLeaveBack: () => {
            gsap.to(header, { yPercent: 0, duration: 0.3, ease: GSAP_EASE.out, overwrite: true });
          },
        });

        // A keyboard user tabbing into the retracted header must see it.
        const reveal = () => {
          gsap.to(header, { yPercent: 0, duration: 0.3, ease: GSAP_EASE.out, overwrite: true });
        };
        header.addEventListener('focusin', reveal);

        return () => {
          header.removeEventListener('focusin', reveal);
          hide.kill();
          gsap.set(header, { yPercent: 0 });
        };
      });

      return () => {
        glass.kill();
        mm.revert();
      };
    },
    { scope: headerRef }
  );

  /* ------------------------------------------------------------------ *
   * Travelling highlight.
   *
   * One raised pill that slides and resizes between links. A single moving
   * object reads as one continuous indicator; per-link states would read as
   * several things blinking. Re-measured when the section changes (animated)
   * and, instantly, whenever the nav's box changes — it is display:none below
   * lg, so crossing that breakpoint or a late font swap would otherwise leave
   * it at a stale size.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const nav = navRef.current;
      const pill = indicatorRef.current;
      if (!nav || !pill) return;

      const place = (immediate: boolean) => {
        const active = nav.querySelector<HTMLElement>(`[data-nav-id="${activeSection}"]`);
        if (!active || active.offsetWidth === 0) {
          gsap.to(pill, { opacity: 0, duration: immediate ? 0 : 0.2, overwrite: true });
          return;
        }
        const instant = immediate || window.matchMedia(MQ.reduced).matches;
        gsap.to(pill, {
          opacity: 1,
          x: active.offsetLeft,
          width: active.offsetWidth,
          duration: instant ? 0 : 0.5,
          ease: GSAP_EASE.out,
          overwrite: true,
        });
      };

      place(false);

      const observer = new ResizeObserver(() => place(true));
      observer.observe(nav);
      let alive = true;
      document.fonts?.ready.then(() => {
        if (alive) place(true);
      });

      return () => {
        alive = false;
        observer.disconnect();
      };
    },
    { scope: navRef, dependencies: [activeSection] }
  );

  const scrollTo = (target: number | HTMLElement) => {
    const offset = typeof target === 'number' ? 0 : -HEADER_OFFSET_PX;
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.4 });
      return;
    }
    window.scrollTo({
      top: typeof target === 'number' ? target : target.offsetTop + offset,
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
        className={`fixed inset-x-0 top-0 z-[999] h-20 flex items-center border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out ${
          isScrolled
            ? 'bg-app-bg/75 border-app-border/70 backdrop-blur-xl backdrop-saturate-150'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="w-full px-[clamp(16px,4vw,56px)] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Brand */}
          <a
            href="#hero"
            onClick={handleLogoClick}
            aria-label="Elia Abdel Massih, back to top"
            className="group justify-self-start inline-flex items-center gap-4 text-app-text-primary select-none"
          >
            <BrandMark
              title=""
              className="h-8 w-auto transition-transform duration-500 ease-[var(--ease-snap)] hover-fine:group-hover:-translate-y-0.5"
            />
            <span aria-hidden="true" className="hidden xl:block h-5 w-px bg-app-border" />
            <span
              aria-hidden="true"
              className="hidden xl:block font-mono text-[11px] font-medium uppercase tracking-[0.36em] text-app-text-secondary group-hover:text-app-text-primary transition-colors duration-200"
            >
              Elia Abdel Massih
            </span>
          </a>

          {/* Desktop: glass pill of chapter links */}
          <nav
            ref={navRef}
            aria-label="Primary"
            className="relative hidden lg:flex items-center p-1.5 rounded-full border border-app-border bg-app-surface/70 backdrop-blur-xl"
          >
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="absolute left-0 top-1.5 bottom-1.5 rounded-full bg-app-surface-2 shadow-[inset_0_0_0_1px_rgba(189,230,106,0.18)] pointer-events-none opacity-0"
              style={{ width: 0 }}
            />
            {PILL_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  data-nav-id={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`relative z-[1] px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-app-text-primary' : 'text-app-text-secondary hover:text-app-text-primary'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
          {/* Keeps the grid's centre column in place below lg. */}
          <span className="lg:hidden" aria-hidden="true" />

          {/* Actions */}
          <div className="justify-self-end flex items-center gap-2">
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group hidden sm:inline-flex items-center gap-2 h-11 pl-4 pr-5 rounded-full bg-app-accent text-app-on-accent text-sm font-semibold transition-[background-color,transform] duration-200 hover:bg-accent-400 active:scale-[0.97]"
            >
              <FaWhatsapp aria-hidden="true" className="h-[18px] w-[18px]" />
              WhatsApp me
              <span
                aria-hidden="true"
                className="transition-transform duration-300 ease-[var(--ease-snap)] hover-fine:group-hover:translate-x-1"
              >
                →
              </span>
            </a>
            <button
              onClick={() => setIsMenuOpen(true)}
              type="button"
              className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-full border border-app-border bg-app-surface/70 backdrop-blur-xl text-app-text-primary hover:border-app-accent/60 transition-colors duration-200"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection={activeSection}
      />
    </>
  );
}

export default Navbar;
