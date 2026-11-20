'use client';

import { useEffect } from 'react';
import { ROLL_QUERY, letterRoll } from '../../lib/textFx';

/**
 * Turns on the letter roll for every [data-roll] link label on the page
 * (nav, menu, contact channels, footer). Hover devices with motion allowed
 * only; it switches itself on or off if that changes. Renders nothing.
 */
export function LetterRoll(): null {
  useEffect(() => {
    const mq = window.matchMedia(ROLL_QUERY);
    let teardown: (() => void) | null = null;
    const sync = () => {
      teardown?.();
      teardown = mq.matches ? letterRoll(document) : null;
    };
    // after web fonts, so split letters are measured in the final face
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) sync();
    });
    mq.addEventListener('change', sync);
    return () => {
      cancelled = true;
      mq.removeEventListener('change', sync);
      teardown?.();
    };
  }, []);
  return null;
}

export default LetterRoll;
