// Type-only: erased at build time, so this stays a data module with no
// runtime dependency on GSAP.
import type gsap from 'gsap';

/**
 * Shared motion vocabulary for the scroll animation system.
 *
 * Single source of truth for breakpoints, easing, and durations. Before this
 * file existed the cubic-bezier [0.16, 1, 0.3, 1] was hand-typed 17 times
 * across 8 components and GSAP eases were picked ad hoc per call site.
 *
 * The CSS-side equivalents live in globals.css (--ease-out, --duration-*).
 * Keep the two in sync — these are the JS mirrors, not a parallel system.
 */

/* ------------------------------------------------------------------ *
 * Breakpoint — the single desktop/mobile animation boundary.
 * 1024px matches BREAKPOINTS.tablet in config/constants.ts and the `lg:`
 * Tailwind prefix every section already uses for its layout switch, so
 * animation branching lands on the same line as layout branching.
 * ------------------------------------------------------------------ */

/**
 * Width at which continuous WebGL is allowed.
 *
 * Deliberately NOT tied to the motion tiers below. Scroll choreography is
 * cheap and now runs at every width; an ambient Three.js field that renders
 * every frame while on screen is not, and a phone pays for it in battery
 * and thermals for what amounts to background texture. One-shot WebGL
 * (the loader: build, play once, dispose) has no such gate.
 *
 * Replaces the old MOTION_BREAKPOINT (1024), which conflated "can this
 * device handle scroll animation" with "should this device run a permanent
 * render loop". Those are different questions with different answers.
 */
export const WEBGL_AMBIENT_BREAKPOINT = 768;

/* ------------------------------------------------------------------ *
 * gsap.matchMedia() query strings.
 *
 * THREE width tiers, not two. Exactly one of desktop/tablet/phone matches
 * any viewport, so a branch can never be missed and a tier can never be
 * double-created. Rotating a device or dragging a window across 768px or
 * 1024px makes GSAP revert the old tier and build the new one, which is
 * why tier-scaled amounts have to live in width-keyed branches rather
 * than being read once from a width-agnostic one.
 *
 * What changed: `mobile` used to be `max-width: 1023px` and carried a
 * stripped-down "simple fade" version of every section. That swallowed
 * tablets -- a 900px iPad got phone treatment despite being wide and fast
 * enough for everything -- and it meant the advanced work only ever ran
 * on the widest third of real traffic. Now every tier runs the SAME
 * choreography; only the amounts differ.
 * ------------------------------------------------------------------ */

export const MQ = {
  /**
   * >= 1024px. Reserved for techniques that genuinely cannot work
   * narrower: ScrollTrigger `pin` (mobile address bars collapse mid-scroll
   * and resize the viewport, which makes a pin recalculate and jump) and
   * horizontal scroll (fights the native back-swipe gesture).
   */
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  /** 768px - 1023px. Gets everything except pinning and hover. */
  tablet: '(min-width: 768px) and (max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  /** <= 767px. Same techniques as desktop, smaller amounts. */
  phone: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
  /*
   * `belowDesktop` (max-width: 1023px) used to live here as the OLD two-tier
   * boundary, kept only for Statement and Projects while their markup was
   * awaiting a rebuild. Both were rebuilt in Wave C and moved onto
   * addMotionTiers, so the last caller is gone and the query is deleted
   * rather than left as a tempting shortcut back to two tiers.
   */
  /** Opacity only. Never a resting state below opacity 1. */
  reduced: '(prefers-reduced-motion: reduce)',
  /** Gate for anything driven by a real pointer (hover previews, tilt). */
  hover: '(hover: hover) and (pointer: fine)',
} as const;

export type MotionTier = 'desktop' | 'tablet' | 'phone';

/* ------------------------------------------------------------------ *
 * Per-tier amounts.
 *
 * The technique is identical across tiers; only the magnitude changes,
 * and it changes because magnitude is relative to viewport. 48px of
 * travel reads as a confident move on a 1440px screen and as a lurch on
 * a 375px one. Parallax past roughly half amplitude on a phone makes
 * layers visibly detach from the layout.
 *
 * `scrub` climbs on narrower tiers on purpose: touch scrolling delivers
 * coarser, burstier scroll events than a wheel, especially during iOS
 * momentum, so a scrubbed timeline needs more smoothing to read evenly.
 * ------------------------------------------------------------------ */

export const TIER = {
  desktop: { travel: 48, item: 20, card: 30, word: 12, dur: 0.5, stagger: 0.08, amp: 1, scrub: 0.5 },
  tablet: { travel: 38, item: 18, card: 26, word: 10, dur: 0.46, stagger: 0.07, amp: 0.7, scrub: 0.65 },
  phone: { travel: 26, item: 14, card: 20, word: 8, dur: 0.42, stagger: 0.06, amp: 0.45, scrub: 0.8 },
} as const;

/* ------------------------------------------------------------------ *
 * Easing
 * ------------------------------------------------------------------ */

/**
 * Framer Motion / CSS cubic-bezier tuple. Strong ease-out for entrances.
 * Matches --ease-out in globals.css:39.
 */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** GSAP named eases. `scrub` is 'none' — scrubbed motion must not double-ease. */
export const GSAP_EASE = {
  /** General entrances and exits. */
  out: 'power3.out',
  /**
   * Display typography and hero-scale entrances. Sharper than power3: it
   * front-loads nearly all the travel and settles hard, which is the
   * difference between confident and floaty. Mirrors --ease-snap in
   * globals.css.
   */
  snap: 'expo.out',
  /** Exits. Mirror of snap, reversed. */
  exit: 'expo.in',
  /** On-screen movement / morphing. */
  inOut: 'power2.inOut',
  /** Anything driven by scroll position. Scrub supplies the timing. */
  scrub: 'none',
} as const;

/* ------------------------------------------------------------------ *
 * Duration (seconds — GSAP units)
 *
 * Section reveals are marketing-surface motion, so they sit above the
 * <300ms UI ceiling deliberately. Interactive UI durations stay under it.
 * ------------------------------------------------------------------ */

export const DUR = {
  /** Press feedback, colour changes. */
  fast: 0.16,
  /** Dropdowns, small popovers. */
  normal: 0.2,
  /** Modals, accordions. */
  slow: 0.3,
  /*
   * Section-reveal durations are NOT here: they are per-tier, in TIER.dur.
   * The old reveal / revealMobile pair encoded the two-tier world and would
   * now be a second, silently-wrong source of truth.
   */
  /** Reduced-motion cross-fade. Gentler, not zero. */
  reduced: 0.3,
} as const;

/** Stagger between items in a group entrance. 30-80ms is the legible band. */
export const STAGGER = {
  tight: 0.05,
  normal: 0.07,
  loose: 0.08,
} as const;

/**
 * Registers the same builder against all three width tiers.
 *
 * Use this instead of hand-writing three mm.add calls: it is what makes
 * "every tier gets the same choreography" structural rather than a
 * convention someone has to remember. A builder may return a cleanup
 * function exactly as an mm.add callback would.
 */
export function addMotionTiers(
  mm: ReturnType<typeof gsap.matchMedia>,
  build: (tier: MotionTier) => void | (() => void)
): void {
  mm.add(MQ.desktop, () => build('desktop'));
  mm.add(MQ.tablet, () => build('tablet'));
  mm.add(MQ.phone, () => build('phone'));
}

/**
 * Standard ScrollTrigger start for a once-only entrance reveal.
 * 85% of viewport height: the element has clearly entered before it animates,
 * and anything already above this point when the trigger is created fires
 * immediately rather than staying hidden.
 */
export const REVEAL_START = 'top 85%';

/* ------------------------------------------------------------------ *
 * Hero Lenis Experience Calibration Tokens (Phase F)
 * ------------------------------------------------------------------ */

export const HERO_CHOREOGRAPHY_CONFIG = {
  /** Maximum horizontal outward letter dispersal in pixels (+/-) */
  maxSpreadX: 24,
  /** Maximum vertical subtle arch in pixels */
  maxArchY: 10,
  /** Maximum radial character tilt in degrees (+/-) */
  maxRotation: 2.2,
  /** Center character swell scale factor */
  centerSwell: 0.04,
  /** Background WebGL differential parallax travel in pixels */
  parallaxDots: 65,
  /** Heavy typography container parallax drift in pixels */
  parallaxType: -14,
  /** Foreground media stage parallax forward motion in pixels */
  parallaxMedia: -30,
} as const;

export const HERO_VELOCITY_CONFIG = {
  /** Multiplier for mapping Lenis velocity to skew degrees */
  skewMultiplier: 0.07,
  /** Maximum skew angle in degrees (+/-) */
  maxSkew: 2.2,
  /** Multiplier for mapping velocity to vertical stretch */
  stretchMultiplier: 0.0018,
  /** Maximum vertical scale stretch */
  maxStretch: 0.04,
  /** Multiplier for mapping velocity to vertical shift offset */
  shiftMultiplier: 0.16,
  /** Maximum vertical shift in pixels (+/-) */
  maxShift: 8,
  /** Settling quickTo duration in seconds */
  duration: 0.32,
  /** GSAP easing for settling */
  ease: 'power2.out',
} as const;

export const HERO_CURSOR_CONFIG = {
  /** Effective magnetic radius in pixels around each character */
  radius: 150,
  /** Maximum cursor magnetic translation in pixels (+/-) */
  maxDisplacement: 5.5,
  /** Maximum subtle rotation in degrees (+/-) */
  maxRotation: 1.2,
  /** Settling quickTo duration in seconds */
  duration: 0.38,
  /** GSAP easing for proximity settling */
  ease: 'power3.out',
} as const;

/* ------------------------------------------------------------------ *
 * Hero Lenis Dominant-Name Motion Tokens (Phase F.2 & 3-Line Sequence)
 * ------------------------------------------------------------------ */

export const HERO_NAME_MOTION_CONFIG = {
  /*
   * Entrance DURATION and EASING are deliberately not here.
   *
   * The hero name entrance is a CSS animation (.hero-glyph /
   * .hero-rise in globals.css), so globals.css owns its duration and curve.
   * Duplicating them here as JS numbers that nothing reads is how a token
   * file quietly stops matching what actually renders.
   *
   * The per-character STAGGERS below stay, because glyphDelayMs() in
   * HeroLenisExperience computes each --reveal-delay from them during
   * render. Everything after them belongs to the scroll and pointer
   * layers, which really are GSAP-driven.
   */

  /** Line 1 (ELIA, staggered left to right) per-character offset (s) */
  line1Stagger: 0.035,
  /** Line 2 (ABDEL, staggered right to left) per-character offset (s) */
  line2Stagger: 0.032,
  /** Line 3 (MASSIH, staggered centre outward) per-character offset (s) */
  line3Stagger: 0.03,

  /** Maximum vertical travel during scroll scrub (px) */
  maxVerticalTravel: 110,
  /** Maximum vertical parabolic arch curve (px) */
  maxParabolicArch: 36,
  /** Restrained horizontal character drift (px) */
  maxHorizontalDrift: 48,
  /** Maximum radial character tilt (deg) */
  maxRotation: 4.5,
  /** Center character swell factor on the large name */
  centerSwell: 0.08,

  /** Name velocity skew multiplier */
  velocitySkewMultiplier: 0.06,
  /** Maximum name skew angle in degrees (+/-) */
  maxVelocitySkew: 2.0,
  /** Name velocity scale stretch multiplier */
  velocityStretchMultiplier: 0.0015,
  /** Maximum name vertical scale stretch */
  maxVelocityStretch: 0.035,
  /** Name velocity vertical shift multiplier */
  velocityShiftMultiplier: 0.14,
  /** Maximum name vertical shift in pixels */
  maxVelocityShift: 8,
  /** Settling duration for name velocity recovery (s) */
  dampingDuration: 0.32,
  /** Damping ease for name velocity recovery */
  dampingEase: 'power2.out',

  /** Cursor proximity influence radius for large name (px) */
  cursorRadius: 150,
  /** Maximum cursor magnetic displacement for large name (px) */
  maxCursorDisplacement: 4.5,
  /** Maximum cursor tilt for large name (deg) */
  maxCursorRotation: 1.0,
  /** Cursor settling duration */
  cursorDuration: 0.35,
  /** Cursor settling easing */
  cursorEase: 'power3.out',
} as const;

/* ------------------------------------------------------------------ *
 * About Section Cinematic 3D Motion Tokens
 * ------------------------------------------------------------------ */

export const ABOUT_MOTION_CONFIG = {
  /** Parallax vertical travel for the portrait image (px) */
  imageParallaxTravel: 35,
  /** 3D tilt max pitch in degrees */
  maxTiltPitch: 2.5,
  /** 3D tilt max yaw in degrees */
  maxTiltYaw: 3.5,
  /** 3D tilt settling duration (s) */
  tiltDuration: 0.45,
  /** 3D tilt easing */
  tiltEase: 'power2.out',
  /** Text block scroll drift (px) */
  textDrift: 20,
  /** Particle layer opacity */
  particleOpacity: 0.45,
  /** Particle size */
  particleSize: 6,
} as const;

/* ------------------------------------------------------------------ *
 * Preloader Motion Tokens (Wave A)
 *
 * The loader has a job beyond decoration: it hides the exact window in
 * which fonts swap, the WebGL context warms up, and hero images decode.
 * Every value below is timed against that, not chosen for looks.
 * ------------------------------------------------------------------ */

export const PRELOADER_CONFIG = {
  /** Particle count on a wide viewport. */
  particleCount: 2600,
  /**
   * Particle count below WEBGL_AMBIENT_BREAKPOINT. The loader now runs on
   * phones too -- it is one-shot, so it costs a build and a dispose rather
   * than a permanent render loop -- but the wordmark is physically smaller
   * there, so most of the extra points would land on the same pixels.
   */
  particleCountNarrow: 1200,
  /** Radius of the initial noise sphere the particles scatter from (world units). */
  scatterRadius: 5.2,
  /** How tightly particles converge on their target once progress hits 1. */
  convergence: 0.965,
  /** Base point size in pixels. */
  pointSize: 2.4,
  /** Seconds the cloud takes to settle into the wordmark after progress completes. */
  settleDuration: 0.55,
  /** Seconds for the curtain to clear the viewport on exit. */
  exitDuration: 0.72,
  /** Counter catch-up smoothing. Lower is snappier, higher lags behind real progress. */
  counterLerp: 0.12,
} as const;

/* ------------------------------------------------------------------ *
 * Lenis engine tuning
 *
 * Replaces the previous `duration: 1.2` + exponential easing, which
 * produced a long momentum tail: input stopped but the page kept gliding,
 * which reads as floaty and desynchronises scrubbed timelines from the
 * pointer. `lerp` is a per-frame interpolation factor instead of a fixed
 * settle time, so the page tracks the wheel closely and still smooths.
 * 0.11 is the point where momentum is legible but never trails the input.
 * ------------------------------------------------------------------ */

export const LENIS_CONFIG = {
  lerp: 0.11,
  /** Wheel delta multiplier. Above 1.2 the page starts to feel slippery. */
  wheelMultiplier: 1,
  /** Native momentum is preserved on touch; Lenis does not drive it. */
  touchMultiplier: 1.6,
} as const;

/* ------------------------------------------------------------------ *
 * Shared-element portrait travel (Hero -> About)
 *
 * The flight is anchored on the About SECTION rather than the Hero,
 * because the thing that can be named precisely is where it has to END:
 * the About portrait at its reading position. Starting at "top bottom"
 * means the travel begins the moment About enters the viewport, which on a
 * full-height Hero is the first pixel of scroll.
 * ------------------------------------------------------------------ */

export const PORTRAIT_TRAVEL_CONFIG = {
  /** ScrollTrigger start, measured on the About section. */
  start: 'top bottom',
  /** ScrollTrigger end, measured on the About section. */
  end: 'top 30%',
  /** Peak tumble at the midpoint (deg). Exactly 0 at both ends. */
  peakRotation: -9,
  /** Depth recede at the midpoint, as a fraction of scale. */
  depthDip: 0.09,
  /** Progress at which the Hero image starts becoming the About image. */
  crossfadeStart: 0.3,
  /** Progress at which that crossfade completes. */
  crossfadeEnd: 0.74,
} as const;

/* ------------------------------------------------------------------ *
 * About section reveal vocabulary
 *
 * The section was not unanimated before: it ran FIVE identical
 * opacity 0 -> 1, y 28, 0.75s power3.out arrivals. Uniformity is what read
 * as dead. These tokens exist so each block can have its own verb.
 * ------------------------------------------------------------------ */

export const ABOUT_REVEAL_CONFIG = {
  /** Masked line rise, used by the index tag and the stat numerals (s). */
  maskRise: 0.6,
  /** Per-line stagger on the split heading (s). */
  headingStagger: 0.09,
  /** Heading line travel duration (s). */
  headingDuration: 0.72,
  /** Accent rule vertical draw duration (s). */
  ruleDraw: 0.55,
  /** Callout clip-path wipe duration (s). */
  calloutWipe: 0.8,
  /** Floor opacity for the scrubbed body copy. Never invisible. */
  bodyFloor: 0.16,
  /** Per-word stagger for the scrubbed body copy (s). */
  bodyWordStagger: 0.022,
  /** Stagger between the three stat columns (s). */
  statStagger: 0.08,
} as const;

/* ------------------------------------------------------------------ *
 * Orbiting skills geometry
 *
 * These numbers were the bug, not decoration. The previous rings ended at
 * radius 230 carrying 44px nodes, which puts node edges 252px from the
 * centre inside a 480px box whose half-width is 240px: a guaranteed 12px
 * overflow, clipped by an overflow-hidden wrapper, inside a grid column
 * narrower than the box itself. Deriving the box FROM the geometry means
 * that class of bug cannot return by editing a radius.
 * ------------------------------------------------------------------ */

export const ORBIT_GEOMETRY = {
  /** Ring radii in px, innermost first. */
  rings: [84, 150, 216],
  /** Node diameter in px. */
  nodeSize: 44,
  /** Clearance outside the outermost node edge, in px. */
  padding: 12,
  /** Scroll-coupled ring twist, in radians, across the whole section. */
  scrollTwist: Math.PI * 0.8,
} as const;

/**
 * The intrinsic square the orbit is authored at. Derived, so it is
 * impossible for a ring to be wider than its own container.
 */
export const ORBIT_BOX =
  2 * (ORBIT_GEOMETRY.rings[ORBIT_GEOMETRY.rings.length - 1] +
    ORBIT_GEOMETRY.nodeSize / 2 +
    ORBIT_GEOMETRY.padding);

/* ------------------------------------------------------------------ *
 * Statement — per-word colour scrub.
 *
 * `dimColor` is the state a word rests in BEFORE the scrub reaches it, and
 * it is a contrast decision rather than a look: #8a8e99 measures 3.14:1 on
 * the #fafafa page background, which clears the WCAG 3:1 minimum for large
 * text (this heading is >=24px bold at every breakpoint). An unread word is
 * therefore legible on its own, not a grey placeholder that only becomes
 * text once you scroll. The obvious prettier choice (#b4b7bf) measures
 * 1.92:1 and would have made the whole statement unreadable to anyone who
 * lands mid-section or stops scrolling.
 *
 * The lit colour is READ FROM the CSS custom property at runtime rather
 * than duplicated here, so it cannot drift from the palette in globals.css.
 * ------------------------------------------------------------------ */

export const STATEMENT_SCRUB_CONFIG = {
  /** Unread word colour. 3.14:1 on #fafafa — AA for large text. */
  dimColor: '#8a8e99',
  /** Custom property the lit colour is read from. */
  litVar: '--color-text-primary',
  /** Used only if the custom property is missing (JS-disabled CSS, tests). */
  litFallback: '#1a1a1a',
  /*
   * Measured on the HEADING, not on the section — and that distinction was
   * a real bug, not a preference.
   *
   * The section carries `py-32 md:py-48`, so its top edge sits 169px above
   * the heading's top edge (128px of padding plus the PHILOSOPHY overline).
   * With the trigger anchored on the section at 'top 82%' -> 'top 30%',
   * measured in a 900px viewport: the scrub STARTED with the heading's top
   * at 907px — one pixel below the fold, entirely invisible — and FINISHED
   * with the heading spanning 439-881px, only just fully on screen and
   * still sitting low. The entire 468px window was spent while the heading
   * was climbing in from the bottom, so by the time it reached a readable
   * position every word was already lit.
   *
   * Anchored on the heading, these percentages mean what they look like:
   * the reveal begins once roughly 180px of heading is showing and
   * completes with the heading in the upper-middle of the screen, where it
   * is actually being read. Being viewport-relative it scales across tiers
   * with no per-tier values.
   */
  start: 'top 80%',
  end: 'top 22%',
  /**
   * Stagger LARGE relative to duration, deliberately. The old settings
   * (stagger 0.35 / duration 0.6) overlapped so heavily that ~8 words were
   * mid-transition at once, which reads as a soft wash rather than as words
   * resolving one at a time. At 0.5 / 0.35 each word owns roughly 4% of the
   * scroll window on its own.
   */
  wordStagger: 0.5,
  wordDuration: 0.35,
  /**
   * The accent period lands last. Also heading-anchored, and ending on the
   * same line as the word scrub so the period completes as the final word
   * resolves rather than trailing after it.
   */
  periodStart: 'top 34%',
  periodEnd: 'top 22%',
  /** Overline fade, measured on the overline itself. */
  overlineStart: 'top 95%',
  overlineEnd: 'top 72%',
} as const;

/* ------------------------------------------------------------------ *
 * Services — sticky card stack.
 *
 * Stacking is CSS `position: sticky`, never ScrollTrigger `pin`. That is a
 * deliberate structural choice: `pin` injects a pin-spacer, switches the
 * target to position:fixed and recalculates on every resize — including the
 * mobile address-bar collapse — which is exactly the fixed-vs-relative
 * conflict that made the old PinnedProfileCard unbuildable. Here the
 * browser owns position and GSAP only ever writes paint properties
 * (scale, opacity, clip-path), so the two cannot fight.
 *
 * The px units on the CSS custom properties (globals.css) are not
 * cosmetic: the fit measurement below parses them with parseFloat, and rem
 * values would parse to 6 instead of 96.
 * ------------------------------------------------------------------ */

export const SERVICE_STACK_CONFIG = {
  /** How far a covered card recedes. */
  coveredScale: 0.94,
  /** How far a covered card dims. Never 0 — its peeking top edge stays readable. */
  coveredOpacity: 0.55,
  /**
   * Clearance required below the tallest card before stacking is allowed.
   * A sticky element TALLER than its available viewport height is a genuine
   * trap: it pins at the top and its lower half becomes unreachable,
   * because scrolling no longer moves it. So stacking is measured, not
   * assumed, and the fallback is ordinary document flow.
   */
  fitMargin: 24,
  /** Once-only trigger for a card's internal content sequence. */
  arriveStart: 'top 78%',
  /** Cover-recede scrub window, measured on the runway between two cards. */
  coverStart: 'top 75%',
  coverEnd: 'bottom 45%',
  /* Internal sequence beats (s). */
  indexRise: 0.5,
  titleRise: 0.62,
  titleStagger: 0.08,
  mediaWipe: 0.85,
  featureStagger: 0.07,
} as const;

/* ------------------------------------------------------------------ *
 * Projects — 3D spatial gallery.
 *
 * A virtual camera travels through an exhibition: each project owns a region
 * of depth containing several independently-moving layers (oversized numeral
 * far behind, main website surface, companion surface nearer the camera),
 * separated by ambient breathing space. Pure CSS 3D plus GSAP — no WebGL, so
 * the titles stay real selectable text and the route's bundle does not grow.
 *
 * This deliberately does NOT reuse the sticky-stack vocabulary of the
 * Services section. That one pins and covers; this one travels through depth.
 * The two sections are adjacent, so a shared mechanism would make the
 * portfolio read as one effect applied twice.
 *
 * The unit system is what keeps it readable. Gallery progress `p` is measured
 * in PROJECTS, not pixels: project `i` focuses exactly at
 * `p == i * galleryStride()`, so a project's local time is
 * `t = p - i * stride`. Negative t is approaching, zero is focus, positive is
 * receding. Every curve below is expressed in those units, which means adding
 * a fourth project changes nothing except how long the track is.
 *
 * Both yaw and slide resolve to exactly 0 at t = 0, so a project being read
 * is guaranteed square and centred. That exactness is structural, not tuned.
 *
 * Positioning is CSS grid stacking (`place-items: center` + shared
 * `grid-area`), NOT a centering transform. That is deliberate — GSAP owns
 * `transform` on these cards outright, and modern GSAP also resets the
 * independent `translate`/`rotate`/`scale` properties, so any CSS centering
 * written either way would be wiped on the first tick.
 * ------------------------------------------------------------------ */

export const PROJECT_GALLERY_CONFIG = {
  /** Camera distance per tier (px). Lower = stronger perspective. */
  perspective: { desktop: 1600, tablet: 1250, phone: 1000 },
  /**
   * Z of the main surface at its furthest point (px; negative is away).
   * Deeper than the old deck because a room has to have a back wall — the
   * next project must read as genuinely far off, not merely small.
   */
  zFar: { desktop: -2600, tablet: -2000, phone: -1500 },
  /**
   * Z the main surface recedes to on departure (px; negative is away).
   *
   * Departure moves BACKWARD, not past the camera. A surface that flies over
   * the viewer is the gimmick the brief rules out, and it forces the stage to
   * clip a full-bleed screenshot at exactly the moment it is largest. Pulling
   * back instead reads as the camera withdrawing from a wall, and it leaves
   * the exit lane clear for the next project to come forward into.
   *
   * Shallower than `zFar` on purpose: arrivals come from further away than
   * departures go, so attention is pulled forward through the exhibition.
   */
  zExit: { desktop: -1300, tablet: -1050, phone: -820 },
  /**
   * Ambient units between one project's focus and the next. This is the
   * "breathing space" — the stretch where no surface is dominant and only
   * the environment and the oversized numeral are moving. Below ~0.5 the
   * transition reads as a cut; above ~1.2 the user feels stuck in empty space.
   */
  gap: 0.75,
  /** Units spent approaching, from zFar to focus. */
  approach: 1.35,
  /** Units after focus before a surface is fully gone. */
  exit: 1.15,
  /** Opacity ramp-in span in units, beginning at -approach. */
  fadeInSpan: 0.42,
  /** Units after focus where fade-out begins, and how long it takes. */
  fadeOutAt: 0.3,
  fadeOutSpan: 0.55,
  /**
   * Yaw at zFar and once past the camera (deg). Exactly 0 at focus, so a
   * surface being read is always square to the viewer — that exactness is
   * structural, not tuned. The asymmetry (arrives turned from one side,
   * leaves turned to the other) is what makes the camera read as travelling
   * THROUGH the scene rather than orbiting it.
   */
  yawFar: 13,
  yawPast: -16,
  /** Lateral shift at zFar and past the camera (% of surface width). */
  slideFar: 14,
  slidePast: -26,
  /** Vertical drift at zFar (px). Resolves to 0 at focus. */
  driftFar: 70,
  /**
   * Depth multiplier for the oversized numeral. Greater than 1 so it sits
   * BEHIND its own project and parallaxes slower — that rate difference is
   * the whole reason it reads as environmental rather than as a label.
   */
  numeralDepth: 2.1,
  /** Numeral opacity at focus. Low enough to never compete with the surface. */
  numeralOpacity: 0.07,
  /** Z of the companion surface relative to the main one (px, toward camera). */
  secondaryZ: 190,
  /** Companion surface offset from centre (% of stage width / height). */
  secondaryX: 27,
  secondaryY: 14,
  /**
   * Units AFTER the main surface that metadata begins resolving. The spec is
   * explicit that text enters behind the visual, so this lag is the
   * choreography, not a rounding artefact.
   */
  metaLag: 0.18,
  /** Units a single metadata item takes to resolve. */
  metaSpan: 0.34,
  /**
   * Units before focus at which the LAST metadata item finishes.
   *
   * Negative on purpose. The whole block has to be settled slightly BEFORE
   * the project is square to the camera, because past focus the surface
   * immediately begins fading out — a CTA that peaks after t = 0 spends its
   * only fully-opaque moment on a panel that is already leaving. Measured
   * before this existed: at focus the CTA sat at opacity 0.30.
   */
  metaEnd: -0.06,
  /**
   * Upper bound on the per-item offset (units), in the order
   * brand -> discipline -> role -> description -> metric -> tags -> CTA.
   * This is the animation hierarchy the brief asks for: the CTA settles last
   * because it is what you act on after reading everything above it.
   *
   * A CAP rather than the value itself — the component derives the actual
   * stagger from the band so the last item lands on `metaEnd` whatever the
   * item count, and records with fewer items simply stagger tighter than
   * this instead of finishing early and leaving a gap.
   */
  metaStagger: 0.08,
  /**
   * Gallery progress at scroll-progress 0. Negative so project 0 opens
   * already partway in — distant but present. Starting at exactly -approach
   * would open the section on an empty room.
   */
  pStart: -0.9,
  /**
   * Extra units after the last project's focus, so ATLAS recedes into depth
   * before the section ends rather than being cut off at full size.
   */
  pOutro: 1.25,
  /** Only a surface within this many units of focus accepts clicks. */
  interactiveWindow: 0.45,
  /** Peak pointer parallax on the background and secondary layers (px). */
  pointerParallax: 16,
  /** Pointer settle duration (s) and ease. */
  pointerDuration: 0.6,
  pointerEase: 'power2.out',
} as const;

/**
 * Distance in gallery-units between one project's focus and the next.
 *
 * A project owns one unit of focus plus the ambient gap that follows it, so
 * project `i` focuses at exactly `i * galleryStride()`. Exported so the
 * component never re-derives the stride and drifts from this file.
 */
export function galleryStride(): number {
  return 1 + PROJECT_GALLERY_CONFIG.gap;
}

/**
 * Total gallery length in units, for a given project count.
 *
 * Exported rather than inlined because the CSS track height and the JS
 * progress mapping both need it, and they must not be able to disagree —
 * if they do, the last project either never reaches focus or reaches it
 * before the scroll runs out.
 */
export function galleryUnits(count: number): number {
  const lastFocus = Math.max(0, count - 1) * galleryStride();
  return lastFocus - PROJECT_GALLERY_CONFIG.pStart + PROJECT_GALLERY_CONFIG.pOutro;
}

/* ------------------------------------------------------------------ *
 * Projects — the detail list beneath the deck.
 *
 * This is the accessible, flowed copy of the section: the real <h3> per
 * project, plus its description, stack and links. It is what makes the deck
 * above safe to treat as pure presentation and to mark aria-hidden.
 *
 * Trimmed from the previous PROJECT_CARD_CONFIG when the deck replaced the
 * flat full-bleed cards. The curtain, parallax, mediaOverscan and exit
 * scale/opacity keys belonged to that layout; keeping them would leave a
 * token file describing an animation nothing runs.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Testimonials — editorial quote wall.
 *
 * Replaces a 6-second auto-advancing carousel. With only two records that
 * carousel hid half the content behind a timer and moved without being
 * asked to; a wall shows everything at once, and it scales UP as records are
 * added rather than degrading.
 *
 * `columnDrift` is the one piece of real choreography: adjacent cards drift
 * in OPPOSITE directions as the section passes, so the grid reads as two
 * independent columns rather than one block sliding. Kept small — past
 * roughly 40px the cards visibly detach from their own gutters.
 * ------------------------------------------------------------------ */

export const TESTIMONIAL_CONFIG = {
  /** Once-only entrance trigger per card. */
  revealStart: 'top 85%',
  /** Masked quote line rise (s). */
  lineRise: 0.66,
  /** Per-line stagger within one quote (s). */
  lineStagger: 0.07,
  /** Accent rule draw (s). */
  ruleDraw: 0.5,
  /** Stagger between rating stars (s). */
  starStagger: 0.05,
  /** Opposed vertical drift per column, px before tier amplitude. */
  columnDrift: 34,
} as const;

export const PROJECT_DETAIL_CONFIG = {
  /** Once-only entrance trigger for a detail row. */
  revealStart: 'top 82%',
  /** Masked title line rise (s). */
  titleRise: 0.6,
  /** Per-line stagger on the split title (s). */
  titleStagger: 0.08,
  /** Stagger between description, badges and links (s). */
  bodyStagger: 0.07,
} as const;
