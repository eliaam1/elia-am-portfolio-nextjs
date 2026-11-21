'use client';

import { useRef } from 'react';
import { STACK } from './stackData';
import { Poster } from './posters';
import { useStackPosters } from './useStackPosters';
import './stack.css';

/**
 * Stack — "Depth panels". What a client needs, and what Elia builds it with,
 * as four posters stacked like prints: an exploded site, a checkout story, an
 * app's system map and an automation's run log. Every picture is made up, so
 * Stack never repeats the client work shown in Selected Work.
 *
 * The markup is the full readable content (reduced motion and no-JS get four
 * posters one after another). useStackPosters adds the pinned stack on desktop,
 * the sticky stack on touch screens, and the tool ↔ picture highlighting.
 */
export function StackPosters() {
  const rootRef = useRef<HTMLElement>(null);
  useStackPosters(rootRef);

  return (
    <section ref={rootRef} className="skp" aria-labelledby="stack-title">
      <div className="skp-head">
        <div>
          <p className="rd-label skp-eyebrow">
            <b>Stack</b>
          </p>
          <h2 id="stack-title" className="skp-title">
            The right tools for each job<span className="text-app-accent">.</span>
          </h2>
        </div>
        <p className="skp-lead">What you need, and what I build it with.</p>
      </div>
      <div className="skp-stage">
        {STACK.map((need, i) => (
          <Poster key={need.id} need={need} i={i} />
        ))}
        <p className="skp-prog" aria-hidden="true">
          <b className="num">
            <span data-fn>01</span>
          </b>{' '}
          / {String(STACK.length).padStart(2, '0')}{' '}
          <span className="num">
            <span className="lab" data-fl>
              {STACK[0].short}
            </span>
          </span>
        </p>
      </div>
    </section>
  );
}

export default StackPosters;
