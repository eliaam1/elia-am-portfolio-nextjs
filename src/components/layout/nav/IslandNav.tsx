'use client';

import { useRef, type MouseEvent } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import BrandMark from '../../brand/BrandMark';
import { CONTACT, NAV_LINKS } from '../../../config/constants';
import { scrollToSection } from '../../../lib/scrollToSection';
import { CHAPTER_NUMBERS, RING_LENGTH, RING_R } from './navData';
import { useIsland } from './useIsland';
import './nav.css';

/** The logo already goes back to the top, so the wide row does not repeat Home. */
const BAR_LINKS = NAV_LINKS.filter((l) => l.id !== 'hero');

/**
 * The site navigation: one floating island.
 * - Over the hero (desktop) it is wide: logo, links, WhatsApp.
 * - Once you scroll it folds into a compact capsule: the logo, a ring filling
 *   through the chapter you are in ("02 Work"), Menu, and a round WhatsApp
 *   button (hidden over Contact, where it would repeat itself).
 * - Menu grows the same island into the list of chapters.
 * On phones it is always compact and docks at the bottom, opening upwards.
 * The full EAM logo shows in every state.
 */
export function IslandNav() {
  const islRef = useRef<HTMLElement>(null);
  const { toggle, close } = useIsland(islRef);

  const go = (e: MouseEvent, id: string) => {
    e.preventDefault();
    close();
    scrollToSection(id);
  };
  const brand = (
    <a className="isl-brand" href="#hero" onClick={(e) => go(e, 'hero')} aria-label="Elia Abdel Massih, back to top">
      <BrandMark title="" className="isl-mark" />
    </a>
  );

  return (
    <header ref={islRef} className="isl">
      <div className="isl-row isl-wide">
        {brand}
        <nav aria-label="Primary" className="isl-links">
          {BAR_LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} data-chapter={l.id} onClick={(e) => go(e, l.id)}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="isl-wa" href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" data-cursor-label="WhatsApp" data-cursor-fill="">
          <SiWhatsapp aria-hidden="true" />
          WhatsApp me
          <ArrowRight aria-hidden="true" className="isl-wa-arrow" />
        </a>
      </div>

      <div className="isl-row isl-compact">
        {brand}
        {/* no live region: it would announce every chapter a smooth jump passes; aria-current marks the place */}
        <p className="isl-where">
          <svg className="isl-ring" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="isl-ring-t" cx="12" cy="12" r={RING_R} />
            <circle className="isl-ring-p" cx="12" cy="12" r={RING_R} data-ring strokeDasharray={RING_LENGTH} strokeDashoffset={RING_LENGTH} />
          </svg>
          <span className="sr-only">You are in </span>
          <b data-where-n>{CHAPTER_NUMBERS[0]}</b>
          <span data-where-l>{NAV_LINKS[0].label}</span>
        </p>
        <button className="isl-menu" type="button" aria-expanded="false" aria-controls="isl-drop" onClick={toggle}>
          <span className="isl-bars" aria-hidden="true" />
          Menu
        </button>
        <a className="isl-wa-round" href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp me">
          <SiWhatsapp aria-hidden="true" />
        </a>
      </div>

      <nav id="isl-drop" className="isl-drop" aria-label="Menu">
        {NAV_LINKS.map((l, i) => (
          <a key={l.id} href={`#${l.id}`} data-chapter={l.id} onClick={(e) => go(e, l.id)}>
            <small>{CHAPTER_NUMBERS[i]}</small>
            <span className="isl-drop-m">
              <span className="isl-drop-l">{l.label}</span>
            </span>
          </a>
        ))}
        <a className="isl-tel" href={CONTACT.phoneHref}>
          <Phone aria-hidden="true" />
          {CONTACT.phoneDisplay}
        </a>
      </nav>
    </header>
  );
}

export default IslandNav;
