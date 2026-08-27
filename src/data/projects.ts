import type { Project } from '../types';

/**
 * Gallery order is the narrative: commerce -> product -> system. It reads as
 * increasing technical breadth, so `sort_order` here is an editorial sequence
 * rather than chronology.
 */
export const projects: Project[] = [
  {
    id: 'sport-zone',
    title: 'Sport Zone',
    discipline: 'Shopify E-Commerce Development',
    role: 'Freelance · sportzonelb.com',
    description:
      'Built a custom multi-brand Shopify storefront with ERP/POS catalog synchronization, Shopify GraphQL and REST APIs, bulk operations, webhooks, and a heavily customized Horizon theme.',
    tech_stack: ['Shopify', 'Liquid', 'GraphQL', 'REST API', 'Webhooks', 'ERP Integration'],
    live_url: 'https://sportzonelb.com',
    github_url: null,
    thumbnail_url: '/assets/images/projects/sportzone-desktop.webp',
    secondary_image_url: '/assets/images/projects/sportzone-mobile.webp',
    cta_label: 'View Live Site',
    /* The catalog figure is SKUs in the ERP, not products synced to Shopify. */
    metric: '10,000+ ERP SKUs',
    gallery_images: [],
    category: 'E-Commerce',
    environment: 'commerce',
    project_date: '2025-06-01',
    featured: true,
    sort_order: 1,
  },
  {
    id: 'physio-clinic',
    title: 'The Physio Clinic',
    discipline: 'Interactive Medical Web Application',
    role: 'Lead Full-Stack Developer · thephysiocliniclb.com',
    description:
      'Architected and deployed a high-performance interactive medical website using Next.js, React, TypeScript, WebGL, Three.js, GSAP, Framer Motion and Vercel.',
    tech_stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Three.js',
      'WebGL',
      'GSAP',
      'Tailwind',
      'Vercel',
    ],
    live_url: 'https://thephysiocliniclb.com',
    github_url: null,
    thumbnail_url: '/assets/images/projects/physioclinic-desktop.webp',
    secondary_image_url: '/assets/images/projects/physioclinic-mobile.webp',
    cta_label: 'View Live Site',
    gallery_images: [],
    category: 'Web',
    environment: 'clinical',
    project_date: '2025-03-01',
    featured: true,
    sort_order: 2,
  },
  {
    id: 'atlas',
    title: 'ATLAS',
    discipline: 'Autonomous Tool-Linked Agent System',
    role: 'AI Agent System · Local Development',
    description:
      'A secure, self-hosted AI agent system combining a React dashboard with a Node.js orchestration engine, controlled tool execution and Human-in-the-Loop authorization.',
    tech_stack: ['React', 'Node.js', 'WebSockets', 'SQLite', 'AI Agents', 'LLM APIs'],
    /*
     * No live_url by design: ATLAS runs locally and is not publicly deployed,
     * so the only honest CTA is the source. `status` below is what says so on
     * screen.
     */
    live_url: null,
    github_url: 'https://github.com/eliaam1/Atlas-Agentic-System',
    /*
     * Awaiting the real dashboard capture. Empty rather than a stand-in
     * screenshot: the gallery renders its drawn placeholder when this is
     * blank, and a borrowed image would misrepresent the work.
     */
    thumbnail_url: '',
    status: 'IN DEVELOPMENT · LOCAL',
    cta_label: 'View GitHub',
    gallery_images: [],
    category: 'AI',
    environment: 'technical',
    project_date: '2026-01-01',
    featured: true,
    sort_order: 3,
  },
];
