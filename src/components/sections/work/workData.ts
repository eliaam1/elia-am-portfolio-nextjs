/**
 * Selected Work: the projects shown in the Digital Dimension.
 *
 * Copy is client-facing and factual (from the live sites and data/projects.ts).
 * `services` use the exact names from Profile's "What I do" list, which is
 * how the old Services section was folded into this one.
 */

const SHOTS = '/assets/images/projects/';
const FRAGMENTS = '/assets/images/projects/dimension/';

export interface WorkProject {
  id: 'sportzone' | 'physio' | 'agriside';
  name: string;
  /** Name split into display lines for the 3D title (each line enters from its own side). */
  nameLines: readonly string[];
  kind: string;
  year: string;
  url: string;
  line: string;
  services: readonly string[];
  desktop: string;
  mobile: string;
}

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    id: 'sportzone',
    name: 'Sport Zone',
    nameLines: ['Sport Zone'],
    kind: 'Online store',
    year: '2025',
    url: 'https://sportzonelb.com',
    line: 'A multi-brand sports store on Shopify, connected to the shop’s own stock and point-of-sale system.',
    services: ['E-commerce stores', 'Backend, APIs & automations'],
    desktop: `${SHOTS}sportzone-desktop.webp`,
    mobile: `${SHOTS}sportzone-mobile.webp`,
  },
  {
    id: 'physio',
    name: 'The Physio Clinic',
    nameLines: ['The Physio', 'Clinic'],
    kind: 'Website',
    year: '2025',
    url: 'https://thephysiocliniclb.com',
    line: 'A clinic website with interactive 3D, built to load fast and to be found on search.',
    services: ['Web design', 'Websites', 'Animation & 3D', 'SEO'],
    desktop: `${SHOTS}physioclinic-desktop.webp`,
    mobile: `${SHOTS}physioclinic-mobile.webp`,
  },
  {
    id: 'agriside',
    name: 'AgriSide',
    nameLines: ['AgriSide'],
    kind: 'Website',
    year: '2026',
    // Staging address until the client's domain is live.
    url: 'https://agriside.elie-am2000.workers.dev/en',
    line: 'An animal health supplier’s website: five product lines, delivered across Lebanon, ordered in one phone call.',
    services: ['Web design', 'Websites', 'Animation & 3D'],
    desktop: `${SHOTS}agriside-desktop.webp`,
    mobile: `${SHOTS}agriside-mobile.webp`,
  },
];

/** Extra visuals for each project's 3D composition, cropped from the live sites. */
export const FRAGMENT_KEYS = [
  'sz-cats', 'sz-collections', 'sz-basketball', 'sz-prod-1', 'sz-prod-2', 'sz-prod-3', 'sz-prod-4', 'sz-shoe',
  'ph-intro', 'ph-doctor', 'ph-space', 'ph-visit',
  'ag-animals', 'ag-lines', 'ag-tub', 'ag-spray', 'ag-reach', 'ag-order', 'ag-arabic',
] as const;
export type FragmentKey = (typeof FRAGMENT_KEYS)[number];
export const fragmentUrl = (key: FragmentKey): string => `${FRAGMENTS}${key}.webp`;
