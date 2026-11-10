'use client';

import { useRef } from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { CONTACT } from '../../../config/constants';
import { CONTACT_COPY as C } from './contactData';
import { useContactMotion } from './useContact';
import './contact.css';

/**
 * 03 / Contact. The page's last section: a raised panel with the heading, the
 * two facts and the only two channels (WhatsApp, phone). It lifts off the
 * footer below it like a curtain (SiteFooter). Selected Work already ends on
 * its own contact portal; this is the calm, factual version a visitor lands
 * on from the menu.
 */
export function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  useContactMotion(rootRef);

  return (
    <section ref={rootRef} id="contact" className="ct" aria-labelledby="ct-heading">
      <div className="ct-in">
        <div>
          <p className="rd-label ct-label">
            <b>{C.index}</b> &nbsp;/&nbsp; {C.label}
          </p>
          <h2 id="ct-heading" className="ct-title">
            {C.ask} <span className="ct-answer">{C.answer}</span>
            <span className="text-app-accent">.</span>
          </h2>
          <ul className="ct-facts">
            <li className="ct-fact">
              <span className="ct-pulse" aria-hidden="true" />
              <b>{C.availability}</b>
            </li>
            <li className="ct-fact">
              <span className="rd-cut" aria-hidden="true" />
              {C.location}
            </li>
          </ul>
        </div>

        <div className="ct-chan">
          <a
            className="ct-ch is-main"
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor-label="WhatsApp"
            data-cursor-fill=""
          >
            <span className="ct-ic" aria-hidden="true">
              <SiWhatsapp />
            </span>
            <span>
              <small>{C.whatsapp.hint}</small>
              <strong>{C.whatsapp.action}</strong>
            </span>
            <ArrowUpRight className="ct-arrow" aria-hidden="true" />
          </a>
          <a className="ct-ch" href={CONTACT.phoneHref} data-cursor-label="Call" data-cursor-fill="">
            <span className="ct-ic" aria-hidden="true">
              <Phone />
            </span>
            <span>
              <small>{C.phone.hint}</small>
              <strong>{CONTACT.phoneDisplay}</strong>
            </span>
            <ArrowUpRight className="ct-arrow" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
