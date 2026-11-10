import { NAV_LINKS } from '../../../config/constants';

/** "00", "01", … — each chapter's number, in NAV_LINKS order. */
export const CHAPTER_NUMBERS: readonly string[] = NAV_LINKS.map((_, i) => String(i).padStart(2, '0'));

/** Below this width the island is always compact and docks at the bottom (the thumb zone). Keep in sync with nav.css. */
export const DOCK_QUERY = '(max-width: 900px)';

/** Radius of the progress ring, in its 24-unit viewBox. */
export const RING_R = 9;
/** Its circumference: the dash length the ring fills over a chapter. */
export const RING_LENGTH = 2 * Math.PI * RING_R;
