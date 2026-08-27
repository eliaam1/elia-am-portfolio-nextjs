'use client';

import React, { useRef } from 'react';
import { Briefcase, GraduationCap, Calendar, MapPin } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { formatDate } from '../../lib/utils';
import { MQ, TIER, addMotionTiers, GSAP_EASE, DUR } from '../../config/motion';
import type { Experience as ExperienceType } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

interface ExperienceProps {
  experience: ExperienceType[];
  loading: boolean;
}

export const Experience: React.FC<ExperienceProps> = ({ experience, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ *
   * Timeline choreography.
   *
   * The accent rail draws down as you scroll, and each row assembles as it
   * arrives: node blooms, date rises behind a mask, title reveals line by
   * line, company and body settle.
   *
   * The active highlight is a CLASS TOGGLE driven by ScrollTrigger, not React
   * state — and that is a fix rather than a style preference. The previous
   * version gave every row its own `useInView({ triggerOnce: false })`, so
   * all six rows re-rendered React on every scroll crossing, in both
   * directions, for the whole life of the page. A toggleClass costs one
   * classList write, never touches the React tree, and lets the node and the
   * card share a single source of truth through `.is-live` descendant
   * selectors.
   *
   * Each row's assembly is SCRUBBED, not once-only: the card is bound to
   * scroll position across the band where it travels into reading position,
   * so it is genuinely driven by the wheel rather than merely triggered by
   * it. Scrolling back up runs it backwards, which is the point — a
   * once-only reveal is over before a heavy gesture can be felt.
   *
   * Direction comes from `data-side` on the row rather than being recomputed
   * from index parity here. Parity and the flex-direction that positions the
   * card are decided together in the markup, so deriving it twice is how the
   * two silently disagree the next time the layout changes.
   *
   * Visibility (I1): no authored opacity-0 anywhere. Every hidden state is
   * created inside a matchMedia branch, and each scrub band ENDS at the
   * resting state, so a row already above the band when triggers are built
   * is rendered at progress 1 rather than left hidden.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const container = containerRef.current;
      const line = lineRef.current;
      if (!container) return;

      const rows = Array.from(
        container.querySelectorAll<HTMLElement>('.timeline-row')
      );
      if (rows.length === 0) return;

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        // Scales every displacement and rotation below. A 26% slide and 22
        // degrees of hinge read as confident on a 1440px column and as a
        // lurch on a 375px one, where the card is nearly the full width.
        const amp = T.amp;
        const splits: SplitText[] = [];

        if (line) {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: GSAP_EASE.scrub,
              scrollTrigger: {
                trigger: container,
                start: 'top 70%',
                end: 'bottom 70%',
                scrub: T.scrub,
                invalidateOnRefresh: true,
              },
            }
          );
        }

        rows.forEach((row) => {
          const q = gsap.utils.selector(row);
          const node = q('.timeline-node')[0];
          const card = q('.timeline-card')[0];
          const date = q('.timeline-date')[0];
          const title = q('.timeline-title')[0];
          const rest = q('.timeline-rest');

          // -1 travels in from the left, +1 from the right. Below md every
          // row stacks on the same side of the rail, so a mirrored approach
          // there would read as random rather than as two columns.
          const fromRight = row.dataset.side === 'right';
          const dir = tier === 'phone' ? 1 : fromRight ? 1 : -1;

          // One scrubbed band per row: begins as the row's top clears the
          // viewport floor, completes once it reaches reading height.
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: row,
              start: 'top 92%',
              end: 'top 42%',
              scrub: T.scrub,
              invalidateOnRefresh: true,
            },
          });

          if (card) {
            // The heavy part: the card swings in on a hinge at its inner
            // edge. transformPerspective is per-element rather than a
            // perspective on the container, so no ancestor needs a
            // stacking/transform context the sticky chains would inherit.
            tl.fromTo(
              card,
              {
                xPercent: 26 * dir * amp,
                yPercent: 14 * amp,
                rotationY: -22 * dir * amp,
                rotationZ: 2.5 * dir * amp,
                scale: 0.86,
                opacity: 0,
                transformPerspective: 1200,
                transformOrigin: dir > 0 ? 'left center' : 'right center',
              },
              {
                xPercent: 0,
                yPercent: 0,
                rotationY: 0,
                rotationZ: 0,
                scale: 1,
                opacity: 1,
                ease: GSAP_EASE.scrub,
              },
              0
            );
          }

          if (node) {
            // Overshoots past full size mid-band, so the marker punches in
            // rather than merely growing. Ends exactly at 1.
            tl.fromTo(
              node,
              { scale: 0, rotation: -150 * amp, opacity: 0 },
              { scale: 1, rotation: 0, opacity: 1, ease: GSAP_EASE.scrub },
              0.05
            );
          }

          if (date) {
            tl.fromTo(
              date,
              { yPercent: 130 },
              { yPercent: 0, ease: GSAP_EASE.scrub },
              0.25
            );
          }

          if (title) {
            const split = SplitText.create(title, {
              type: 'lines',
              mask: 'lines',
              linesClass: 'timeline-title-line',
              aria: 'auto',
            });
            splits.push(split);
            tl.fromTo(
              split.lines,
              { yPercent: 110 },
              { yPercent: 0, stagger: 0.12, ease: GSAP_EASE.scrub },
              0.3
            );
          }

          if (rest.length > 0) {
            tl.fromTo(
              rest,
              { opacity: 0, y: T.item * 1.6 },
              { opacity: 1, y: 0, stagger: 0.1, ease: GSAP_EASE.scrub },
              0.42
            );
          }

          // Active highlight. Crossing in and out is free — no render, no state.
          ScrollTrigger.create({
            trigger: row,
            start: 'top 72%',
            end: 'bottom 42%',
            toggleClass: { targets: row, className: 'is-live' },
          });
        });

        return () => splits.forEach((s) => s.revert());
      });

      mm.add(MQ.reduced, () => {
        if (line) gsap.set(line, { scaleY: 1 });
        gsap.fromTo(
          rows,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            stagger: 0.06,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: container, start: 'top 85%', once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [loading, experience.length] }
  );

  if (loading) {
    return (
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-app-border/20 -translate-x-[1px]" />
        <div className="flex flex-col gap-12">
          {[1, 2].map((i) => (
            <div key={i} className="pl-14 md:pl-0 md:w-[45%]">
              <div className="p-6 md:p-8 bg-app-surface border border-app-border/80 rounded-2xl animate-pulse h-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ordered = [...experience].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div ref={containerRef} className="relative max-w-4xl mx-auto select-none">
      {/* Static rail */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-app-border/30 -translate-x-[1px] rounded-full" />

      {/* Scrubbed accent rail — GPU scaleY, drawn as you scroll. */}
      <div
        ref={lineRef}
        className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-app-accent origin-top rounded-full shadow-[0_0_10px_rgba(15,61,222,0.45)]"
        style={{ transform: 'translateX(-1px) scaleY(0)' }}
      />

      <div className="flex flex-col gap-12">
        {ordered.map((exp, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={exp.id}
              // Single source of truth for which side of the rail this card
              // sits on: `md:flex-row-reverse` puts it right, and the scrub
              // choreography reads this attribute rather than re-deriving
              // parity for itself.
              data-side={isEven ? 'right' : 'left'}
              className={`timeline-row group/row flex flex-col md:flex-row relative w-full ${
                isEven ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/*
                Node. ScrollTrigger writes `.is-live` on the ROW, so the node
                and the card both read one source of truth through
                group-[.is-live] descendant selectors rather than each
                tracking its own visibility.
              */}
              <div className="timeline-node absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full z-10 border bg-app-bg border-app-border/80 opacity-70 transition-[border-color,box-shadow,background-color,opacity] duration-300 group-[.is-live]/row:bg-app-surface group-[.is-live]/row:border-app-accent group-[.is-live]/row:opacity-100 group-[.is-live]/row:shadow-[0_0_20px_rgba(15,61,222,0.35)]">
                {exp.type === 'work' ? (
                  <Briefcase className="w-4 h-4 text-app-text-secondary/60 transition-colors duration-200 group-[.is-live]/row:text-app-accent" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-app-text-secondary/60 transition-colors duration-200 group-[.is-live]/row:text-app-accent" />
                )}
              </div>

              <div
                className={`w-full md:w-[45%] pl-14 md:pl-0 ${
                  isEven ? 'md:pr-10' : 'md:pl-10'
                }`}
              >
                <article className="timeline-card will-change-transform p-6 md:p-8 bg-app-surface border border-app-border/80 rounded-2xl relative text-left transition-[border-color,box-shadow] duration-300 group-[.is-live]/row:border-app-accent/60 group-[.is-live]/row:shadow-xl">
                  <span className="reveal-mask-inline">
                    <span className="timeline-date flex items-center gap-1.5 text-xs font-mono text-app-accent font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(exp.start_date)}</span>
                      <span>&ndash;</span>
                      <span>{formatDate(exp.end_date)}</span>
                    </span>
                  </span>

                  <h4 className="timeline-title text-lg font-bold text-app-text-primary mt-3 mb-1 tracking-tight font-sans leading-snug">
                    {exp.title}
                  </h4>

                  <p className="timeline-rest text-sm font-semibold text-app-text-secondary/90 mb-3 font-sans">
                    {exp.company}
                  </p>

                  {exp.location && (
                    <p className="timeline-rest flex items-center gap-1.5 text-xs text-app-text-secondary/70 mb-4 font-sans">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{exp.location}</span>
                    </p>
                  )}

                  <p className="timeline-rest text-xs sm:text-sm text-app-text-secondary leading-relaxed font-sans">
                    {exp.description}
                  </p>
                </article>
              </div>

              <div className="hidden md:block md:w-[45%]" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Experience;
