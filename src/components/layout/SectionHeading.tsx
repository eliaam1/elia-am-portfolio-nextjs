'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { MQ, TIER, addMotionTiers, GSAP_EASE, DUR, REVEAL_START } from '../../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export type SectionHeadingVariant = 'chapter' | 'sub';

interface SectionHeadingProps {
  /** Two-digit chapter numeral. Chapter variant only. */
  index?: string;
  /** Mono overline, e.g. "PROFILE". Rendered after a "/" when an index is set. */
  overline?: string;
  /** The display title. Pass JSX so the trailing accent period can be styled. */
  title: React.ReactNode;
  /** Optional standfirst paragraph. */
  intro?: string;
  /**
   * `chapter` is one of the four top-level section titles (h2, with numeral).
   * `sub` is a block heading inside a merged section (h3, no numeral).
   *
   * The sub variant exists because collapsing nine sections into four cannot
   * mean four <h2>s and five orphaned bodies — the demoted blocks keep a real
   * heading one level down, so the document outline still describes the page
   * and screen-reader users can still navigate by heading.
   */
  variant?: SectionHeadingVariant;
  /** Centre the block. Used by the philosophy divider inside Work. */
  align?: 'left' | 'center';
  className?: string;
}

/**
 * Shared chapter / sub-block heading.
 *
 * Before this existed, the same overline + numeral + title + standfirst
 * markup was hand-written in seven section components — which is why their
 * numerals had drifted out of sequence and their bottom margins disagreed.
 *
 * Visibility (I1): every part is authored fully visible with no opacity-0
 * class. SplitText and the masked rises only ever run inside a matchMedia
 * branch, and `split.revert()` in cleanup restores the original DOM.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  index,
  overline,
  title,
  intro,
  variant = 'chapter',
  align = 'left',
  className = '',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const q = gsap.utils.selector(root);
      const meta = q('.heading-meta')[0];
      const titleEl = q('.heading-title')[0];
      const introEl = q('.heading-intro')[0];

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        const splits: SplitText[] = [];

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: REVEAL_START, once: true },
        });

        if (meta) {
          tl.from(meta, { yPercent: 130, duration: 0.45, ease: GSAP_EASE.snap });
        }

        if (titleEl) {
          const split = SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'heading-title-line',
            aria: 'auto',
          });
          splits.push(split);
          tl.from(
            split.lines,
            {
              yPercent: 110,
              duration: 0.62,
              stagger: 0.08,
              ease: GSAP_EASE.snap,
            },
            '-=0.28'
          );
        }

        if (introEl) {
          tl.from(
            introEl,
            { opacity: 0, y: T.item, duration: T.dur, ease: GSAP_EASE.out },
            '-=0.4'
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
            scrollTrigger: { trigger: root, start: REVEAL_START, once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: rootRef }
  );

  const isChapter = variant === 'chapter';
  const centered = align === 'center';

  return (
    <div
      ref={rootRef}
      className={`${isChapter ? 'mb-14 md:mb-20' : 'mb-10 md:mb-14'} ${
        centered ? 'text-center mx-auto max-w-3xl' : 'text-left'
      } select-none ${className}`}
    >
      {(index || overline) && (
        <span className="reveal-mask-inline mb-4">
          <span
            className={`heading-meta flex items-center gap-3 ${
              centered ? 'justify-center' : ''
            }`}
          >
            {index && (
              <span className="text-xs font-mono font-bold text-app-accent">
                {index}
              </span>
            )}
            {overline && (
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-app-text-secondary font-semibold">
                {index ? `/ ${overline}` : overline}
              </span>
            )}
          </span>
        </span>
      )}

      {isChapter ? (
        <h2 className="heading-title text-3xl sm:text-5xl lg:text-6xl font-black text-app-text-primary tracking-tight font-sans leading-[1.05]">
          {title}
        </h2>
      ) : (
        <h3 className="heading-title text-2xl sm:text-3xl lg:text-4xl font-black text-app-text-primary tracking-tight font-sans leading-[1.08]">
          {title}
        </h3>
      )}

      {intro && (
        <p
          className={`heading-intro mt-4 text-base sm:text-lg text-app-text-secondary leading-relaxed font-sans ${
            centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
