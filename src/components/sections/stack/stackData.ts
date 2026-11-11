import type { IconType } from 'react-icons';
import {
  SiAndroid,
  SiAnthropic,
  SiClaude,
  SiDotnet,
  SiElementor,
  SiGooglegemini,
  SiGreensock,
  SiJavascript,
  SiKotlin,
  SiModelcontextprotocol,
  SiNextdotjs,
  SiNodedotjs,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiReact,
  SiShopify,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
  SiWoocommerce,
  SiWordpress,
} from 'react-icons/si';

/**
 * A tool shows its brand mark when Simple Icons has one; otherwise a short
 * text badge (`mono`). C#, Liquid, SQL Server and OpenAI have no mark there.
 */
export type Tool = { name: string } & ({ icon: IconType; mono?: never } | { mono: string; icon?: never });

export interface Need {
  /** What the client needs, in their words. */
  need: string;
  /** Short label for tabs and the progress line. */
  short: string;
  /** The giant outlined word behind the deck. */
  ghost: string;
  tools: readonly Tool[];
}

/**
 * Every need fits the 8-tile board; STACK_SLOTS is derived, never typed.
 * Four needs, not one per discipline: the deck was six cards and ~40% of the
 * page's scroll, which gave tools more room than the work they support.
 * Mobile and back-end software share a card; design/delivery tools (Figma,
 * Git, Docker…) are table stakes and earn no card at all.
 */
export const STACK: readonly Need[] = [
  {
    need: 'A website people remember',
    short: 'Websites & motion',
    ghost: 'Websites',
    tools: [
      { name: 'Next.js', icon: SiNextdotjs },
      { name: 'React', icon: SiReact },
      { name: 'TypeScript', icon: SiTypescript },
      { name: 'JavaScript', icon: SiJavascript },
      { name: 'GSAP', icon: SiGreensock },
      { name: 'Three.js', icon: SiThreedotjs },
      { name: 'Tailwind CSS', icon: SiTailwindcss },
    ],
  },
  {
    need: 'An online store that sells',
    short: 'E-commerce',
    ghost: 'E-commerce',
    tools: [
      { name: 'Shopify', icon: SiShopify },
      { name: 'Liquid', mono: 'LQD' },
      { name: 'WordPress', icon: SiWordpress },
      { name: 'WooCommerce', icon: SiWoocommerce },
      { name: 'Elementor', icon: SiElementor },
      { name: 'PHP', icon: SiPhp },
    ],
  },
  {
    need: 'Mobile apps & software',
    short: 'Mobile & software',
    ghost: 'Software',
    tools: [
      { name: 'React Native', icon: SiReact },
      { name: 'Kotlin', icon: SiKotlin },
      { name: 'Android', icon: SiAndroid },
      { name: 'ASP.NET Core', icon: SiDotnet },
      { name: 'C#', mono: 'C#' },
      { name: 'Node.js', icon: SiNodedotjs },
      { name: 'SQL Server', mono: 'SQL' },
      { name: 'PostgreSQL', icon: SiPostgresql },
    ],
  },
  {
    need: 'AI & automations',
    short: 'AI',
    ghost: 'AI',
    tools: [
      { name: 'Claude', icon: SiClaude },
      { name: 'GPT', mono: 'GPT' },
      { name: 'Gemini', icon: SiGooglegemini },
      { name: 'MCP', icon: SiModelcontextprotocol },
      { name: 'Claude Code', icon: SiAnthropic },
      { name: 'Python', icon: SiPython },
    ],
  },
];

/** Board size: the biggest need. Smaller needs fill the rest with blank tiles. */
export const STACK_SLOTS = Math.max(...STACK.map((n) => n.tools.length));

/** Where the last need's "Next" line points. */
export const STACK_AFTER = 'Selected work';
