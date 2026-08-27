/**
 * Four chapters plus Home.
 *
 * These ids are BOTH the useScrollSpy anchors and the <section id> values in
 * page.tsx. They have to match exactly, or the active-link indicator simply
 * never activates and nothing visibly errors.
 *
 * This was eight links across nine sections — about, skills, services,
 * projects, experience and testimonials each carried their own chapter
 * header. Nine chapter headers meant none of them read as a chapter, so
 * related blocks were merged: Skills folded into Profile, Philosophy and
 * Selected Work into Work, Endorsements into Journey. The demoted blocks keep
 * real sub-headings (SectionHeading variant="sub"), so nothing became
 * unreachable — only the top-level count changed.
 */
export const NAV_LINKS = [
  { id: 'hero', label: 'Home' },
  { id: 'profile', label: 'Profile' },
  { id: 'work', label: 'Work' },
  { id: 'journey', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
] as const;

export const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'manage-x7k9';

// Centralized feature toggle: Set true to render experimental HeroLenisExperience
export const USE_EXPERIMENTAL_HERO = true;

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

export const DEFAULT_SETTINGS = {
  hero_title: "Elia Abdel Massih",
  hero_subtitle: "Full Stack Developer & UI/UX Designer",
  hero_tagline: "Crafting professional, luxurious, and high-performance digital experiences.",
  about_text: "I am a passionate Full-Stack Developer and UI/UX Designer specialized in building beautiful, highly interactive web applications. With expertise in React, TypeScript, Tailwind CSS, and various backend environments, I bridge the gap between design and clean code to deliver premium products.",
  about_image_url: "",
  resume_url: "",
  social_facebook: "https://facebook.com",
  social_instagram: "https://instagram.com",
  social_github: "https://github.com",
  social_whatsapp: "https://wa.me/96170000000",
  calendly_url: "https://calendly.com",
  contact_email: "elia@example.com",
};

/* ------------------------------------------------------------------ *
 * Load orchestration
 * ------------------------------------------------------------------ */

/**
 * sessionStorage key shared by the blocking inline script in layout.tsx
 * (which reads it before first paint to decide whether to show the loader)
 * and WebGLPreloader (which writes it once the first load completes). Using
 * sessionStorage rather than localStorage makes the loader once-per-tab,
 * so a returning visitor sees it again on a fresh tab but not on every
 * client-side navigation.
 */
export const PRELOAD_SESSION_KEY = 'eam:loaded';

/**
 * Hard ceiling on the overlay, enforced by the inline script itself rather
 * than by React. If the bundle fails, hydration never happens, or the
 * loader component throws, the overlay still lifts and the site is usable.
 */
export const PRELOAD_FAILSAFE_MS = 8000;

/**
 * Floor on how long the loader stays up. Without it, a warm cache resolves
 * every progress source almost instantly and the loader reads as a flash of
 * unexplained content rather than an intentional entrance.
 */
export const PRELOAD_MIN_MS = 900;

/**
 * Window event announcing that the loader is gone.
 *
 * Lives here rather than in lib/preload.ts because the blocking inline
 * script in layout.tsx must dispatch it as well. If only the loader
 * component dispatched it, a failsafe release (bundle never arrives,
 * hydration never happens) would flip the attribute without ever telling
 * the hero to play, leaving the hero entrance parked at its first frame.
 * That is the invisible-hero failure mode this project keeps hitting, so
 * both release paths emit the same event.
 */
export const PRELOAD_COMPLETE_EVENT = 'eam:preload-complete';
