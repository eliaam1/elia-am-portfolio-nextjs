'use client';

import { useRef } from 'react';
import { STACK, STACK_AFTER, STACK_SLOTS, type Tool } from './stackData';
import { useStackDeck } from './useStackDeck';
import './stack.css';

const pad2 = (n: number): string => String(n).padStart(2, '0');

interface LogoProps {
  tool: Tool;
}

/** Brand mark, or a text badge where Simple Icons has none. */
function Logo({ tool }: LogoProps) {
  const Icon = tool.icon;
  return (
    <span className="sd-lg" aria-hidden="true">
      {Icon ? <Icon /> : <b className="sd-mono">{tool.mono}</b>}
    </span>
  );
}

/**
 * Stack — "Pinned deck". What a client needs, and what Elia builds it with.
 *
 * The markup is the full, readable content (every need with its tool list),
 * so it stands on its own without JS or under reduced motion. useStackDeck
 * adds `.is-pinned` and turns it into the pinned deck: the counter, the flip
 * board, the ghost word and the blade are presentation and aria-hidden.
 *
 * No React state: the jump buttons' aria-current and the "now" line are
 * updated imperatively by the hook, which is safe because this never
 * re-renders after mount.
 */
export function StackDeck() {
  const rootRef = useRef<HTMLElement>(null);
  useStackDeck(rootRef);
  const n = STACK.length;

  return (
    <section ref={rootRef} className="sd" aria-labelledby="stack-title">
      <div className="sd-ghosts" aria-hidden="true">
        {STACK.map((s) => (
          <span key={s.ghost} className="sd-ghost">
            {s.ghost}
          </span>
        ))}
      </div>

      <div className="sd-in">
        <div className="sd-top">
          <div>
            <p className="rd-label sd-eyebrow">
              <b>Stack</b>
            </p>
            <h2 id="stack-title" className="sd-title">
              The right tools for each job<span className="text-app-accent">.</span>
            </h2>
          </div>
          <p className="sd-lead">What you need, and what I build it with.</p>
        </div>

        <div className="sd-stage">
          <div className="sd-counter" aria-hidden="true">
            <span className="sd-counter-win">
              <span className="sd-counter-col">
                {STACK.map((s, i) => (
                  <span key={s.need}>{pad2(i + 1)}</span>
                ))}
              </span>
            </span>
            <small>/ {pad2(n)}</small>
          </div>

          <div className="sd-copy">
            {STACK.map((s, i) => (
              <article key={s.need} className="sd-step">
                <span className="sd-step-n" aria-hidden="true">
                  {pad2(i + 1)} / {pad2(n)}
                </span>
                <h3 className="sd-need">{s.need}</h3>
                <ul className="sd-chips" aria-label={`Tools for: ${s.need}`}>
                  {s.tools.map((t) => (
                    <li key={t.name} className="sd-chip">
                      <Logo tool={t} />
                      {t.name}
                    </li>
                  ))}
                </ul>
                <p className="sd-peek" aria-hidden="true">
                  <span className="rd-label">Next</span>
                  {i < n - 1 ? STACK[i + 1].need : STACK_AFTER}
                </p>
              </article>
            ))}
          </div>

          <div className="sd-board-wrap" aria-hidden="true">
            <div className="sd-board">
              {Array.from({ length: STACK_SLOTS }, (_, slot) => (
                <div key={slot} className="sd-slot">
                  {STACK.map((s, ci) => {
                    const t = s.tools[slot];
                    return t ? (
                      <div key={s.need} className="sd-face" data-ci={ci}>
                        <div className="sd-face-in">
                          <Logo tool={t} />
                          <span className="sd-nm">{t.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={s.need} className="sd-face is-empty" data-ci={ci}>
                        <div className="sd-face-in">
                          <span className="rd-cut" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div
            className="sd-segs"
            role="group"
            aria-label="Jump to a need"
            style={{ '--sd-n': STACK.length } as React.CSSProperties}
          >
            {STACK.map((s, i) => (
              <button
                key={s.need}
                type="button"
                className="sd-seg"
                data-i={i}
                aria-label={`${s.short}: ${s.need}`}
                aria-current={i === 0 ? 'step' : undefined}
                tabIndex={i === 0 ? 0 : -1}
              >
                <span className="sd-seg-bar">
                  <span className="sd-seg-fill" />
                </span>
                <span className="sd-seg-label">{s.short}</span>
              </button>
            ))}
          </div>
          <div className="sd-foot">
            <span className="rd-label sd-now" aria-hidden="true">
              <b data-now-n>01</b>&nbsp; <span data-now-label>{STACK[0].short}</span>
            </span>
            <span className="rd-cue" aria-hidden="true">
              <span className="rd-label">Scroll</span>
              <span className="rd-cue-track" />
            </span>
          </div>
        </div>
      </div>

      <div className="sd-blade" aria-hidden="true" />
    </section>
  );
}

export default StackDeck;
