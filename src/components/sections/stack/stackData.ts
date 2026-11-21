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
 * A tool shows its brand mark (in its brand colour) when Simple Icons has one;
 * otherwise a short text badge (`mono`). C#, Liquid, SQL Server and OpenAI have
 * no mark there.
 */
export type Tool = {
  /** Stable key: links a tool to the parts of a poster it powers ([data-tech] / [data-techs]). */
  id: string;
  name: string;
  /** What it does for a client, in plain words. */
  desc: string;
  /** Brand colour (Simple Icons values; Liquid takes Shopify's green). */
  brand: string;
} & ({ icon: IconType; mono?: never } | { mono: string; icon?: never });

/** A marker scribble, authored in a 100 × 30 box, placed relative to the key word's box. */
export interface Scribble {
  d: string;
  /** Offset and size as fractions of the key word's box. */
  box: { x: number; y: number; w: number; h: number };
}

export interface Need {
  id: 'web' | 'store' | 'apps' | 'ai';
  /** What the client needs, in their words. Ends with `keyword`. */
  need: string;
  /** The last word of `need`: it gets the scribble and keeps the lime full stop. */
  keyword: string;
  short: string;
  /** What the group builds, for the client. */
  outcome: string;
  scribble: Scribble;
  tools: readonly Tool[];
}

export const STACK: readonly Need[] = [
  {
    id: 'web',
    need: 'A website people remember',
    keyword: 'remember',
    short: 'Websites & motion',
    outcome: 'Fast, animated websites that work on every screen.',
    scribble: { d: 'M2 18 C 22 10, 48 24, 98 12 M14 26 C 40 20, 66 28, 90 22', box: { x: -0.02, y: 0.64, w: 1.04, h: 0.26 } },
    tools: [
      { id: 'nextjs', name: 'Next.js', icon: SiNextdotjs, brand: '#000000', desc: 'Pages that load fast and are ready to read.' },
      { id: 'react', name: 'React', icon: SiReact, brand: '#149ECA', desc: 'Interfaces built from reusable parts.' },
      { id: 'typescript', name: 'TypeScript', icon: SiTypescript, brand: '#3178C6', desc: 'Catches mistakes before launch.' },
      { id: 'javascript', name: 'JavaScript', icon: SiJavascript, brand: '#E8C600', desc: 'The language every browser speaks.' },
      { id: 'gsap', name: 'GSAP', icon: SiGreensock, brand: '#0AE448', desc: 'Smooth, choreographed animation.' },
      { id: 'threejs', name: 'Three.js', icon: SiThreedotjs, brand: '#000000', desc: 'Real 3D, right in the browser.' },
      { id: 'tailwindcss', name: 'Tailwind CSS', icon: SiTailwindcss, brand: '#06B6D4', desc: 'One consistent design, built quickly.' },
    ],
  },
  {
    id: 'store',
    need: 'An online store that sells',
    keyword: 'sells',
    short: 'E-commerce',
    outcome: 'Complete stores: catalogue, cart, checkout and stock.',
    scribble: { d: 'M58 4 C 18 0, 0 12, 4 20 C 10 31, 82 31, 96 18 C 104 6, 66 0, 34 6', box: { x: -0.18, y: -0.08, w: 1.36, h: 1.2 } },
    tools: [
      { id: 'shopify', name: 'Shopify', icon: SiShopify, brand: '#7AB55C', desc: 'A store that is easy to run day to day.' },
      { id: 'liquid', name: 'Liquid', mono: 'LQD', brand: '#7AB55C', desc: 'Custom Shopify themes and sections.' },
      { id: 'wordpress', name: 'WordPress', icon: SiWordpress, brand: '#21759B', desc: 'Pages your team can edit.' },
      { id: 'woocommerce', name: 'WooCommerce', icon: SiWoocommerce, brand: '#96588A', desc: 'A full store inside WordPress.' },
      { id: 'elementor', name: 'Elementor', icon: SiElementor, brand: '#92003B', desc: 'Visual editing, no code needed.' },
      { id: 'php', name: 'PHP', icon: SiPhp, brand: '#777BB4', desc: 'Custom store rules and plugins.' },
    ],
  },
  {
    id: 'apps',
    need: 'Mobile apps & software',
    keyword: 'software',
    short: 'Mobile & software',
    outcome: 'Apps for phones, and the systems behind them.',
    scribble: { d: 'M2 16 Q 8 6 14 16 T 26 16 T 38 16 T 50 16 T 62 16 T 74 16 T 86 16 T 98 16', box: { x: 0, y: 0.66, w: 1, h: 0.2 } },
    tools: [
      { id: 'reactnative', name: 'React Native', icon: SiReact, brand: '#149ECA', desc: 'One app for iPhone and Android.' },
      { id: 'kotlin', name: 'Kotlin', icon: SiKotlin, brand: '#7F52FF', desc: 'Native Android apps.' },
      { id: 'android', name: 'Android', icon: SiAndroid, brand: '#3DDC84', desc: 'Camera, maps and notifications.' },
      { id: 'aspnetcore', name: 'ASP.NET Core', icon: SiDotnet, brand: '#512BD4', desc: 'Secure business back ends.' },
      { id: 'csharp', name: 'C#', mono: 'C#', brand: '#68217A', desc: 'Reliable server-side logic.' },
      { id: 'nodejs', name: 'Node.js', icon: SiNodedotjs, brand: '#5FA04E', desc: 'APIs and real-time services.' },
      { id: 'sqlserver', name: 'SQL Server', mono: 'SQL', brand: '#CC2927', desc: 'Business data, kept safe.' },
      { id: 'postgresql', name: 'PostgreSQL', icon: SiPostgresql, brand: '#4169E1', desc: 'A fast, dependable database.' },
    ],
  },
  {
    id: 'ai',
    need: 'AI & automations',
    keyword: 'automations',
    short: 'AI',
    outcome: 'Assistants and automations that save hours of routine work.',
    scribble: { d: 'M2 16 C 30 8, 64 24, 92 12 M82 5 L 93 12 L 83 20', box: { x: 0, y: 0.62, w: 1.04, h: 0.3 } },
    tools: [
      { id: 'claude', name: 'Claude', icon: SiClaude, brand: '#D97757', desc: 'Reads, writes and reasons over documents.' },
      { id: 'gpt', name: 'GPT', mono: 'GPT', brand: '#000000', desc: 'Drafts replies and text.' },
      { id: 'gemini', name: 'Gemini', icon: SiGooglegemini, brand: '#8E75B2', desc: 'Understands photos and long files.' },
      { id: 'mcp', name: 'MCP', icon: SiModelcontextprotocol, brand: '#000000', desc: 'Connects AI to your own tools.' },
      { id: 'claudecode', name: 'Claude Code', icon: SiAnthropic, brand: '#D97757', desc: 'Builds and tests the automation.' },
      { id: 'python', name: 'Python', icon: SiPython, brand: '#3776AB', desc: 'Moves the data between steps.' },
    ],
  },
];

export const toolById = (id: string): Tool | undefined => STACK.flatMap((n) => n.tools).find((t) => t.id === id);
