'use client';

import React from 'react';

interface ServicePlaceholderProps {
  serviceId: string;
  label: string;
  className?: string;
}

/**
 * Drawn stand-in for a service card's media, used until a real render is
 * supplied via `Service.image_url`.
 *
 * Why drawn rather than a stock photo: the five categories have to read as one
 * visual story (web -> e-commerce -> enterprise -> AI -> CMS), and five
 * unrelated photographs cannot do that. Every motif below is built from the
 * same primitives -- 1.5px strokes on the same 400x260 viewBox, one accent
 * path each, identical corner radius -- so the set is cohesive by
 * construction rather than by careful photo selection.
 *
 * These are line-art diagrams, deliberately not imitations of the cinematic 3D
 * renders the brief describes. They are the honest placeholder: they state the
 * category clearly and get out of the way the moment real art exists.
 *
 * The surrounding grammar (gradient wash + 40px grid + radial accent + mono
 * label) is taken from ProjectPlaceholder so both placeholder families read as
 * one system.
 */

const STROKE = 'stroke-current text-app-text-secondary/45';
const ACCENT = 'stroke-current text-app-accent';

/** Layered application frames in perspective — UI over services over API. */
function FullStackMotif() {
  return (
    <g fill="none" strokeWidth="1.5">
      <rect x="52" y="34" width="210" height="132" rx="8" className={STROKE} opacity="0.4" />
      <rect x="82" y="58" width="210" height="132" rx="8" className={STROKE} opacity="0.7" />
      <rect x="112" y="82" width="210" height="132" rx="8" className={STROKE} />
      <line x1="112" y1="102" x2="322" y2="102" className={STROKE} />
      <circle cx="124" cy="92" r="3" className={ACCENT} />
      <line x1="128" y1="122" x2="196" y2="122" className={ACCENT} strokeWidth="2.5" />
      <line x1="128" y1="140" x2="252" y2="140" className={STROKE} />
      <line x1="128" y1="156" x2="228" y2="156" className={STROKE} />
      <line x1="128" y1="172" x2="268" y2="172" className={STROKE} />
      <line x1="128" y1="188" x2="204" y2="188" className={STROKE} />
    </g>
  );
}

/** Storefront across desktop and phone, with a product grid. */
function ShopifyMotif() {
  return (
    <g fill="none" strokeWidth="1.5">
      <rect x="56" y="46" width="212" height="150" rx="8" className={STROKE} />
      <line x1="56" y1="68" x2="268" y2="68" className={STROKE} />
      <rect x="72" y="84" width="56" height="48" rx="4" className={ACCENT} />
      <rect x="140" y="84" width="56" height="48" rx="4" className={STROKE} />
      <rect x="208" y="84" width="46" height="48" rx="4" className={STROKE} />
      <line x1="72" y1="148" x2="128" y2="148" className={STROKE} />
      <line x1="140" y1="148" x2="196" y2="148" className={STROKE} />
      <line x1="72" y1="166" x2="108" y2="166" className={ACCENT} strokeWidth="2.5" />
      <rect x="288" y="76" width="60" height="120" rx="10" className={STROKE} />
      <line x1="288" y1="94" x2="348" y2="94" className={STROKE} />
      <rect x="300" y="106" width="36" height="30" rx="3" className={ACCENT} />
      <line x1="300" y1="148" x2="336" y2="148" className={STROKE} />
      <line x1="300" y1="162" x2="322" y2="162" className={STROKE} />
    </g>
  );
}

/** Enterprise dashboard: data table, chart, layered panels. */
function DotNetMotif() {
  return (
    <g fill="none" strokeWidth="1.5">
      <rect x="48" y="40" width="304" height="162" rx="8" className={STROKE} />
      <line x1="48" y1="64" x2="352" y2="64" className={STROKE} />
      <line x1="164" y1="64" x2="164" y2="202" className={STROKE} opacity="0.6" />
      <line x1="64" y1="84" x2="148" y2="84" className={ACCENT} strokeWidth="2.5" />
      <line x1="64" y1="104" x2="148" y2="104" className={STROKE} />
      <line x1="64" y1="124" x2="148" y2="124" className={STROKE} />
      <line x1="64" y1="144" x2="132" y2="144" className={STROKE} />
      <line x1="64" y1="164" x2="148" y2="164" className={STROKE} />
      <line x1="64" y1="184" x2="120" y2="184" className={STROKE} />
      <line x1="188" y1="184" x2="188" y2="150" className={STROKE} strokeWidth="6" />
      <line x1="212" y1="184" x2="212" y2="122" className={STROKE} strokeWidth="6" />
      <line x1="236" y1="184" x2="236" y2="138" className={STROKE} strokeWidth="6" />
      <line x1="260" y1="184" x2="260" y2="96" className={ACCENT} strokeWidth="6" />
      <line x1="284" y1="184" x2="284" y2="130" className={STROKE} strokeWidth="6" />
      <line x1="308" y1="184" x2="308" y2="110" className={STROKE} strokeWidth="6" />
      <line x1="176" y1="184" x2="332" y2="184" className={STROKE} />
    </g>
  );
}

/** Node graph: models, APIs and stores joined by orchestration paths. */
function AiMotif() {
  return (
    <g fill="none" strokeWidth="1.5">
      <path d="M96 121 C 150 121, 150 66, 200 66" className={STROKE} />
      <path d="M96 121 C 150 121, 150 121, 200 121" className={ACCENT} strokeWidth="2" />
      <path d="M96 121 C 150 121, 150 176, 200 176" className={STROKE} />
      <path d="M200 66 C 250 66, 250 121, 304 121" className={STROKE} />
      <path d="M200 121 C 250 121, 250 121, 304 121" className={ACCENT} strokeWidth="2" />
      <path d="M200 176 C 250 176, 250 121, 304 121" className={STROKE} />
      <circle cx="96" cy="121" r="15" className={ACCENT} strokeWidth="2" />
      <circle cx="200" cy="66" r="12" className={STROKE} />
      <circle cx="200" cy="121" r="12" className={ACCENT} strokeWidth="2" />
      <circle cx="200" cy="176" r="12" className={STROKE} />
      <circle cx="304" cy="121" r="15" className={STROKE} />
    </g>
  );
}

/** CMS editor: content blocks in a managed layout. */
function WordPressMotif() {
  return (
    <g fill="none" strokeWidth="1.5">
      <rect x="70" y="46" width="260" height="150" rx="8" className={STROKE} />
      <line x1="70" y1="70" x2="330" y2="70" className={STROKE} />
      <line x1="118" y1="70" x2="118" y2="196" className={STROKE} opacity="0.6" />
      <line x1="84" y1="88" x2="104" y2="88" className={ACCENT} strokeWidth="2.5" />
      <line x1="84" y1="106" x2="104" y2="106" className={STROKE} />
      <line x1="84" y1="124" x2="104" y2="124" className={STROKE} />
      <line x1="84" y1="142" x2="104" y2="142" className={STROKE} />
      <rect x="134" y="86" width="180" height="40" rx="4" className={ACCENT} />
      <rect x="134" y="138" width="84" height="44" rx="4" className={STROKE} />
      <rect x="230" y="138" width="84" height="44" rx="4" className={STROKE} />
    </g>
  );
}

const MOTIFS: Record<string, () => React.JSX.Element> = {
  'srv-fullstack': FullStackMotif,
  'srv-shopify': ShopifyMotif,
  'srv-dotnet': DotNetMotif,
  'srv-ai': AiMotif,
  'srv-wordpress': WordPressMotif,
};

export const ServicePlaceholder: React.FC<ServicePlaceholderProps> = ({
  serviceId,
  label,
  className = '',
}) => {
  const Motif = MOTIFS[serviceId] ?? FullStackMotif;

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-app-accent/[0.07] to-app-surface ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.14] text-app-text-secondary"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,61,222,0.16),transparent_65%)]" />

      {/*
        `slice` rather than the default `meet`: the media box is 16:9 on the
        featured card and much squarer on the supporting one, and letterboxing
        the motif would break the consistent framing between cards.
      */}
      <svg
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <Motif />
      </svg>

      <span className="absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-[0.3em] text-app-accent/80">
        {label}
      </span>
    </div>
  );
};

export default ServicePlaceholder;
