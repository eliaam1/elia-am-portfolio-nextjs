'use client';

import { useRef } from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { CONTACT } from '../../../config/constants';
import { useDimension } from './useDimension';
import { WORK_PROJECTS, type WorkProject } from './workData';
import './work.css';

const pad2 = (n: number): string => String(n).padStart(2, '0');
const RING_TEXT = 'START A PROJECT · WHATSAPP · CALL · START A PROJECT · WHATSAPP · CALL ·';

interface ProjectProps {
  p: WorkProject;
  i: number;
}

function Tags({ p }: { p: WorkProject }) {
  return (
    <ul className="wd-tags" aria-label="Services">
      {p.services.map((s) => (
        <li key={s} className="wd-tag">
          {s}
        </li>
      ))}
    </ul>
  );
}

function VisitButton({ p, decorative = false }: { p: WorkProject; decorative?: boolean }) {
  return (
    <a className="wd-btn" href={p.url} target="_blank" rel="noopener noreferrer" data-cursor-label="Visit" data-cursor-fill="" tabIndex={decorative ? -1 : undefined}>
      Visit site <ArrowUpRight aria-hidden="true" />
      <span className="sr-only"> (opens {p.name} in a new tab)</span>
    </a>
  );
}

/**
 * The info that appears beside each 3D composition. Hidden from assistive tech and
 * the tab order: it is only on screen for part of the scroll, and the list below
 * carries the same content for screen readers and keyboards.
 */
function ProjectOverlay({ p, i }: ProjectProps) {
  return (
    <article className="wd-po" aria-hidden="true">
      <p className="wd-meta">
        <b>{pad2(i + 1)}</b> &nbsp;{p.kind} · {p.year}
      </p>
      <p className="wd-po-name">
        {p.nameLines.map((l) => (
          <span key={l} className="wd-ln">
            {l}
          </span>
        ))}
      </p>
      <p className="wd-line">{p.line}</p>
      <Tags p={p} />
      <div className="wd-row">
        <VisitButton p={p} decorative />
      </div>
    </article>
  );
}

/** The same projects as a plain list: reduced motion, no WebGL, or before the scene loads. */
function StaticList() {
  return (
    <div className="wd-static">
      <div className="wd-static-head">
        <p className="rd-label">
          <b>02</b> &nbsp;&mdash;&nbsp; Work
        </p>
        <h2 id="wd-heading" className="wd-static-title">
          Selected work<span className="text-app-accent">.</span>
        </h2>
      </div>
    <ol className="wd-static-list">
      {WORK_PROJECTS.map((p, i) => (
        <li key={p.id} className="wd-static-item">
          <p className="wd-meta">
            <b>{pad2(i + 1)}</b> &nbsp;{p.kind} · {p.year}
          </p>
          <h3 className="wd-static-name">{p.name}</h3>
          <p className="wd-line">{p.line}</p>
          <Tags p={p} />
          <img src={p.desktop} alt={`${p.name} website`} width={1440} height={900} loading="lazy" decoding="async" className="wd-static-shot" />
          <VisitButton p={p} />
        </li>
      ))}
    </ol>
    </div>
  );
}

/**
 * 02 / Work — "The Digital Dimension".
 *
 * Scroll drives a camera through a 3D corridor of project compositions
 * (three.js), with every word as real HTML over the canvas. See useDimension
 * for the choreography and scene/ for the 3D world. Contact in the finale is
 * WhatsApp and phone only.
 */
export function WorkDimension() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useDimension(rootRef, stageRef);

  return (
    <section ref={rootRef} className="wd" aria-labelledby="wd-heading" data-cursor-label="Scroll">
      {/* the hook mounts a fresh <canvas> in here for each run */}
      <div ref={stageRef} className="wd-stage" aria-hidden="true" />
      <div className="wd-ui">
        <div className="wd-open">
          <div className="wd-open-in">
            {/* decorative: the real heading is in the list below, read in every mode */}
            <p className="wd-title" aria-hidden="true">
              <span className="wd-title-ln">Selected</span>
              <span className="wd-title-ln">
                work<span className="text-app-accent">.</span>
              </span>
            </p>
            <p className="rd-label wd-sub">
              <b>02</b> &nbsp;&mdash;&nbsp; Work · scroll to enter
            </p>
          </div>
        </div>

        {WORK_PROJECTS.map((p, i) => (
          <ProjectOverlay key={p.id} p={p} i={i} />
        ))}

        <div className="wd-portal">
          <svg className="wd-ring" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id="wd-ring-path" d="M100,100 m-93,0 a93,93 0 1,1 186,0 a93,93 0 1,1 -186,0" />
            </defs>
            <g className="wd-spin">
              <text>
                <textPath href="#wd-ring-path" textLength="582" lengthAdjust="spacing">
                  {RING_TEXT}
                </textPath>
              </text>
            </g>
          </svg>
          <div className="wd-portal-in">
            <p className="wd-pill">
              <span className="wd-pulse" aria-hidden="true" />
              Available for remote work
            </p>
            <h3 className="wd-portal-title">
              Your project, next<span className="text-app-accent">.</span>
            </h3>
            <p className="wd-portal-sub">Tell me what you need. WhatsApp or call, whichever is easier for you.</p>
            <div className="wd-ctas">
              <a className="wd-btn" href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" data-cursor-label="WhatsApp" data-cursor-fill="">
                <SiWhatsapp aria-hidden="true" className="wd-wa" />
                WhatsApp me
              </a>
              <a className="wd-btn is-ghost" href={CONTACT.phoneHref} data-cursor-label="Call" data-cursor-fill="">
                <Phone aria-hidden="true" />
                {CONTACT.phoneDisplay}
              </a>
            </div>
          </div>
        </div>

        <div className="wd-hud" aria-hidden="true">
          <span className="wd-hud-i">
            <b data-hud-i>01</b> / {pad2(WORK_PROJECTS.length)}
          </span>
          <span className="wd-hud-n" data-hud-n>
            {WORK_PROJECTS[0].name}
          </span>
          <span className="wd-hud-line">
            <i data-hud-l />
          </span>
        </div>
      </div>
      {/* shown while the scene loads, so a fast scroller sees a cue, not a void;
          the dot sits exactly where the Statement's light hands over */}
      <div className="wd-veil" aria-hidden="true">
        <span className="wd-veil-dot" />
        <span className="wd-veil-txt">Loading work</span>
      </div>
      <StaticList />
    </section>
  );
}

export default WorkDimension;
