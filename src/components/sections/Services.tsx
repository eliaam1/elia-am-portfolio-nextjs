'use client';

import React, { useRef } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { getLenis } from '../../lib/lenis';
import TechRow from '../ui/TechIcon';
import ServicePlaceholder from '../ui/ServicePlaceholder';
import {
  MQ,
  TIER,
  addMotionTiers,
  GSAP_EASE,
  DUR,
  SERVICE_STACK_CONFIG as C,
} from '../../config/motion';
import type { Service } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

interface ServicesProps {
  services: Service[];
  loading: boolean;
}

/**
 * Per-rank visual weight.
 *
 * The stack gives every card the same width, so rank has to be carried by the
 * things that can still vary inside it: how much of the card the media claims,
 * how tall that media is, and the title's type scale. Collected in one table
 * rather than scattered through the JSX as conditionals, so the progression
 * from featured to supporting can be read — and adjusted — in one place.
 *
 * WordPress ('supporting') is the deliberate step down: narrower media column
 * and a title one step smaller than the three major cards, which is what keeps
 * the section from reading as CMS-first.
 */
const PROMINENCE = {
  featured: {
    media: 'lg:col-span-6',
    content: 'lg:col-span-6',
    mediaHeight: 'h-52 sm:h-72 lg:h-auto lg:min-h-[360px]',
    title: 'text-2xl sm:text-3xl lg:text-[2.25rem]',
    desc: 'text-base',
    pad: 'p-6 sm:p-8 lg:p-10',
    techSize: 'md' as const,
  },
  major: {
    media: 'lg:col-span-5',
    content: 'lg:col-span-7',
    mediaHeight: 'h-44 sm:h-56 lg:h-auto lg:min-h-[330px]',
    title: 'text-lg sm:text-xl lg:text-[1.75rem]',
    desc: 'text-sm sm:text-base',
    pad: 'p-6 sm:p-8 lg:p-10',
    techSize: 'sm' as const,
  },
  supporting: {
    media: 'lg:col-span-4',
    content: 'lg:col-span-8',
    mediaHeight: 'h-36 sm:h-48 lg:h-auto lg:min-h-[260px]',
    title: 'text-lg sm:text-xl lg:text-2xl',
    desc: 'text-sm',
    pad: 'p-5 sm:p-7 lg:p-9',
    techSize: 'sm' as const,
  },
} as const;

/**
 * Reads a px-valued CSS custom property off an element.
 *
 * The stack's `--service-top` / `--service-step` are authored in px
 * specifically so this can be a parseFloat — `6rem` would silently parse to
 * 6 and the fit test below would think it had 90px more room than it does.
 */
function readPxVar(el: HTMLElement, name: string, fallback: number): number {
  const parsed = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const Services: React.FC<ServicesProps> = ({ services, loading }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ *
   * Sticky card stack with a per-card internal reveal sequence.
   *
   * Two independent jobs, deliberately kept separate:
   *
   *   1. ARRIVAL (once-only). Each card assembles itself as it enters:
   *      index numeral rises behind a mask, accent rule draws across, title
   *      reveals line by line, media wipes open with a clip-path curtain,
   *      description lifts, deliverables stagger in from the left, CTA
   *      settles. This is the "all of its information appears inside it"
   *      sequence, and it runs on EVERY card at EVERY tier.
   *
   *   2. COVER (scrubbed). As the next card rises over this one, this one
   *      recedes and dims. Only meaningful when stacking is on.
   *
   * Ownership is split so nothing fights: the arrival timeline only ever
   * touches the card's CHILDREN, and the cover scrub only ever touches the
   * card ITSELF. Two tweens on one element's transform is the classic way
   * this kind of choreography breaks.
   *
   * Positioning is CSS `position: sticky` (see globals.css), never
   * ScrollTrigger `pin`. GSAP writes paint properties only, so there is no
   * fixed-vs-relative conflict available to hit.
   *
   * Trigger choice matters here: the cover scrub is anchored on the RUNWAY
   * element between two cards, not on the sticky card. A stuck element's
   * getBoundingClientRect is its stuck position, so ScrollTrigger measures
   * it wrong; the runway is an ordinary in-flow block and always measures
   * true.
   *
   * Visibility (I1): the SSR markup carries no authored opacity-0 and no
   * authored `position: sticky` — the stack renders as a plain, fully
   * readable list of cards with no JS at all. Both the hidden states and
   * the stacking are added at runtime inside matchMedia branches.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const stack = stackRef.current;
      if (!stack) return;

      const cards = Array.from(
        stack.querySelectorAll<HTMLElement>('.service-card')
      );
      if (cards.length === 0) return;

      const runways = Array.from(
        stack.querySelectorAll<HTMLElement>('.service-runway')
      );

      /**
       * Stacking is measured, not assumed.
       *
       * A sticky element taller than the room above the fold is a real trap:
       * it pins and its lower half becomes unreachable, because scrolling
       * stops moving it. So the tallest card has to fit under the deepest
       * sticky offset with clearance, or the whole stack stays in normal
       * flow. In practice that means it stacks on desktop and tablet, stacks
       * on a tall phone, and reads as a list on a short one — which is the
       * right answer in each case rather than a guess baked into a
       * breakpoint.
       */
      const fitsStacked = (): boolean => {
        const top = readPxVar(stack, '--service-top', 96);
        const step = readPxVar(stack, '--service-step', 14);
        const deepest = top + (cards.length - 1) * step;
        const tallest = cards.reduce((max, c) => Math.max(max, c.offsetHeight), 0);
        return tallest + deepest + C.fitMargin <= window.innerHeight;
      };

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        const splits: SplitText[] = [];

        // Decide stacking BEFORE building triggers. Flipping the attribute
        // changes every runway's height and therefore the document height,
        // so the triggers must be measured against the final layout.
        const stacked = fitsStacked();
        stack.dataset.stacked = stacked ? 'true' : 'false';

        cards.forEach((card, idx) => {
          const q = gsap.utils.selector(card);
          const media = q('.service-media')[0];
          const index = q('.service-index')[0];
          const rule = q('.service-rule')[0];
          const title = q('.service-title')[0];
          const desc = q('.service-desc')[0];
          const features = q('.service-feature');
          const cta = q('.service-cta')[0];

          const tl = gsap.timeline({
            scrollTrigger: { trigger: card, start: C.arriveStart, once: true },
          });

          if (index) {
            tl.from(index, {
              yPercent: 130,
              duration: C.indexRise,
              ease: GSAP_EASE.snap,
            });
          }

          if (rule) {
            tl.from(
              rule,
              {
                scaleX: 0,
                duration: 0.5,
                ease: GSAP_EASE.out,
                transformOrigin: 'left center',
              },
              '-=0.34'
            );
          }

          if (title) {
            const split = SplitText.create(title, {
              type: 'lines',
              mask: 'lines',
              linesClass: 'service-title-line',
              aria: 'auto',
            });
            splits.push(split);

            tl.from(
              split.lines,
              {
                yPercent: 110,
                duration: C.titleRise,
                stagger: C.titleStagger,
                ease: GSAP_EASE.snap,
              },
              '-=0.4'
            );
          }

          if (media) {
            tl.fromTo(
              media,
              { clipPath: 'inset(0% 0% 100% 0%)' },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                duration: C.mediaWipe,
                ease: GSAP_EASE.out,
              },
              '-=0.55'
            );
          }

          if (desc) {
            tl.from(
              desc,
              {
                opacity: 0,
                y: T.item,
                duration: T.dur,
                ease: GSAP_EASE.out,
              },
              '-=0.6'
            );
          }

          if (features.length > 0) {
            tl.from(
              features,
              {
                opacity: 0,
                x: -18 * T.amp,
                duration: 0.42,
                stagger: C.featureStagger,
                ease: GSAP_EASE.out,
              },
              '-=0.4'
            );
          }

          if (cta) {
            tl.from(
              cta,
              {
                opacity: 0,
                y: 16 * T.amp,
                duration: 0.42,
                ease: GSAP_EASE.out,
              },
              '-=0.22'
            );
          }

          // Cover recede. Runway `idx` is the stretch of scroll during which
          // card `idx + 1` climbs over card `idx`, so it maps one-to-one.
          // The last card is skipped on purpose: there is no card above it to
          // do the covering, and its runway exists only to give it a sticky
          // window of its own.
          const runway = runways[idx];
          const isCovered = idx < cards.length - 1;
          if (stacked && runway && isCovered) {
            gsap.to(card, {
              scale: 1 - (1 - C.coveredScale) * T.amp,
              opacity: 1 - (1 - C.coveredOpacity) * T.amp,
              ease: GSAP_EASE.scrub,
              transformOrigin: 'center top',
              scrollTrigger: {
                trigger: runway,
                start: C.coverStart,
                end: C.coverEnd,
                scrub: T.scrub,
                invalidateOnRefresh: true,
              },
            });
          }
        });

        // The stacking attribute changed the document height, so every
        // trigger on the page (not just ours) needs remeasuring.
        ScrollTrigger.refresh();

        return () => {
          splits.forEach((s) => s.revert());
          delete stack.dataset.stacked;
        };
      });

      // Reduced motion: no stacking and no sequence. Cards overlapping each
      // other under scroll control is exactly the kind of motion this
      // preference asks us to drop, so this is a plain list with a fade.
      mm.add(MQ.reduced, () => {
        stack.dataset.stacked = 'false';
        gsap.fromTo(
          cards,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            stagger: 0.08,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: stack, start: 'top 85%', once: true },
          }
        );
        return () => {
          delete stack.dataset.stacked;
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [loading, services.length] }
  );

  const handleInquire = () => {
    const contactSection = document.getElementById('contact');
    if (!contactSection) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(contactSection, { offset: -80, duration: 1.2 });
    } else {
      window.scrollTo({ top: contactSection.offsetTop - 80, behavior: 'smooth' });
    }
  };

  if (loading || services.length === 0) {
    return (
      <>
        <div className="mb-16 text-left">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-app-accent mb-3 block font-semibold">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-app-text-primary mb-4 tracking-tight font-sans">
            What I Do
          </h2>
          <div className="h-4 w-5/6 bg-app-surface border border-app-border/80 rounded-lg animate-pulse" />
        </div>

        <div className="flex flex-col gap-10">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-app-surface border border-app-border/80 h-72 animate-pulse"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div ref={sectionRef} className="text-left select-none">
        {/* Sticky card stack */}
        <div ref={stackRef} className="service-stack">
          {services.map((service, idx) => {
            const numberStr = String(idx + 1).padStart(2, '0');
            const P = PROMINENCE[service.prominence ?? 'major'];
            const isFeatured = service.prominence === 'featured';

            return (
              <React.Fragment key={service.id}>
                <article
                  className="service-card group/card rounded-2xl bg-app-surface border border-app-border/80 shadow-xl overflow-hidden"
                  style={
                    {
                      // Unitless number consumed by the `top: calc(...)` in
                      // globals.css. Stringified because React only omits the
                      // px suffix for custom properties when given a string.
                      '--service-index': String(idx),
                      zIndex: idx + 1,
                    } as React.CSSProperties
                  }
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Media — clip-path curtain target */}
                    <div
                      className={`service-media relative ${P.media} ${P.mediaHeight} bg-app-bg border-b lg:border-b-0 lg:border-r border-app-border/60 overflow-hidden`}
                    >
                      {/*
                        The inner wrapper, not the image, carries the hover
                        scale. A drawn placeholder is a <div>, not an <img>,
                        so scaling the media child directly would only work
                        for records that happen to have a real render.
                      */}
                      <div className="absolute inset-0 transition-transform duration-700 ease-out hover-fine:group-hover/card:scale-[1.04]">
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.08] transition-[filter] duration-500 hover-fine:group-hover/card:grayscale-0"
                            loading="lazy"
                          />
                        ) : (
                          <ServicePlaceholder serviceId={service.id} label={service.title} />
                        )}
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-app-surface/70 via-transparent to-transparent" />

                      {service.price_range && (
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-app-surface/90 backdrop-blur-md border border-app-border/80 text-[11px] font-mono font-semibold text-app-accent shadow-md">
                          {service.price_range}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`${P.content} flex flex-col ${P.pad}`}>
                      <div className="flex items-center gap-4 mb-5">
                        <span className="reveal-mask-inline">
                          <span className="service-index block font-mono text-sm font-bold text-app-accent">
                            {numberStr}
                          </span>
                        </span>
                        {/*
                          Only the featured card is labelled. Tagging the other
                          four with their rank would broadcast a hierarchy the
                          layout already communicates, and calling something
                          "supporting" in the interface undersells it to a
                          reader who was not looking for a ranking.
                        */}
                        {isFeatured && (
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-app-accent/80">
                            Core Capability
                          </span>
                        )}
                        <span className="service-rule block h-px flex-1 origin-left bg-app-border" />
                      </div>

                      <h3
                        className={`service-title ${P.title} font-black text-app-text-primary tracking-tight font-sans mb-4 leading-tight`}
                      >
                        {service.title}
                      </h3>

                      <p
                        className={`service-desc ${P.desc} text-app-text-secondary leading-relaxed font-sans mb-6`}
                      >
                        {service.description}
                      </p>

                      {service.tech && service.tech.length > 0 && (
                        <TechRow keys={service.tech} size={P.techSize} className="mb-7" />
                      )}

                      <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-app-text-secondary mb-3 font-semibold">
                        Key Deliverables
                      </h4>
                      <ul className="flex flex-col gap-2.5 mb-8">
                        {service.features.map((feature) => (
                          <li
                            key={feature}
                            className="service-feature flex items-start text-xs sm:text-sm text-app-text-primary font-sans leading-normal"
                          >
                            <Check className="w-4 h-4 text-app-accent mr-2.5 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/*
                        The GSAP target is this WRAPPER, not the button.
                        The button carries `transition-[opacity,transform]`
                        for its hover/press affordance, and GSAP animates
                        exactly those two properties on entrance — pointing
                        both at the same element means every GSAP frame gets
                        re-eased by the CSS transition, which smears the
                        motion. One owner per property per element.
                      */}
                      <div className="service-cta mt-auto w-full sm:w-auto sm:self-start">
                        <button
                          onClick={handleInquire}
                          type="button"
                          className="w-full py-3.5 px-6 rounded-xl bg-app-accent text-white font-semibold text-xs sm:text-sm tracking-wide uppercase font-sans inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] duration-200 shadow-lg"
                        >
                          <span>Inquire About This</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>

                {/*
                  Runway: the scroll distance between two card arrivals, and
                  the trigger element for the preceding card's cover recede.

                  One after EVERY card, including the last. That trailing
                  runway is not filler — a sticky element can only stick
                  while its containing block still has room below it, so with
                  the stack ending flush at the final card's bottom edge that
                  card had a sticky range of exactly zero and never held
                  position at all (measured: the whole deck was shoved off
                  the top before the last service could be read). The
                  trailing runway gives it a window of its own.
                */}
                <div className="service-runway" aria-hidden="true" />

              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Services;
