'use client';

import React from 'react';
import type { IconType } from 'react-icons';
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiNodedotjs,
  SiShopify,
  SiWordpress,
  SiPhp,
  SiDotnet,
  SiSharp,
} from 'react-icons/si';
import {
  Webhook,
  Database,
  Workflow,
  Sparkles,
  BrainCircuit,
  FileCode,
  LayoutTemplate,
} from 'lucide-react';

interface TechEntry {
  Icon: IconType | React.ComponentType<{ className?: string }>;
  label: string;
}

/**
 * Technology key -> brand mark.
 *
 * Official marks come from react-icons/si (Simple Icons) so Shopify, WordPress,
 * React, Next.js and .NET render as the real logos rather than approximations.
 * Concepts with no official mark -- an API, an LLM, a CMS -- fall back to a
 * lucide glyph, which is the icon family the rest of the site already uses, so
 * the two sets sit together without looking mismatched.
 *
 * Unknown keys resolve to null and are skipped by the renderer rather than
 * throwing or drawing an empty box: a typo in a data file should cost one
 * missing chip, not the whole section.
 */
const TECH_REGISTRY: Record<string, TechEntry> = {
  react: { Icon: SiReact, label: 'React' },
  nextjs: { Icon: SiNextdotjs, label: 'Next.js' },
  typescript: { Icon: SiTypescript, label: 'TypeScript' },
  javascript: { Icon: SiJavascript, label: 'JavaScript' },
  nodejs: { Icon: SiNodedotjs, label: 'Node.js' },
  shopify: { Icon: SiShopify, label: 'Shopify' },
  liquid: { Icon: FileCode, label: 'Liquid' },
  wordpress: { Icon: SiWordpress, label: 'WordPress' },
  php: { Icon: SiPhp, label: 'PHP' },
  cms: { Icon: LayoutTemplate, label: 'CMS' },
  dotnet: { Icon: SiDotnet, label: '.NET' },
  csharp: { Icon: SiSharp, label: 'C#' },
  database: { Icon: Database, label: 'SQL Server' },
  api: { Icon: Webhook, label: 'APIs' },
  ai: { Icon: Sparkles, label: 'AI Agents' },
  llm: { Icon: BrainCircuit, label: 'LLMs' },
  automation: { Icon: Workflow, label: 'Automation' },
};

export function getTechEntry(key: string): TechEntry | null {
  return TECH_REGISTRY[key] ?? null;
}

interface TechRowProps {
  keys: string[];
  /** The featured card gets slightly larger marks and labels. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The technology row on a service card.
 *
 * Renders labelled chips rather than bare logos: a Simple Icons glyph on its
 * own is only legible to someone who already recognises it, and this section
 * is read by clients as often as by engineers.
 */
export const TechRow: React.FC<TechRowProps> = ({ keys, size = 'sm', className = '' }) => {
  const entries = keys
    .map((k) => [k, getTechEntry(k)] as const)
    .filter((pair): pair is readonly [string, TechEntry] => pair[1] !== null);

  if (entries.length === 0) return null;

  const iconClass = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const textClass = size === 'md' ? 'text-[11px]' : 'text-[10px]';

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {entries.map(([key, { Icon, label }]) => (
        <li
          key={key}
          className={`service-tech inline-flex items-center gap-1.5 rounded-full border border-app-border/80 bg-app-bg/60 px-2.5 py-1 font-mono font-semibold uppercase tracking-wider text-app-text-secondary transition-colors duration-200 group-hover/card:border-app-accent/40 group-hover/card:text-app-text-primary ${textClass}`}
        >
          <Icon className={`${iconClass} text-app-accent`} aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
};

export default TechRow;
