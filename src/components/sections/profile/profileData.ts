/** Profile copy (picks A3 / B2 / C1) and the facts behind the career log. */

export const PROFILE_STATEMENT = {
  before: 'From first idea to launch day, I turn ',
  highlight: 'business problems',
  after: ' into websites people remember, stores people buy from and apps people actually use.',
} as const;

export const PROFILE_BIO = [
  "I'm Elia. I turn ideas into working solutions: websites, custom software, e-commerce stores and mobile apps, from idea to launch and beyond.",
  'Every project gets the same care: a design that fits your brand, a site that loads fast, and the SEO groundwork so customers can find you.',
] as const;

export const PROJECTS_DELIVERED = 15;

export const SERVICES = [
  'Websites & web design',
  'E-commerce stores',
  'SEO',
  'Web apps & dashboards',
  'Custom software',
  'Mobile apps',
  'Backend, APIs & automations',
  'Animation & 3D',
] as const;

export interface CareerCommit {
  hash: string;
  year: string;
  title: string;
  detail?: string;
}

/** Newest first, like `git log`. The last entry is HEAD. */
export const CAREER_LOG: readonly CareerCommit[] = [
  { hash: 'c81d4e', year: '2026', title: 'Shipped AgriSide', detail: 'Next.js, GSAP, Three.js · Cloudflare Workers' },
  { hash: 'e4a91c', year: '2025', title: 'B.Sc. Computer Science', detail: 'Lebanese University, Zahlé' },
  { hash: '9b07d2', year: '2024', title: 'AI diploma, full scholarship', detail: 'USJ Beirut · LLM integration, MCP' },
  { hash: '71c3fa', year: '2023', title: 'Full-stack developer, IT department', detail: '.NET Core, ASP.NET Web API, SQL Server' },
  { hash: '3d58e0', year: '2023', title: 'Physics & maths tutor', detail: '10+ students' },
  { hash: '0a1f6b', year: '2022', title: 'Freelance begins', detail: 'Shopify storefront, React app, WordPress themes' },
  { hash: 'HEAD', year: 'now', title: 'Open to remote work' },
];
