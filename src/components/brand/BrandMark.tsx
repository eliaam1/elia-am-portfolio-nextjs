import React from 'react';

/**
 * EAM "cut" brand mark.
 *
 * Geometry lives on a 60-unit cap-height grid (y 10 → 70): stems 14,
 * horizontal bars 12 (slightly thinner on purpose so they read optically
 * equal to the stems). The E's middle arm runs on into the A as its
 * crossbar, and the E's foot fuses into the A's leg. The lime blade runs
 * parallel to the A's right leg (22.6°) with a 2.5-unit gap; the M is
 * shifted right by 5 to give the blade its own channel.
 *
 * Letters use `currentColor`, the blade uses the accent token, so the mark
 * themes from CSS. Source of truth for the static files in /public/brand.
 */

type BrandMarkVariant = 'full' | 'glyph';

interface BrandMarkProps {
  /** `full` = EAM monogram, `glyph` = the A + blade (small sizes, favicon). */
  variant?: BrandMarkVariant;
  className?: string;
  /** Accessible name. Pass an empty string when a visible label sits next to it. */
  title?: string;
  /** Override the blade colour (e.g. `currentColor` on a lime surface). */
  bladeColor?: string;
}

const LETTER_E = (
  <>
    <rect x="0" y="10" width="14" height="60" />
    <rect x="0" y="10" width="36" height="12" />
    <rect x="0" y="58" width="36" height="12" />
    <rect x="0" y="34" width="68" height="12" />
  </>
);

const LETTER_A = <polygon points="30,70 55,10 69,10 94,70 80,70 62,26.8 44,70" />;

const LETTER_M = (
  <polygon
    transform="translate(5,0)"
    points="98,70 98,10 114,10 129,40 144,10 160,10 160,70 146,70 146,36 134,60 124,60 112,36 112,70"
  />
);

const FULL_BLADE = '64.83,-6 67.83,-6 106.17,86 103.17,86';
const GLYPH_BLADE = '69,4 72,4 102,76 99,76';

export function BrandMark({
  variant = 'full',
  className,
  title = 'Elia Abdel Massih',
  bladeColor = 'var(--color-accent)',
}: BrandMarkProps) {
  const isDecorative = title === '';
  const a11y = isDecorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': title };

  if (variant === 'glyph') {
    return (
      <svg viewBox="26 2 80 76" className={className} {...a11y}>
        <g fill="currentColor">
          {LETTER_A}
          <rect x="47" y="36" width="22" height="11" />
        </g>
        <polygon points={GLYPH_BLADE} fill={bladeColor} />
      </svg>
    );
  }

  return (
    <svg viewBox="-6 -10 178 100" className={className} {...a11y}>
      <g fill="currentColor">
        {LETTER_E}
        {LETTER_A}
        {LETTER_M}
      </g>
      <polygon points={FULL_BLADE} fill={bladeColor} />
    </svg>
  );
}

export default BrandMark;
