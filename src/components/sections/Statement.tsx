'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import {
  MQ,
  TIER,
  addMotionTiers,
  GSAP_EASE,
  DUR,
  STATEMENT_SCRUB_CONFIG as S,
} from '../../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

const STATEMENT_TEXT =
  'Crafting professional, luxurious, and high-performance digital experiences that bridge visual art with solid engineering';

/**
 * Resolves the lit word colour from the live palette rather than hardcoding
 * it, so this file cannot drift from globals.css. Falls back to the token's
 * literal value if the custom property is missing.
 */
function resolveLitColor(): string {
  if (typeof window === 'undefined') return S.litFallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(S.litVar)
    .trim();
  return value || S.litFallback;
}

export const Statement: React.FC = () => {
  const statementRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const overlineRef = useRef<HTMLSpanElement>(null);
  const accentDotRef = useRef<HTMLSpanElement>(null);

  /* ------------------------------------------------------------------ *
   * Per-word colour scrub — every tier.
   *
   * Words rest at STATEMENT_SCRUB_CONFIG.dimColor and resolve to the
   * primary text colour as the scroll position passes each one, left to
   * right, with the accent period arriving last.
   *
   * Colour ONLY, no transform. The reference treatment reads as words
   * resolving in place; adding a per-word lift on top makes 14 elements
   * bounce independently, which is noise rather than emphasis. It also
   * keeps this to a paint on one short text block instead of 14 composited
   * layers.
   *
   * Visibility (I1): the <h2> is authored at `text-app-text-primary` with
   * plain text content, so with no JS it renders fully lit and legible.
   * The dim state exists only inside a matchMedia branch, and even that
   * state measures 3.14:1 — AA for large text — so a reader who lands
   * mid-section or stops scrolling can still read every word.
   *
   * The accent period needs NO special handling, and the first attempt at
   * this got that wrong. Passing it to SplitText's `ignore` looked correct
   * but excluded the word CONTAINING it from `self.words`, so the final
   * word ("engineering") was never animated — measured stuck at the lit
   * colour while the other 13 scrubbed. Letting the period split normally
   * fixes that, and its accent survives on its own: the colour tween writes
   * an inline `color` on the WORD span, and the period is a child with its
   * own `text-app-accent` declaration, which wins over inheritance.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const section = statementRef.current;
      const heading = textRef.current;
      const overline = overlineRef.current;
      const accentDot = accentDotRef.current;
      if (!section || !heading) return;

      const litColor = resolveLitColor();
      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];

        if (overline) {
          gsap.fromTo(
            overline,
            { opacity: 0.3, y: 10 * T.amp },
            {
              opacity: 1,
              y: 0,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                trigger: overline,
                start: S.overlineStart,
                end: S.overlineEnd,
                scrub: T.scrub,
              },
            }
          );
        }

        const split = SplitText.create(heading, {
          type: 'lines,words',
          linesClass: 'statement-line',
          wordsClass: 'statement-word',
          aria: 'auto',
          autoSplit: true,
          onSplit: (self) => {
            // Keep the accent period out of the colour tween. SplitText
            // preserves the <span class="statement-period"> element but
            // wraps its text in a word div INSIDE it, so writing an inline
            // colour on that word would override the accent coming from its
            // own parent. Filtering by ancestor is structural — it holds
            // however SplitText chooses to nest.
            const targets = self.words.filter(
              (w) => !w.closest('.statement-period')
            );

            // Dim every word UP FRONT rather than trusting the tween's
            // from-state. A staggered fromTo only renders its FIRST
            // sub-tween immediately: measured at scroll 0, words 2..14 were
            // still sitting at the lit colour, and each would have snapped
            // to grey at the instant its own sub-tween began. That reads as
            // a flash of grey chasing the scroll — the exact opposite of
            // words resolving as you reach them.
            gsap.set(targets, { color: S.dimColor });

            return gsap.to(targets, {
              color: litColor,
              duration: S.wordDuration,
              stagger: S.wordStagger,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                // The HEADING, not the section. See STATEMENT_SCRUB_CONFIG:
                // the section's 128px top padding put the whole scrub window
                // below the fold, so the reveal finished before the text was
                // readable.
                trigger: heading,
                start: S.start,
                end: S.end,
                scrub: T.scrub,
                invalidateOnRefresh: true,
              },
            });
          },
        });

        // The period is the punchline: its window starts where the word
        // scrub is already most of the way through, so it lands after the
        // final word has resolved rather than alongside it.
        if (accentDot) {
          gsap.fromTo(
            accentDot,
            { opacity: 0.25, scale: 0.7 },
            {
              opacity: 1,
              scale: 1,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                trigger: heading,
                start: S.periodStart,
                end: S.periodEnd,
                scrub: T.scrub,
              },
            }
          );
        }

        return () => split.revert();
      });

      // Reduced motion: no split, no colour scrub. Text whose colour is
      // driven by scroll position is exactly the kind of motion this
      // preference asks us to drop, so the authored (fully lit) markup IS
      // the resting state and only a gentle fade is added.
      mm.add(MQ.reduced, () => {
        gsap.fromTo(
          heading,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: section, start: 'top 80%', once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: statementRef }
  );

  return (
    <div
      ref={statementRef}
      className="py-24 md:py-36 relative overflow-hidden border-y border-app-border/40 select-none"
    >
      {/* Subtle ambient lighting center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-app-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-5xl mx-auto px-6 text-center">
        <span
          ref={overlineRef}
          className="text-xs font-mono uppercase tracking-[0.25em] text-app-accent mb-6 block font-semibold"
        >
          PHILOSOPHY
        </span>

        <p
          ref={textRef}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-app-text-primary tracking-tight leading-[1.15] font-sans max-w-4xl mx-auto select-none"
        >
          {STATEMENT_TEXT}
          <span
            ref={accentDotRef}
            className="statement-period text-app-accent inline-block"
          >
            .
          </span>
        </p>
      </div>
    </div>
  );
};

export default Statement;
