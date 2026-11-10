import type { MetadataRoute } from 'next';

/**
 * Private by owner decision (see the metadata in layout.tsx).
 *
 * Regular search crawlers are deliberately ALLOWED to fetch pages: that is the
 * only way they can read the noindex rule and drop the site from results. A
 * blanket Disallow would hide that rule and can leave the bare URL listed.
 * Image search and AI-training crawlers are shut out completely, so the photos
 * are never fetched by them at all. No sitemap is published.
 */
const BLOCKED_BOTS = [
  'Googlebot-Image',
  'bingbot-image',
  'GPTBot',
  'ChatGPT-User',
  'CCBot',
  'Google-Extended',
  'anthropic-ai',
  'ClaudeBot',
  'PerplexityBot',
  'Bytespider',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_BOTS, disallow: '/' },
      { userAgent: '*', allow: '/' },
    ],
  };
}
