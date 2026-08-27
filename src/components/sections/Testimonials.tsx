'use client';

import React, { useRef } from 'react';
import { Quote, Star } from 'lucide-react';
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
  TESTIMONIAL_CONFIG as C,
} from '../../config/motion';
import type { Testimonial } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  loading: boolean;
}

export const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials,
  loading,
}) => {
  const wallRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ *
   * Quote wall.
   *
   * Every record is rendered and every record is visible. The previous
   * version was a carousel on a 6-second setInterval, which with two records
   * meant half the section was always hidden behind a timer, moved without
   * being asked to, and then needed arrows and dots to undo. A wall has no
   * hidden state to manage — and it gets BETTER as records are added, which
   * is the direction this content is going.
   *
   * Two independent layers per card:
   *
   *   ENTRANCE (once-only) — the quote reveals line by line behind clip
   *   masks, the accent rule draws across, rating stars pop in sequence, the
   *   author block settles.
   *
   *   DRIFT (scrubbed) — adjacent cards move in OPPOSITE directions, so the
   *   grid reads as two columns travelling independently rather than one
   *   block sliding past.
   *
   * The entrance only ever touches the card's CHILDREN and the drift only
   * ever touches the card ITSELF, so the two can never fight over transform.
   *
   * Visibility (I1): authored markup has no opacity-0 anywhere — with no JS
   * this is a plain, complete, readable grid of quotes. SplitText runs only
   * inside a matchMedia branch and reverts on cleanup.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const wall = wallRef.current;
      if (!wall) return;

      const cards = Array.from(wall.querySelectorAll<HTMLElement>('.tm-card'));
      if (cards.length === 0) return;

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        const splits: SplitText[] = [];

        cards.forEach((card, idx) => {
          const q = gsap.utils.selector(card);
          const mark = q('.tm-mark')[0];
          const quote = q('.tm-quote')[0];
          const rule = q('.tm-rule')[0];
          const stars = q('.tm-star');
          const author = q('.tm-author')[0];

          const tl = gsap.timeline({
            scrollTrigger: { trigger: card, start: C.revealStart, once: true },
          });

          if (mark) {
            tl.from(mark, {
              opacity: 0,
              scale: 0.6,
              duration: 0.45,
              ease: GSAP_EASE.snap,
            });
          }

          if (quote) {
            const split = SplitText.create(quote, {
              type: 'lines',
              mask: 'lines',
              linesClass: 'tm-quote-line',
              aria: 'auto',
            });
            splits.push(split);
            tl.from(
              split.lines,
              {
                yPercent: 110,
                duration: C.lineRise,
                stagger: C.lineStagger,
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
                duration: C.ruleDraw,
                ease: GSAP_EASE.out,
                transformOrigin: 'left center',
              },
              '-=0.35'
            );
          }

          if (stars.length > 0) {
            tl.from(
              stars,
              {
                opacity: 0,
                scale: 0.4,
                duration: 0.32,
                stagger: C.starStagger,
                ease: 'back.out(2)',
              },
              '-=0.3'
            );
          }

          if (author) {
            tl.from(
              author,
              {
                opacity: 0,
                y: T.item,
                duration: T.dur,
                ease: GSAP_EASE.out,
              },
              '-=0.28'
            );
          }

          // Opposed drift. The sign alternates by index, so on a two-column
          // grid the columns always travel against each other.
          const direction = idx % 2 === 0 ? 1 : -1;
          const drift = C.columnDrift * T.amp * direction;
          gsap.fromTo(
            card,
            { y: drift },
            {
              y: -drift,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                trigger: wall,
                start: 'top bottom',
                end: 'bottom top',
                scrub: T.scrub,
                invalidateOnRefresh: true,
              },
            }
          );
        });

        return () => splits.forEach((s) => s.revert());
      });

      mm.add(MQ.reduced, () => {
        gsap.fromTo(
          cards,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            stagger: 0.08,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: wall, start: 'top 85%', once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: wallRef, dependencies: [loading, testimonials.length] }
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-app-surface border border-app-border/80 h-72 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const ordered = [...testimonials].sort((a, b) => a.sort_order - b.sort_order);

  if (ordered.length === 0) return null;

  return (
    <div
      ref={wallRef}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start select-none"
    >
      {ordered.map((t) => (
        <figure
          key={t.id}
          className="tm-card relative flex flex-col rounded-2xl bg-app-surface border border-app-border/80 p-7 sm:p-9 shadow-lg transition-[border-color,box-shadow] duration-300 hover:border-app-accent/40 hover:shadow-xl"
        >
          {/* Decorative quote mark */}
          <Quote
            className="tm-mark w-9 h-9 text-app-accent/25 mb-5 shrink-0"
            aria-hidden="true"
          />

          <blockquote className="tm-quote text-lg sm:text-xl lg:text-2xl text-app-text-primary leading-snug font-sans font-medium tracking-tight">
            {t.content}
          </blockquote>

          {/* Accent rule — a real element, because a border cannot be scaled. */}
          <span className="tm-rule mt-7 mb-6 block h-[2px] w-full origin-left bg-app-accent/40" />

          {t.rating !== null && (
            <div
              className="flex items-center gap-1 mb-5"
              aria-label={`Rated ${t.rating} out of 5`}
            >
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="tm-star w-4 h-4 fill-app-accent text-app-accent"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          <figcaption className="tm-author flex items-center gap-4 mt-auto">
            {t.author_avatar_url ? (
              <img
                src={t.author_avatar_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-app-border/80 shrink-0"
                loading="lazy"
              />
            ) : (
              <span className="w-12 h-12 rounded-full bg-app-bg border border-app-border/80 flex items-center justify-center font-bold text-app-accent font-mono text-sm shrink-0">
                {t.author_name.charAt(0)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-bold text-app-text-primary text-sm sm:text-base font-sans tracking-tight">
                {t.author_name}
              </span>
              <span className="block text-xs font-mono text-app-text-secondary mt-0.5 truncate">
                {t.author_title}
                {t.author_company ? ` • ${t.author_company}` : ''}
              </span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
};

export default Testimonials;
