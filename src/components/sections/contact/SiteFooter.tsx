'use client';

import { useId, useRef, type MouseEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { FULL_BLADE, FULL_VIEWBOX, LETTER_A, LETTER_E, LETTER_M } from '../../brand/BrandMark';
import { NAV_LINKS } from '../../../config/constants';
import { FOOTER_NAME } from './contactData';
import { scrollToSection } from '../../../lib/scrollToSection';
import { useFooterReveal } from './useContact';

/**
 * The footer under the Contact panel: the EAM logo as the page's sign-off on
 * the void, then the menu, copyright and back-to-top. The letters sit in a
 * cap-height mask (y 10 → 70 of the mark's grid) so they can rise into it.
 */
export function SiteFooter() {
  const footRef = useRef<HTMLElement>(null);
  const clipId = `ft-clip-${useId().replace(/:/g, '')}`;
  useFooterReveal(footRef);

  const go = (e: MouseEvent, id: string | null) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <footer ref={footRef} className="ft">
      <span className="ft-glow" aria-hidden="true" />
      <div className="ft-stage">
        <svg className="ft-mark" viewBox={FULL_VIEWBOX} role="img" aria-label={FOOTER_NAME}>
          <defs>
            <clipPath id={clipId}>
              <rect x="-6" y="10" width="178" height="60" />
            </clipPath>
          </defs>
          <g className="ft-letters" clipPath={`url(#${clipId})`}>
            <g className="ft-letter">{LETTER_E}</g>
            <g className="ft-letter">{LETTER_A}</g>
            <g className="ft-letter">{LETTER_M}</g>
          </g>
          <polygon className="ft-blade" points={FULL_BLADE} />
        </svg>
        <p className="ft-name" aria-hidden="true">
          {FOOTER_NAME}
        </p>
      </div>

      <div className="ft-meta">
        <nav aria-label="Footer">
          {NAV_LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={(e) => go(e, l.id)}>
              {l.label}
            </a>
          ))}
        </nav>
        {/* the year can differ between the server render and the client around New Year */}
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} {FOOTER_NAME}
        </p>
        <a className="ft-top" href="#main-content" onClick={(e) => go(e, null)}>
          Back to top
          <span className="ft-top-i" aria-hidden="true">
            <ArrowUp />
          </span>
        </a>
      </div>
    </footer>
  );
}

export default SiteFooter;
