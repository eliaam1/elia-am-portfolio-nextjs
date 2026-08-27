'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TIER, addMotionTiers, PORTRAIT_TRAVEL_CONFIG } from '../../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/* ------------------------------------------------------------------ *
 * Slot contract
 *
 * Two sections publish a measuring box:
 *   [data-portrait-slot="hero"]   in HeroLenisExperience / Hero
 *   [data-portrait-slot="about"]  in About
 *
 * Each slot contains exactly one `.portrait-visual` child holding the real
 * framed portrait. The slot itself carries the layout box and NOTHING else:
 * the 3D tilt, the entrance tween and the rounded frame all live on
 * `.portrait-visual`, so a slot rect is always the true resting geometry.
 * ------------------------------------------------------------------ */

const HERO_SLOT = '[data-portrait-slot="hero"]';
const ABOUT_SLOT = '[data-portrait-slot="about"]';

/** Matches `rounded-2xl` (--radius-2xl) on both slot visuals. */
const FRAME_RADIUS_PX = 28;

/** Phase of the handoff. Exactly one of the three portraits is ever shown. */
const PHASE_HERO = 0;
const PHASE_TRAVEL = 1;
const PHASE_ABOUT = 2;

/**
 * Travelling Portrait — a shared-element scroll transition.
 *
 * The Hero portrait detaches, tumbles down the page and lands exactly in the
 * About portrait's frame, crossfading to the About image on the way.
 *
 * WHY THIS IS NOT THE OLD PinnedProfileCard
 * -----------------------------------------
 * The previous attempt at a cross-section portrait effect failed repeatedly
 * because it switched an element between `position: fixed` and
 * `position: relative` and then handed it to ScrollTrigger's `pin`, which
 * ALSO rewrites position. Two owners of one property, fighting every frame.
 *
 * This layer:
 *   - is permanently `position: fixed`. Nothing ever changes that.
 *   - is never pinned. `pin` does not appear anywhere in this file.
 *   - owns only `transform` and its own border radius. No other code
 *     writes either one.
 *   - reads both slots with getBoundingClientRect() on the frames it is
 *     actually flying, so it holds no cached geometry: resize, late font
 *     swaps and image decodes need no invalidation bookkeeping, and the
 *     layer automatically follows the Hero portrait's CSS entrance.
 *
 * VISIBILITY INVARIANT
 * --------------------
 * Both slots render their portrait normally with no JS. This layer starts
 * `visibility: hidden` and only hides a slot's visual once it is provably
 * covering it. Mobile, reduced motion, a missing slot or a thrown error all
 * leave both real portraits on screen. There is no state in which the
 * viewer sees an empty frame.
 */
export const TravellingPortrait: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const heroLayerRef = useRef<HTMLDivElement>(null);
  const aboutLayerRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const aboutImgRef = useRef<HTMLImageElement>(null);
  const heroLabelRef = useRef<HTMLSpanElement>(null);
  const aboutLabelRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    const frameEl = frameRef.current;
    const heroLayer = heroLayerRef.current;
    const aboutLayer = aboutLayerRef.current;
    if (!root || !frameEl || !heroLayer || !aboutLayer) return;

    const mm = gsap.matchMedia();

    // Every width, motion allowed. Reduced motion gets no branch at all,
    // which leaves both real portraits visible and this layer hidden.
    //
    // Untested caveat, stated rather than hidden: iOS Safari does not
    // repaint position:fixed elements during rubber-band momentum, so the
    // flight may judder there. That cannot be verified without a device.
    addMotionTiers(mm, (tier) => {
      const heroSlot = document.querySelector<HTMLElement>(HERO_SLOT);
      const aboutSlot = document.querySelector<HTMLElement>(ABOUT_SLOT);
      // Derived from the slot rather than looked up by id. A hardcoded
      // getElementById('about') silently returned null once the section
      // merge renamed that section to id="profile", which disabled this
      // whole effect with no visible error. The slot is the thing this
      // layer actually flies to, so the section containing it is the only
      // correct progress anchor -- and it cannot go stale on a rename.
      const aboutSection = aboutSlot?.closest('section') ?? null;
      const heroVisual = heroSlot?.querySelector<HTMLElement>('.portrait-visual') ?? null;
      const aboutVisual = aboutSlot?.querySelector<HTMLElement>('.portrait-visual') ?? null;

      // Any missing piece means we do not activate. Both real portraits keep
      // rendering; the page loses an effect, never its content.
      if (!heroSlot || !aboutSlot || !aboutSection || !heroVisual || !aboutVisual) return;

      // Mirror the real portraits rather than duplicating their URLs and
      // labels here. Sourcing from the DOM means this layer cannot drift out
      // of sync with the sections it is impersonating.
      const heroSource = heroVisual.querySelector<HTMLImageElement>('img');
      const aboutSource = aboutVisual.querySelector<HTMLImageElement>('img');
      if (!heroSource || !aboutSource) return;

      if (heroImgRef.current) heroImgRef.current.src = heroSource.currentSrc || heroSource.src;
      if (aboutImgRef.current) aboutImgRef.current.src = aboutSource.currentSrc || aboutSource.src;

      const heroLabelText = heroVisual.querySelector('[data-portrait-label]')?.textContent;
      const aboutLabelText = aboutVisual.querySelector('[data-portrait-label]')?.textContent;
      if (heroLabelRef.current && heroLabelText) heroLabelRef.current.textContent = heroLabelText;
      if (aboutLabelRef.current && aboutLabelText) aboutLabelRef.current.textContent = aboutLabelText;

      /* ----------------------------------------------------------- *
       * Progress source.
       *
       * Anchored on the About section, not the Hero: the flight should end
       * when the About portrait reaches its reading position, and that is
       * the thing whose position we can name. No pin, no scrub tween —
       * just a progress value this file samples.
       * ----------------------------------------------------------- */
      let progress = 0;
      const readProgress = (self: ScrollTrigger) => {
        progress = self.progress;
      };

      const trigger = ScrollTrigger.create({
        trigger: aboutSection,
        start: PORTRAIT_TRAVEL_CONFIG.start,
        end: PORTRAIT_TRAVEL_CONFIG.end,
        invalidateOnRefresh: true,
        onUpdate: readProgress,
        onRefresh: readProgress,
      });

      /* ----------------------------------------------------------- *
       * Handoff.
       *
       * At p === 0 the layer sits exactly on the Hero slot and at p === 1
       * exactly on the About slot, so swapping which of the three is
       * visible at those boundaries is pixel-identical — there is nothing
       * to crossfade. `visibility` is used rather than `opacity` because
       * the About visual's entrance tween owns its opacity, and two owners
       * of one property is the bug this whole file exists to avoid.
       * ----------------------------------------------------------- */
      let phase = -1;

      const applyPhase = (next: number) => {
        phase = next;
        root.style.visibility = next === PHASE_TRAVEL ? 'visible' : 'hidden';
        heroVisual.style.visibility = next === PHASE_HERO ? '' : 'hidden';
        aboutVisual.style.visibility = next === PHASE_ABOUT ? '' : 'hidden';
      };

      // Base size is the Hero box; everything else is a transform on top of
      // it. Re-read only when it actually changes (resize, font swap), so
      // the flight itself never writes a layout property.
      let baseW = 0;
      let baseH = 0;

      const { crossfadeStart, crossfadeEnd } = PORTRAIT_TRAVEL_CONFIG;
      const crossfadeSpan = crossfadeEnd - crossfadeStart;

      // Tumble and depth scale with the tier. Nine degrees of tilt on a
      // phone, where the frame is most of the screen width, reads as a far
      // bigger gesture than the same nine degrees in a desktop column.
      const amp = TIER[tier].amp;
      const peakRotation = PORTRAIT_TRAVEL_CONFIG.peakRotation * amp;
      const depthDip = PORTRAIT_TRAVEL_CONFIG.depthDip * amp;

      // True while the previous frame did a full pass, so leaving the band
      // still gets one final exact write before the loop goes quiet.
      let didFullPass = false;

      const frame = () => {
        const p = progress;
        const inBand = p > 0 && p < 1;

        // Outside the flight — which is almost the whole page — this costs
        // one comparison and reads no geometry at all.
        if (!inBand && !didFullPass) {
          const want = p <= 0 ? PHASE_HERO : PHASE_ABOUT;
          if (phase !== want) applyPhase(want);
          return;
        }
        didFullPass = inBand;

        const heroRect = heroSlot.getBoundingClientRect();
        const aboutRect = aboutSlot.getBoundingClientRect();
        // A collapsed slot means a layout we cannot land on. Bail rather
        // than divide by zero and fling the layer off screen.
        if (heroRect.width < 1 || heroRect.height < 1 || aboutRect.width < 1) return;

        if (Math.abs(heroRect.width - baseW) > 0.5 || Math.abs(heroRect.height - baseH) > 0.5) {
          baseW = heroRect.width;
          baseH = heroRect.height;
          root.style.width = `${baseW}px`;
          root.style.height = `${baseH}px`;
        }

        // Scale each axis independently so the landing is exact even if the
        // two frames' aspect ratios ever drift apart. Safe alongside
        // rotation because rotation is exactly 0 at both ends (see below),
        // so no shear is ever visible at rest.
        const scaleX = 1 + (aboutRect.width / baseW - 1) * p;
        const scaleY = 1 + (aboutRect.height / baseH - 1) * p;

        // One sine arc drives both the tumble and the depth recede. Both
        // vanish at p=0 and p=1 by construction, which is what guarantees
        // the layer can never land tilted or mis-scaled.
        const arc = Math.sin(p * Math.PI);
        const dip = 1 - depthDip * arc;

        const heroCx = heroRect.left + heroRect.width / 2;
        const heroCy = heroRect.top + heroRect.height / 2;
        const aboutCx = aboutRect.left + aboutRect.width / 2;
        const aboutCy = aboutRect.top + aboutRect.height / 2;

        const finalScaleX = scaleX * dip;

        gsap.set(root, {
          x: heroCx + (aboutCx - heroCx) * p - baseW / 2,
          y: heroCy + (aboutCy - heroCy) * p - baseH / 2,
          scaleX: finalScaleX,
          scaleY: scaleY * dip,
          rotation: peakRotation * arc,
        });

        // Counter-scale the radius, or the corners land visibly rounder
        // than the About frame they are replacing.
        frameEl.style.borderRadius = `${FRAME_RADIUS_PX / Math.max(finalScaleX, 0.01)}px`;

        const raw = gsap.utils.clamp(0, 1, (p - crossfadeStart) / crossfadeSpan);
        const blend = raw * raw * (3 - 2 * raw); // smoothstep
        heroLayer.style.opacity = `${1 - blend}`;
        aboutLayer.style.opacity = `${blend}`;

        const want = p <= 0 ? PHASE_HERO : p >= 1 ? PHASE_ABOUT : PHASE_TRAVEL;
        if (phase !== want) applyPhase(want);
      };

      gsap.ticker.add(frame);

      return () => {
        gsap.ticker.remove(frame);
        trigger.kill();
        // Hand both real portraits back unconditionally.
        root.style.visibility = 'hidden';
        heroVisual.style.visibility = '';
        aboutVisual.style.visibility = '';
      };
    });

    return () => mm.revert();
  }, {});

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      // Authored hidden, and left/top 0 because the transform supplies all
      // positioning. z-60 clears section content and stays under the
      // navbar (z-999).
      style={{ visibility: 'hidden', transformOrigin: 'center center' }}
      className="pointer-events-none fixed left-0 top-0 z-[60] will-change-transform"
    >
      <div
        ref={frameRef}
        className="relative h-full w-full overflow-hidden border border-app-border/80 bg-app-surface shadow-2xl"
        style={{ borderRadius: `${FRAME_RADIUS_PX}px` }}
      >
        <div ref={heroLayerRef} className="absolute inset-0">
          {/* src is assigned from the Hero slot at runtime, so this layer
              cannot drift from the section it impersonates. */}
          <img
            ref={heroImgRef}
            alt=""
            className="h-full w-full object-cover grayscale contrast-[1.08]"
          />
          <span className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span
              ref={heroLabelRef}
              className="font-mono text-[10px] font-bold uppercase tracking-wider text-app-text-primary"
            />
          </span>
        </div>

        <div ref={aboutLayerRef} className="absolute inset-0" style={{ opacity: 0 }}>
          <img
            ref={aboutImgRef}
            alt=""
            className="h-full w-full object-cover grayscale contrast-[1.08]"
          />
          <span className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span
              ref={aboutLabelRef}
              className="font-mono text-[10px] font-bold uppercase tracking-wider text-app-text-primary"
            />
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-app-bg/90 via-app-bg/30 to-transparent" />
      </div>
    </div>
  );
};

export default TravellingPortrait;
