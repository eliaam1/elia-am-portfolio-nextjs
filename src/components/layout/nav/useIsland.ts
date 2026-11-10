'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { NAV_LINKS } from '../../../config/constants';
import { CHAPTER_NUMBERS, DOCK_QUERY, RING_LENGTH } from './navData';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const REDUCED = '(prefers-reduced-motion: reduce)';
/** Scroll distance after which the wide island folds into the compact one. */
const COMPACT_AFTER_PX = 120;
/** Seconds the island takes to change size. */
const MORPH_S = 0.55;
/**
 * The island's triggers measure sections that sit below pinned scenes, so they
 * must refresh after those pins (lower priority refreshes later).
 */
const AFTER_PINS = -1;

const all = (root: Element, sel: string): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(sel));

/** Flip-style resize: measure, change state, then animate from the old box to the new one. */
function morph(isl: HTMLElement, change: () => void): void {
  // `from` is what is on screen now, mid-tween included; `to` must be measured
  // free of any inline size an earlier, interrupted morph left behind
  const from = isl.getBoundingClientRect();
  gsap.killTweensOf(isl);
  gsap.set(isl, { clearProps: 'width,height' });
  change();
  if (window.matchMedia(REDUCED).matches) return;
  const to = isl.getBoundingClientRect();
  gsap.fromTo(
    isl,
    { width: from.width, height: from.height },
    { width: to.width, height: to.height, duration: MORPH_S, ease: 'power3.inOut', clearProps: 'width,height' }
  );
  gsap.fromTo(all(isl, '.isl-row'), { opacity: 0 }, { opacity: 1, duration: 0.35, delay: 0.15, overwrite: true });
}

/** Opens or closes the menu panel inside the island. Closing from inside it hands focus back to Menu. */
function setOpen(isl: HTMLElement, on: boolean): void {
  if (isl.classList.contains('is-open') === on) return;
  const focusWasInside = isl.querySelector('.isl-drop')?.contains(document.activeElement) ?? false;
  morph(isl, () => isl.classList.toggle('is-open', on));
  isl.querySelector('.isl-menu')?.setAttribute('aria-expanded', String(on));
  if (!on && focusWasInside) isl.querySelector<HTMLElement>('.isl-menu')?.focus({ preventScroll: true });
  if (on && !window.matchMedia(REDUCED).matches) {
    gsap.from(all(isl, '.isl-drop-l'), { yPercent: 110, duration: 0.7, stagger: 0.05, ease: 'power4.out', delay: 0.1 });
  }
}

/** Writes the current chapter into the island: number, label, aria-current. */
function showChapter(isl: HTMLElement, i: number): void {
  const num = isl.querySelector('[data-where-n]');
  const label = isl.querySelector('[data-where-l]');
  if (num) num.textContent = CHAPTER_NUMBERS[i];
  if (label) label.textContent = NAV_LINKS[i].label;
  all(isl, '[data-chapter]').forEach((a) => {
    if (a.dataset.chapter === NAV_LINKS[i].id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}

/**
 * One trigger per chapter, from its top reaching mid-screen to the next one's.
 * Drives which chapter the island names and how far the ring has filled.
 */
function trackChapters(isl: HTMLElement): void {
  const ring = isl.querySelector<SVGCircleElement>('[data-ring]');
  // elements, not '#id' strings: useGSAP's scope (the header) would scope a selector to itself
  const sections = NAV_LINKS.map((l) => document.getElementById(l.id));
  NAV_LINKS.forEach((_, i) => {
    const section = sections[i];
    const next = sections[i + 1];
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      ...(next ? { endTrigger: next, end: 'top 50%' } : { end: 'bottom 50%' }),
      refreshPriority: AFTER_PINS,
      onToggle: (self) => self.isActive && showChapter(isl, i),
      onUpdate: (self) => ring?.style.setProperty('stroke-dashoffset', String(RING_LENGTH * (1 - self.progress))),
    });
  });
  // WhatsApp would repeat itself over the Contact section
  const contact = document.getElementById('contact');
  if (!contact) return;
  ScrollTrigger.create({
    trigger: contact,
    start: 'top 70%',
    end: 'bottom 30%',
    refreshPriority: AFTER_PINS,
    toggleClass: { targets: isl, className: 'is-over-contact' },
  });
}

/** Closes the menu on Escape and on a press outside the island. */
function listenForDismiss(isl: HTMLElement): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !isl.classList.contains('is-open')) return;
    setOpen(isl, false);
    isl.querySelector<HTMLElement>('.isl-menu')?.focus();
  };
  const onPress = (e: PointerEvent) => {
    if (!isl.contains(e.target as Node)) setOpen(isl, false);
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('pointerdown', onPress);
  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('pointerdown', onPress);
  };
}

/**
 * The floating island: wide over the hero on desktop, compact once you scroll
 * (always compact, docked at the bottom, on phones), with the current chapter,
 * its progress ring and a menu that grows out of the same island.
 * Returns `toggle` / `close` for the menu button and the links.
 */
export function useIsland(islRef: RefObject<HTMLElement | null>): { toggle: () => void; close: () => void } {
  useGSAP(
    () => {
      const isl = islRef.current;
      if (!isl) return;
      trackChapters(isl);
      ScrollTrigger.create({
        start: `top -${COMPACT_AFTER_PX}px`,
        end: 'max',
        // the class always tracks scroll, so widening a phone mid-page shows the
        // compact island; docked (phone) layouts are compact in CSS regardless
        onToggle: (self) => {
          if (window.matchMedia(DOCK_QUERY).matches) {
            isl.classList.toggle('is-compact', self.isActive);
            return;
          }
          setOpen(isl, false);
          morph(isl, () => isl.classList.toggle('is-compact', self.isActive));
        },
      });
      return listenForDismiss(isl);
    },
    { scope: islRef }
  );

  const withIsland = (fn: (isl: HTMLElement) => void) => () => {
    if (islRef.current) fn(islRef.current);
  };
  return {
    toggle: withIsland((isl) => setOpen(isl, !isl.classList.contains('is-open'))),
    close: withIsland((isl) => setOpen(isl, false)),
  };
}
