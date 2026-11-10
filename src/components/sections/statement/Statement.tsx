'use client';

import { useRef } from 'react';
import { STATEMENT_BEATS, STATEMENT_PARTS, STATEMENT_PROOF } from './statementData';
import { useStatement } from './useStatement';
import './statement.css';

/**
 * "What I do" — the one-line statement that leads into Selected Work.
 *
 * With motion: pinned for about 1.2 screens. Three giant beats (Premium. Fast.
 * Easy.) cut through, the sentence rises with those words in lime, then the
 * camera pushes through it into the dark and a lime light is left at the
 * centre, exactly where the Dimension's own opening light switches on.
 * Without motion it is a plain heading and proof line.
 */
export function Statement() {
  const rootRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLSpanElement>(null);
  useStatement(rootRef, lightRef);

  return (
    <>
      <section ref={rootRef} className="st" aria-labelledby="st-heading">
        <div className="st-beats" aria-hidden="true">
          {STATEMENT_BEATS.map((b) => (
            <span key={b} className="st-beat">
              <span className="st-beat-w">
                {b}
                <span className="text-app-accent">.</span>
              </span>
            </span>
          ))}
        </div>
        <div className="st-in">
          <p className="rd-label st-fade">What I do</p>
          <h2 id="st-heading" className="st-title">
            {STATEMENT_PARTS.map((p) => (p.key ? <span key={p.text} className="st-key">{p.text}</span> : p.text))}
            <span className="text-app-accent">.</span>
          </h2>
          <p className="st-proof st-fade">
            <span className="rd-cut" aria-hidden="true" />
            <span>
              <b>{STATEMENT_PROOF.count}</b> {STATEMENT_PROOF.text}
            </span>
          </p>
        </div>
        <div className="st-void" aria-hidden="true" />
      </section>
      {/* fixed, outside the pinned section, so it can hold the centre while the Dimension slides in */}
      <span ref={lightRef} className="st-light" aria-hidden="true" />
    </>
  );
}

export default Statement;
