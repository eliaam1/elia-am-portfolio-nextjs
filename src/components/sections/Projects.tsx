'use client';

import React, { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import Badge from '../ui/Badge';
import ProjectPlaceholder from '../ui/ProjectPlaceholder';
import {
  MQ,
  TIER,
  addMotionTiers,
  GSAP_EASE,
  DUR,
  PROJECT_GALLERY_CONFIG as G,
  PROJECT_DETAIL_CONFIG as R,
  galleryStride,
  galleryUnits,
} from '../../config/motion';
import type { Project, ProjectEnvironment } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

interface ProjectsProps {
  projects: Project[];
  loading: boolean;
}

/** Which environment custom property each project tone drives. */
const ENV_VAR: Record<ProjectEnvironment, string> = {
  commerce: '--env-warm',
  clinical: '--env-cool',
  technical: '--env-dark',
};

const ENV_VARS = ['--env-warm', '--env-cool', '--env-dark'] as const;

export const Projects: React.FC<ProjectsProps> = ({ projects, loading }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const ordered = [...projects].sort((a, b) => a.sort_order - b.sort_order);

  /* ------------------------------------------------------------------ *
   * The exhibition: a camera travelling through depth.
   *
   * One ScrollTrigger for the whole stage, driving an explicit per-frame
   * apply rather than a timeline of per-layer tweens. That is deliberate:
   * the curves are piecewise — a surface approaches over 1.35 units but
   * departs over 1.15, and its opacity, yaw, slide and drift each have their
   * own window — and expressing that as ~30 overlapping tweens at computed
   * timeline positions is far harder to reason about, and to verify, than
   * one function of `t`. Same shape as the proven TravellingPortrait.
   *
   * Everything is anchored on t = p - i * stride, where p is gallery
   * progress measured in PROJECTS. Yaw and slide both resolve to exactly 0
   * at t = 0, so a project in focus is guaranteed square and centred; that
   * exactness is structural, not tuned.
   *
   * Positioning is CSS sticky plus CSS grid stacking; GSAP writes only
   * transform, opacity and custom properties. No ScrollTrigger pin anywhere.
   *
   * Visibility: the stage is a PRESENTATION of the list that follows it.
   * Every project's title, description, stack and links exist as ordinary
   * flowed markup in the detail list below, so if this effect never runs —
   * no JS, an error, reduced motion — the section is still complete and
   * readable. Nothing here is the only copy of anything.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const stage = stageRef.current;
      const track = trackRef.current;
      if (!stage || !track) return;

      const q = gsap.utils.selector(stage);
      const count = ordered.length;
      if (count === 0) return;

      const surfaces = q<HTMLElement>('[data-surface]');
      const numerals = q<HTMLElement>('[data-numeral]');
      const secondaries = q<HTMLElement>('[data-secondary]');
      const metas = q<HTMLElement>('[data-meta]');
      const dots = Array.from(
        indicatorRef.current?.querySelectorAll<HTMLElement>('[data-dot]') ?? []
      );

      const stride = galleryStride();
      const units = galleryUnits(count);
      const env = envRef.current;
      const counter = counterRef.current;

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        const zFar = G.zFar[tier];
        const zExit = G.zExit[tier];

        // Depth context lives on the stage. Set directly rather than via
        // gsap.set so it is unambiguously the CSS `perspective` property and
        // not a transform function.
        stage.style.perspective = `${G.perspective[tier]}px`;

        let lastActive = -1;

        const applyGallery = (progress: number) => {
          const p = G.pStart + progress * units;

          // Environment weights. Accumulated across projects and normalised,
          // so the field is one continuous blend rather than three layers
          // crossfading — a project only ever contributes tone in proportion
          // to how near the camera is to it.
          const weights: Record<string, number> = {
            '--env-warm': 0,
            '--env-cool': 0,
            '--env-dark': 0,
          };
          let weightTotal = 0;

          ordered.forEach((project, i) => {
            const t = p - i * stride;
            const approaching = t <= 0;
            // Clamp t into each phase's own domain so a layer parked well
            // outside its window holds the end value instead of
            // extrapolating off into space.
            const tIn = Math.max(t, -G.approach);
            const tOut = Math.min(t, G.exit);

            const z = approaching
              ? gsap.utils.mapRange(-G.approach, 0, zFar, 0, tIn)
              : gsap.utils.mapRange(0, G.exit, 0, zExit, tOut);

            const yaw = approaching
              ? gsap.utils.mapRange(-G.approach, 0, G.yawFar, 0, tIn)
              : gsap.utils.mapRange(0, G.exit, 0, G.yawPast, tOut);

            const slide = approaching
              ? gsap.utils.mapRange(-G.approach, 0, G.slideFar, 0, tIn)
              : gsap.utils.mapRange(0, G.exit, 0, G.slidePast, tOut);

            const drift = approaching
              ? gsap.utils.mapRange(-G.approach, 0, G.driftFar, 0, tIn)
              : 0;

            const fadeIn = gsap.utils.clamp(0, 1, (t + G.approach) / G.fadeInSpan);
            const fadeOut =
              1 - gsap.utils.clamp(0, 1, (t - G.fadeOutAt) / G.fadeOutSpan);
            const alpha = Math.min(fadeIn, fadeOut);

            const surface = surfaces[i];
            if (surface) {
              gsap.set(surface, {
                z,
                rotationY: yaw * T.amp,
                xPercent: slide * T.amp,
                y: drift * T.amp,
                opacity: alpha,
                // Only a surface actually in focus should be clickable —
                // otherwise a distant, near-invisible one can still swallow
                // clicks meant for the project in front of it.
                pointerEvents: Math.abs(t) < G.interactiveWindow ? 'auto' : 'none',
              });
            }

            const numeral = numerals[i];
            if (numeral) {
              /*
               * The numeral trails its project in BOTH directions: further
               * back than the surface while approaching, and slower to leave
               * on departure. A single multiplier would push it in front of
               * its own surface as soon as z changed sign, which is what
               * turns environmental typography into a floating label.
               */
              gsap.set(numeral, {
                z: z * (z < 0 ? G.numeralDepth : 0.45),
                xPercent: slide * 0.4 * T.amp,
                opacity: alpha * G.numeralOpacity,
              });
            }

            const secondary = secondaries[i];
            if (secondary) {
              gsap.set(secondary, {
                z: z + G.secondaryZ,
                xPercent: G.secondaryX + slide * 1.3 * T.amp,
                yPercent: G.secondaryY,
                rotationY: yaw * 1.4 * T.amp,
                opacity: alpha,
              });
            }

            const meta = metas[i];
            if (meta) {
              // Metadata lags the visual: it starts only once the surface has
              // materialised, and settles just before focus.
              const metaStart = -G.approach + G.fadeInSpan + G.metaLag;
              const items = meta.querySelectorAll<HTMLElement>('[data-meta-item]');

              /*
               * The panel's own chrome (frosted fill + border) has to enter
               * WITH its first line, not with the project. Driving this from
               * `fadeOut` alone made the card fully opaque from the moment
               * the surface faded in, while every line inside was still at
               * opacity 0 — which rendered as an empty frosted box for the
               * whole approach, and read as broken rather than as pending.
               */
              const metaLead = gsap.utils.clamp(0, 1, (t - metaStart) / G.metaSpan);

              gsap.set(meta, { opacity: Math.min(fadeOut, metaLead) });

              /*
               * Stagger is DERIVED from the band, not read straight from the
               * token, so the last item lands on `metaEnd` for any item count
               * — records carry 6 or 7 lines depending on whether they have a
               * metric, and a fixed stagger tuned for one silently overshoots
               * focus for the other.
               */
              const band = G.metaEnd - metaStart;
              const stagger = Math.min(
                G.metaStagger,
                (band - G.metaSpan) / Math.max(1, items.length - 1)
              );

              items.forEach((item, k) => {
                const mp = gsap.utils.clamp(
                  0,
                  1,
                  (t - (metaStart + k * stagger)) / G.metaSpan
                );
                gsap.set(item, {
                  opacity: mp,
                  y: (1 - mp) * T.item * 1.4,
                });
              });
            }

            // Environment contribution. Triangular falloff over one stride:
            // linear is enough because the sum is normalised, and a gaussian
            // here would only add a constant nobody can see.
            const w = Math.max(0, 1 - Math.abs(t) / stride);
            if (w > 0) {
              weights[ENV_VAR[project.environment]] += w;
              weightTotal += w;
            }
          });

          if (env && weightTotal > 0) {
            ENV_VARS.forEach((name) => {
              env.style.setProperty(name, String(weights[name] / weightTotal));
            });
          }

          const active = gsap.utils.clamp(0, count - 1, Math.round(p / stride));
          if (active !== lastActive) {
            dots.forEach((d, k) => d.classList.toggle('is-active', k === active));
            if (counter) counter.textContent = String(active + 1).padStart(2, '0');
            lastActive = active;
          }
        };

        const st = ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          onUpdate: (self) => applyGallery(self.progress),
          onRefresh: (self) => applyGallery(self.progress),
        });

        // Seed the first frame — onRefresh does not fire on creation.
        applyGallery(st.progress);

        return () => {
          st.kill();
          stage.style.perspective = '';
          gsap.set([...surfaces, ...numerals, ...secondaries, ...metas], {
            clearProps: 'all',
          });
          metas.forEach((meta) =>
            gsap.set(meta.querySelectorAll('[data-meta-item]'), { clearProps: 'all' })
          );
          dots.forEach((d) => d.classList.remove('is-active'));
        };
      });

      /*
       * Pointer parallax. Secondary only, and only on a real pointer: it
       * shifts the environment and the grid, never the project surfaces, so
       * the thing being read never moves under the cursor.
       */
      mm.add(MQ.hover, () => {
        const grid = gridRef.current;
        if (!env || !grid) return;

        const opts = { duration: G.pointerDuration, ease: G.pointerEase };
        const envX = gsap.quickTo(env, 'x', opts);
        const envY = gsap.quickTo(env, 'y', opts);
        const gridX = gsap.quickTo(grid, 'x', opts);
        const gridY = gsap.quickTo(grid, 'y', opts);

        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth - 0.5) * 2;
          const ny = (e.clientY / window.innerHeight - 0.5) * 2;
          envX(nx * G.pointerParallax);
          envY(ny * G.pointerParallax);
          // Opposed and larger on the grid, so the two layers separate
          // rather than sliding together as one plane.
          gridX(nx * -G.pointerParallax * 1.6);
          gridY(ny * -G.pointerParallax * 1.6);
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        return () => {
          window.removeEventListener('pointermove', onMove);
          gsap.set([env, grid], { clearProps: 'x,y' });
        };
      });

      // Reduced motion needs no JS branch: globals.css flattens the stage to
      // a plain vertical list. Registering an empty branch keeps matchMedia's
      // coverage explicit rather than implied by omission.
      mm.add(MQ.reduced, () => {});

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [loading, ordered.length] }
  );

  /* ------------------------------------------------------------------ *
   * The detail list. This is the semantic copy of the section: the real
   * <h3> per project lives here, and the stage is aria-hidden as a
   * duplicate of it.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const list = listRef.current;
      if (!list) return;

      const rows = Array.from(list.querySelectorAll<HTMLElement>('.project-detail'));
      if (rows.length === 0) return;

      const mm = gsap.matchMedia();

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        const splits: SplitText[] = [];

        rows.forEach((row) => {
          const q = gsap.utils.selector(row);
          const index = q('.detail-index')[0];
          const title = q('.detail-title')[0];
          const body = q('.detail-body');

          const tl = gsap.timeline({
            scrollTrigger: { trigger: row, start: R.revealStart, once: true },
          });

          if (index) {
            tl.from(index, { yPercent: 130, duration: 0.45, ease: GSAP_EASE.snap });
          }

          if (title) {
            const split = SplitText.create(title, {
              type: 'lines',
              mask: 'lines',
              linesClass: 'detail-title-line',
              aria: 'auto',
            });
            splits.push(split);
            tl.from(
              split.lines,
              {
                yPercent: 110,
                duration: R.titleRise,
                stagger: R.titleStagger,
                ease: GSAP_EASE.snap,
              },
              '-=0.3'
            );
          }

          if (body.length > 0) {
            tl.from(
              body,
              {
                opacity: 0,
                y: T.item,
                duration: T.dur,
                stagger: R.bodyStagger,
                ease: GSAP_EASE.out,
              },
              '-=0.42'
            );
          }
        });

        return () => splits.forEach((s) => s.revert());
      });

      mm.add(MQ.reduced, () => {
        gsap.fromTo(
          rows,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            stagger: 0.08,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: list, start: 'top 85%', once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [loading, ordered.length] }
  );

  if (loading) {
    return (
      <>
        <div className="mb-16 text-left">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-app-accent mb-3 block font-semibold">
            PORTFOLIO
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-app-text-primary mb-4 tracking-tight font-sans">
            Selected Work
          </h2>
          <div className="h-4 w-5/6 bg-app-surface border border-app-border rounded-lg animate-pulse" />
        </div>
        <div className="rounded-2xl bg-app-surface border border-app-border/80 h-[60vh] animate-pulse" />
      </>
    );
  }

  return (
    <div ref={sectionRef}>
      {/*
        Gallery track. Its length comes from --gallery-units, the same number
        the JS progress mapping uses (galleryUnits()), so the CSS and the
        animation cannot disagree about where the last project focuses.
      */}
      <div
        ref={trackRef}
        className="gallery-track select-none"
        style={
          {
            '--gallery-units': String(galleryUnits(ordered.length)),
          } as React.CSSProperties
        }
      >
        {/*
          The entire stage is presentation. Its copy repeats the detail list
          below verbatim, so exposing both would announce every project twice.
          Nothing inside is focusable, so nothing here is a keyboard trap.
        */}
        <div ref={stageRef} className="gallery-stage" aria-hidden="true">
          <div ref={envRef} className="gallery-env" />
          <div ref={gridRef} className="gallery-grid-lines" />

          {ordered.map((project, idx) => {
            const numberStr = String(idx + 1).padStart(2, '0');

            return (
              <React.Fragment key={project.id}>
                <div
                  data-numeral={idx}
                  className="gallery-layer gallery-numeral font-black text-app-text-primary font-sans"
                >
                  {numberStr}
                </div>

                <div
                  data-surface={idx}
                  className="gallery-layer gallery-surface relative overflow-hidden rounded-2xl border border-app-border/70 bg-app-bg shadow-2xl"
                >
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <ProjectPlaceholder
                        category={project.category}
                        techStack={project.tech_stack}
                      />
                    </div>
                  )}
                  {/* Depth shading — the surface catches less light at its lower edge. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </div>

                {project.secondary_image_url && (
                  <div
                    data-secondary={idx}
                    className="gallery-layer gallery-secondary relative overflow-hidden rounded-xl border border-app-border/70 bg-app-bg shadow-2xl"
                  >
                    <img
                      src={project.secondary_image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}

                <div
                  data-meta={idx}
                  className="gallery-layer w-[86%] max-w-[1040px] self-end justify-self-start pb-[6%] pl-[2%]"
                >
                  <div className="max-w-xl rounded-2xl bg-app-bg/80 backdrop-blur-md border border-app-border/50 p-5 sm:p-7">
                    <p
                      data-meta-item
                      className="text-2xl sm:text-4xl font-black text-app-text-primary tracking-tight leading-[1.05] font-sans"
                    >
                      {project.title}
                    </p>
                    <p
                      data-meta-item
                      className="mt-2 text-sm sm:text-base font-bold text-app-accent font-sans"
                    >
                      {project.discipline}
                    </p>
                    <p
                      data-meta-item
                      className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-secondary"
                    >
                      {project.role}
                    </p>
                    <p
                      data-meta-item
                      className="mt-3 text-sm text-app-text-secondary leading-relaxed font-sans line-clamp-3"
                    >
                      {project.description}
                    </p>
                    {project.metric && (
                      <p
                        data-meta-item
                        className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-app-text-primary"
                      >
                        {project.metric}
                      </p>
                    )}
                    <div data-meta-item className="mt-4 flex flex-wrap gap-1.5">
                      {project.tech_stack.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="primary" className="text-[10px]">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div data-meta-item className="mt-5 flex items-center gap-4 font-sans">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-app-accent">
                        <ExternalLink className="w-4 h-4" />
                        {project.cta_label}
                      </span>
                      {project.status && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-app-text-secondary border border-app-border/70 rounded-full px-2.5 py-1">
                          {project.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Position indicator — keeps the immersion from becoming disorienting. */}
          <div
            ref={indicatorRef}
            className="gallery-layer self-start justify-self-end flex items-center gap-3 pt-[2%] pr-[3%]"
          >
            <span className="font-mono text-[11px] font-bold tracking-widest text-app-text-primary">
              <span ref={counterRef}>01</span>
              <span className="text-app-text-secondary">
                {' '}
                / {String(ordered.length).padStart(2, '0')}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              {ordered.map((project) => (
                <span
                  key={project.id}
                  data-dot=""
                  className="w-1.5 h-1.5 rounded-full bg-app-border transition-colors duration-300 [&.is-active]:bg-app-accent"
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Detail list — the semantic copy of the section */}
      <div ref={listRef} className="mt-14 lg:mt-20 border-t border-app-border/40 select-none">
        {ordered.map((project, idx) => {
          const numberStr = String(idx + 1).padStart(2, '0');
          const href = project.live_url ?? project.github_url;

          return (
            <article
              key={project.id}
              className="project-detail grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 py-10 lg:py-14 border-b border-app-border/40"
            >
              <div className="lg:col-span-5 flex items-start gap-4">
                <span className="reveal-mask-inline">
                  <span className="detail-index block font-mono text-xs font-bold text-app-accent pt-2">
                    {numberStr}
                  </span>
                </span>
                <div>
                  <h3 className="detail-title text-xl sm:text-2xl lg:text-3xl font-black text-app-text-primary tracking-tight font-sans leading-tight">
                    {project.title}
                  </h3>
                  <p className="detail-body mt-1.5 text-sm font-bold text-app-accent font-sans">
                    {project.discipline}
                  </p>
                  <p className="detail-body mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-secondary">
                    {project.role}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col">
                <p className="detail-body text-sm sm:text-base text-app-text-secondary leading-relaxed font-sans">
                  {project.description}
                </p>

                {project.metric && (
                  <p className="detail-body mt-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-app-text-primary">
                    {project.metric}
                  </p>
                )}

                <div className="detail-body flex flex-wrap gap-1.5 mt-4">
                  {project.tech_stack.map((tech) => (
                    <Badge key={tech} variant="primary" className="text-[10px]">
                      {tech}
                    </Badge>
                  ))}
                </div>

                <div className="detail-body flex flex-wrap items-center gap-5 mt-6">
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-bold text-app-accent hover:text-app-text-primary transition-colors duration-200 gap-1.5 font-sans"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {project.cta_label}
                      <span className="sr-only"> — {project.title}</span>
                    </a>
                  )}
                  {project.status && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-app-text-secondary border border-app-border/70 rounded-full px-2.5 py-1">
                      {project.status}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
