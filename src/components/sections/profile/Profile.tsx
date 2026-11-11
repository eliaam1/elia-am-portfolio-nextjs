'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { FADE_UP, RISE, rebuildOnReflow, splitLines } from '../../../lib/rise';
import { CAREER_LOG, PROFILE_BIO, PROFILE_STATEMENT, PROJECTS_DELIVERED, SERVICES } from './profileData';
import './profile.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** The EAM blade, tan(22.6deg). The "+" is cut in along it. */
const SLANT = 0.416;
const PLUS_HIDDEN = `polygon(0% 0%, 0% 0%, ${-SLANT * 100}% 100%, ${-SLANT * 100}% 100%)`;
const PLUS_SHOWN = `polygon(0% 0%, ${100 + SLANT * 100}% 0%, 100% 100%, ${-SLANT * 100}% 100%)`;

/**
 * When the hero's blade sweep is on, Profile is pulled up under the hero and
 * revealed by the band. Its intro must wait for the band, not for Profile's
 * own position (which passes "top 86%" while still covered). The sweep's
 * scroll range ends with the hero's bottom at the viewport bottom; the band
 * has cleared Profile at ~0.82 of it, which is the hero's bottom at ~128% of
 * the viewport (hero 260svh, Profile pulled up 100svh: see useBladeSweep).
 */
const AFTER_SWEEP = 'bottom 128%';
/** Where a row counts as "being read". */
const READING_LINE = 'top 55%';
const COMMIT_LINE = 'top 68%';
const SCRUB = 0.6;
const MOTION_OK = '(prefers-reduced-motion: no-preference)';

/**
 * 01 / Profile. Statement, bio and the career log drawn as a git graph, then
 * "What I do": 15+ held beside the services list.
 *
 * Active states (lit commit, active service) are data-on attributes toggled
 * by scroll and styled in CSS, so they run with or without motion. Movement
 * is GSAP, only when reduced motion is not requested.
 *
 * This component has no React state, so it never re-renders after mount and
 * the imperatively updated counter text is safe.
 */
export function Profile() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const all = (sel: string): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(sel));
      const commits = all('.pf-commit');
      const rows = all('.pf-svc');

      /* ---------- state: lit commits, active service ---------- */
      commits.forEach((li) =>
        ScrollTrigger.create({
          trigger: li,
          start: COMMIT_LINE,
          onEnter: () => li.toggleAttribute('data-on', true),
          onLeaveBack: () => li.toggleAttribute('data-on', false),
        })
      );

      const counter = root.querySelector<HTMLElement>('[data-svc-cur]');
      let active = -1;
      const setActive = (i: number) => {
        if (i === active) return;
        active = i;
        rows.forEach((r, j) => r.toggleAttribute('data-on', j === i));
        if (counter) counter.textContent = pad2(Math.max(i, 0) + 1);
      };
      // One trigger over the whole list, so a fast jump still lands on the right row.
      ScrollTrigger.create({
        trigger: root.querySelector('.pf-svc-list'),
        start: READING_LINE,
        end: 'bottom 55%',
        onUpdate: (s) => setActive(Math.min(rows.length - 1, Math.floor(s.progress * rows.length))),
        onLeaveBack: () => setActive(-1),
      });

      /* ---------- motion ---------- */
      const mm = gsap.matchMedia();
      // Rebuilt on font load / width change so the statement's line split stays true.
      mm.add(MOTION_OK, () => rebuildOnReflow(() => {
        const statement = root.querySelector<HTMLElement>('.pf-statement');
        if (!statement) return;
        // useBladeSweep turns the sweep on under this same media query whenever
        // the hero is present, so this does not depend on which effect ran first.
        const hero = document.getElementById('hero');
        const swept = Boolean(hero?.classList.contains('hero-sweep'));
        const introAt: ScrollTrigger.Vars = swept
          ? { trigger: hero, start: AFTER_SWEEP }
          : { trigger: statement, start: RISE.start };

        // Intro: eyebrow, the statement rising line by line, then the bio.
        const split = splitLines(statement, true);
        gsap
          .timeline({ scrollTrigger: introAt })
          .from(all('.pf-eyebrow'), { y: FADE_UP.y, autoAlpha: 0, duration: FADE_UP.duration, ease: FADE_UP.ease }, 0)
          .from(split.lines, { yPercent: RISE.yPercent, duration: RISE.duration, stagger: RISE.stagger, ease: RISE.ease }, 0.05)
          .from(all('.pf-bio'), { y: 28, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }, 0.45);
        // Then its words brighten as you read on.
        gsap.fromTo(
          split.words,
          { opacity: 0.16 },
          { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { ...introAt, endTrigger: statement, end: 'bottom 25%', scrub: true } }
        );

        // Career log: each commit types out (clip-path) as the graph reaches it.
        gsap.from('.pf-log', { y: 36, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.pf-log', start: 'top 96%', end: 'top 74%', scrub: SCRUB } });
        commits.forEach((li) => {
          gsap
            .timeline({ scrollTrigger: { trigger: li, start: 'top 90%', end: COMMIT_LINE, scrub: SCRUB } })
            .from(li.querySelector('.pf-node'), { scale: 0.5, autoAlpha: 0, ease: 'none' }, 0)
            .from(li.querySelectorAll('.pf-hash, .pf-year'), { autoAlpha: 0, ease: 'none' }, 0)
            .fromTo(li.querySelector('.pf-text'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none' }, 0.1);
        });

        // 15+: the digits rise out of their mask, then the + is cut in at the blade angle.
        gsap
          .timeline({ scrollTrigger: { trigger: '.pf-svcs', start: 'top 85%', end: 'top 35%', scrub: SCRUB } })
          .from('.pf-svcs-eyebrow', { autoAlpha: 0, y: 12, ease: 'none', duration: 0.3 }, 0)
          .from('.pf-num-digits', { yPercent: 102, ease: 'none', duration: 0.6 }, 0.05)
          .fromTo('.pf-num-plus', { clipPath: PLUS_HIDDEN }, { clipPath: PLUS_SHOWN, ease: 'none', duration: 0.35 }, 0.5)
          .from('.pf-num-cap', { autoAlpha: 0, y: 14, ease: 'none', duration: 0.3 }, 0.6)
          .from('.pf-svcs-count', { autoAlpha: 0, ease: 'none', duration: 0.2 }, 0.8);

        // Services: each name rises out of its own line as the row enters
        // (the wrapper moves; .pf-svc-name keeps its CSS hover transform).
        rows.forEach((row) => {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: 'top 94%', end: 'top 74%', scrub: SCRUB } })
            .from(row.querySelector('.pf-svc-rise'), { yPercent: 105, ease: 'none' }, 0)
            .from(row.querySelector('.pf-svc-idx'), { autoAlpha: 0, ease: 'none' }, 0.2);
        });

        return () => split.revert();
      }));
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="pf">
      <p className="rd-label pf-eyebrow">
        <b>01</b> &nbsp;&mdash;&nbsp; Profile
      </p>
      <h2 className="pf-statement">
        {PROFILE_STATEMENT.before}
        <span className="pf-hl">{PROFILE_STATEMENT.highlight}</span>
        {PROFILE_STATEMENT.after}
      </h2>

      <div className="pf-bio-row">
        <div>
          {PROFILE_BIO.map((p) => (
            <p key={p} className="pf-bio">
              {p}
            </p>
          ))}
        </div>

        <div className="pf-log">
          <div className="pf-log-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>~/elia &nbsp;git log --graph --career</span>
          </div>
          <ol aria-label="Career timeline">
            {CAREER_LOG.map((c) => (
              <li key={c.hash} className={`pf-commit${c.hash === 'HEAD' ? ' is-head' : ''}`}>
                <span className="pf-node" aria-hidden="true" />
                <span className="pf-hash" aria-hidden="true">
                  {c.hash}
                </span>
                <span className="pf-year">{c.year}</span>
                <span className="pf-text">
                  <b>{c.title}</b>
                  {c.detail ? <small>{c.detail}</small> : <span className="pf-caret" aria-hidden="true" />}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="pf-svcs">
        <div>
          <div className="pf-svcs-sticky">
            <p className="rd-label pf-svcs-eyebrow">
              <b>Services</b>
            </p>
            <p className="pf-num">
              <span className="sr-only">{PROJECTS_DELIVERED}+ projects delivered</span>
              <span className="pf-num-mask">
                <span className="pf-num-digits" aria-hidden="true">
                  {PROJECTS_DELIVERED}
                </span>
              </span>
              <span className="pf-num-plus" aria-hidden="true">
                +
              </span>
            </p>
            <p className="pf-num-cap" aria-hidden="true">
              Projects delivered
            </p>
            <p className="rd-label pf-svcs-count" aria-hidden="true">
              <b data-svc-cur>01</b> / {pad2(SERVICES.length)}
            </p>
          </div>
        </div>
        <ol className="pf-svc-list" aria-label="Services">
          {SERVICES.map((s, i) => (
            <li key={s} className="pf-svc">
              <span className="pf-svc-idx" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <span className="pf-svc-mask">
                <span className="pf-svc-rise">
                  <span className="pf-svc-name">{s}</span>
                </span>
              </span>
              <span className="pf-svc-cut" aria-hidden="true" />
              <span className="pf-svc-rule" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default Profile;
