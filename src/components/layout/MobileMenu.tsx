'use client';

import React, { useEffect, useRef } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { NAV_LINKS } from '../../config/constants';
import { getLenis } from '../../lib/lenis';
import { MQ, GSAP_EASE, DUR } from '../../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}

/**
 * Full-viewport navigation overlay.
 *
 * Sits at z-[1000], above the header's z-[999], and carries its own brand and
 * close button — a full-screen menu with the page header still floating on
 * top of it reads as a broken layer rather than a menu.
 *
 * Always mounted, so the close animation has something to play on, and hidden
 * with `visibility` rather than conditional rendering. Visibility is the
 * correct property here rather than opacity alone, because it also removes
 * the panel from the tab order while closed.
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  activeSection,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Scroll lock, Escape, and the flag the Navbar's hide/reveal reads. */
  useEffect(() => {
    const root = document.documentElement;
    const lenis = getLenis();

    if (isOpen) {
      root.dataset.navOpen = 'true';
      root.style.overflow = 'hidden';
      lenis?.stop();
      // Move focus into the dialog: the trigger that opened it is now buried
      // underneath the overlay.
      closeRef.current?.focus();
    } else {
      delete root.dataset.navOpen;
      root.style.overflow = '';
      lenis?.start();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      delete root.dataset.navOpen;
      root.style.overflow = '';
      lenis?.start();
    };
  }, [isOpen, onClose]);

  /* Open / close choreography. */
  useGSAP(
    () => {
      const root = rootRef.current;
      const panel = panelRef.current;
      if (!root || !panel) return;

      const q = gsap.utils.selector(root);
      const rows = q('.menu-row');
      const meta = q('.menu-meta');
      const reduced = window.matchMedia(MQ.reduced).matches;

      if (isOpen) {
        gsap.set(root, { visibility: 'visible', pointerEvents: 'auto' });

        if (reduced) {
          gsap.set(panel, { yPercent: 0 });
          gsap.set([...rows, ...meta], { opacity: 1, yPercent: 0, y: 0 });
          return;
        }

        const tl = gsap.timeline();
        tl.fromTo(
          panel,
          { yPercent: -100 },
          { yPercent: 0, duration: 0.55, ease: GSAP_EASE.out }
        )
          .fromTo(
            rows,
            { yPercent: 115, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.07,
              ease: GSAP_EASE.snap,
            },
            '-=0.28'
          )
          .fromTo(
            meta,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: GSAP_EASE.out },
            '-=0.3'
          );
        return;
      }

      // Closing. Hide only once the panel has actually left, otherwise the
      // exit animation is never seen.
      if (reduced) {
        gsap.set(root, { visibility: 'hidden', pointerEvents: 'none' });
        return;
      }

      gsap.to(panel, {
        yPercent: -100,
        duration: DUR.slow,
        ease: GSAP_EASE.exit,
        onComplete: () => {
          gsap.set(root, { visibility: 'hidden', pointerEvents: 'none' });
        },
      });
    },
    { scope: rootRef, dependencies: [isOpen] }
  );

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    onClose();

    const element = document.getElementById(id);
    if (!element) return;

    // Wait for the close animation and the scroll unlock to land. Scrolling
    // immediately would call Lenis while it is still stopped, and the jump is
    // silently dropped.
    window.setTimeout(() => {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(element, { offset: -80, duration: 1.2 });
      } else {
        window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
      }
    }, 340);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[1000] invisible pointer-events-none"
      aria-hidden={!isOpen}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="absolute inset-0 bg-app-bg flex flex-col"
      >
        {/* Overlay header */}
        <div className="flex items-center justify-between px-6 md:px-10 h-20 shrink-0 border-b border-app-border/40">
          <span className="text-base sm:text-lg font-black tracking-tight text-app-text-primary font-sans select-none">
            Elia Abdel Massih<span className="text-app-accent">.</span>
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            type="button"
            className="p-2.5 rounded-full border border-app-border text-app-text-primary hover:text-app-accent hover:border-app-accent/50 focus:outline-none transition-colors duration-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Oversized link list */}
        <nav
          className="flex-1 flex flex-col justify-center px-6 md:px-10 max-w-7xl w-full mx-auto"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link, idx) => {
            const isActive = activeSection === link.id;
            return (
              <span key={link.id} className="reveal-mask block">
                <a
                  href={`#${link.id}`}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`menu-row group flex items-baseline gap-4 sm:gap-8 py-2 sm:py-3 font-black tracking-[-0.02em] font-sans transition-colors duration-200 ${
                    isActive
                      ? 'text-app-accent'
                      : 'text-app-text-primary hover:text-app-accent'
                  }`}
                  style={{ fontSize: 'clamp(2rem, 8vw, 5rem)' }}
                >
                  <span className="font-mono text-[0.24em] font-bold text-app-accent tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-[0.36em] h-[0.36em] ml-auto opacity-0 -translate-x-2 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                </a>
              </span>
            );
          })}
        </nav>

        {/* Overlay footer meta */}
        <div className="px-6 md:px-10 pb-10 pt-6 shrink-0 border-t border-app-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="menu-meta text-[11px] font-mono uppercase tracking-[0.2em] text-app-text-secondary">
            Zahl&eacute;, Lebanon
          </p>
          <a
            href="https://wa.me/96176330429"
            target="_blank"
            rel="noopener noreferrer"
            className="menu-meta inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.2em] text-app-accent hover:text-app-text-primary transition-colors duration-200"
          >
            Start a conversation
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
