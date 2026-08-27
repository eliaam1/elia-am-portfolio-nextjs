import type { Service } from '../types';

/**
 * Capabilities, ordered by importance and ranked for visual weight.
 *
 * `prominence` drives the stack's hierarchy: Full-Stack is the one featured
 * card, Shopify / .NET / AI are major, and WordPress is deliberately
 * supporting. WordPress is worth showing, but giving it weight equal to the
 * other four would misrepresent the practice as CMS-first.
 *
 * `image_url` is intentionally absent on every record. The previous version
 * pointed each card at an Unsplash stock photo; a themed placeholder that
 * names the category is more honest than a stranger at a laptop. Drop files
 * into public/assets/images/services/ and set image_url to swap them in one
 * at a time -- see ServicePlaceholder for what renders until then.
 */
export const services: Service[] = [
  {
    id: 'srv-fullstack',
    title: 'Full-Stack Development',
    description:
      'End-to-end web applications on React and Next.js — typed front-ends, real back-end services, and the API layer that joins them.',
    icon: 'code',
    tech: ['react', 'nextjs', 'typescript', 'api'],
    prominence: 'featured',
    features: [
      'React & Next.js Application Architecture',
      'TypeScript Across Front-End and Back-End',
      'REST API Design & Third-Party Integration',
      'Responsive, Performance-Budgeted Interfaces',
    ],
    price_range: 'Custom Project',
    sort_order: 1,
  },
  {
    id: 'srv-shopify',
    title: 'Shopify Development',
    description:
      'Custom storefronts, not themes with the colours changed — Liquid development, product architecture, and the integrations that let a store run itself.',
    icon: 'shopping-bag',
    tech: ['shopify', 'liquid', 'javascript', 'api'],
    prominence: 'major',
    features: [
      'Custom Theme & Liquid Development',
      'Product and Collection Architecture',
      'E-Commerce UI/UX and Conversion Flow',
      'Admin API & Multi-Store Inventory Sync',
    ],
    price_range: 'Custom Project',
    sort_order: 2,
  },
  {
    id: 'srv-dotnet',
    title: 'Enterprise .NET Development',
    description:
      'Secure, database-driven business systems on .NET Core — C# web APIs and desktop applications built to enterprise reliability expectations.',
    icon: 'server',
    tech: ['dotnet', 'csharp', 'database', 'api'],
    prominence: 'major',
    features: [
      '.NET Core & ASP.NET Web API Development',
      'C# Enterprise Desktop Applications',
      'SQL Server Schema & Query Optimisation',
      'Layered Enterprise Software Architecture',
    ],
    price_range: 'Custom Project',
    sort_order: 3,
  },
  {
    id: 'srv-ai',
    title: 'AI Workflows & Automation',
    description:
      'LLM integrations and AI agents wired into real processes — orchestrating APIs, services and data so the automation does the work.',
    icon: 'workflow',
    tech: ['ai', 'llm', 'automation', 'api'],
    prominence: 'major',
    features: [
      'LLM Integration & AI Agent Development',
      'API Orchestration Across Tools & Services',
      'Intelligent Business Process Automation',
      'AI-Assisted Development & Content Workflows',
    ],
    price_range: 'Advisory / Project',
    sort_order: 4,
  },
  {
    id: 'srv-wordpress',
    title: 'WordPress Development',
    description:
      'Custom WordPress builds for when a CMS is the right tool — bespoke themes, considered plugins, and sites that stay fast after handover.',
    icon: 'layout-template',
    tech: ['wordpress', 'php', 'cms'],
    prominence: 'supporting',
    features: [
      'Custom Themes & Theme Customisation',
      'Plugin Integration & CMS Development',
      'Responsive Website Implementation',
      'Core Web Vitals & Performance Optimisation',
    ],
    price_range: 'Custom Project',
    sort_order: 5,
  },
];
