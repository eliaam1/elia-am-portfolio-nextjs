/**
 * Shared by the scene (loaded on demand) and the hook (in the main bundle),
 * so it must not import three.js.
 */

/** Timeline beats, in units. One unit = SCREENS_PER_UNIT screens of scroll. */
export const DIM_TIMING = { open: 1.5, seg: 1.5, end: 1.5 } as const;
/** The whole journey takes about five screens of scroll. */
export const SCREENS_PER_UNIT = 0.66;
export const PROJECT_GAP = 60;
/** Where each composition stands along the corridor. */
export const projectZ = (i: number): number => -60 - i * PROJECT_GAP;
/** Camera z where the opening hands over to the first project. */
export const OPENING_EXIT_Z = projectZ(0) + 58;
/** The collapse point sits this far beyond the last composition. */
export const COLLAPSE_DEPTH = 48;
/** Camera distance from the portal at the end. */
export const PORTAL_DISTANCE = 26;
