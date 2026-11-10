/**
 * Shared by the scene (loaded on demand) and the hook (in the main bundle),
 * so it must not import three.js.
 */

/**
 * Scroll beats, in units. One unit = SCREENS_PER_UNIT screens of scroll.
 * `last` is the share of the final project's segment that is scrolled: once its
 * info has faded, the finale plays by itself (in seconds, not scroll), and
 * `hold` keeps the portal pinned long enough to read and tap.
 */
export const DIM_TIMING = { open: 1.2, seg: 1.3, last: 0.78, hold: 0.5 } as const;
/** The whole journey takes about three and a half screens of scroll. */
export const SCREENS_PER_UNIT = 0.66;
/** Scrolling back up rewinds the finale this much faster than it played. */
export const FINALE_REVERSE_SPEED = 1.6;
export const PROJECT_GAP = 60;
/** Where each composition stands along the corridor. */
export const projectZ = (i: number): number => -60 - i * PROJECT_GAP;
/** Camera z where the opening hands over to the first project. */
export const OPENING_EXIT_Z = projectZ(0) + 58;
/** The collapse point sits this far beyond the last composition. */
export const COLLAPSE_DEPTH = 48;
/** Camera distance from the portal at the end. */
export const PORTAL_DISTANCE = 26;
