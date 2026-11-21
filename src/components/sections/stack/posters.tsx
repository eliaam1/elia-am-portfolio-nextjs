import type { CSSProperties } from 'react';
import { STACK, toolById, type Need, type Tool } from './stackData';
import { AppList, AppMap, Cube, Logo, Phone, ScreenCart, ScreenDone, ScreenProduct, SiteMock, lit } from './ui';

const pad2 = (n: number): string => String(n).padStart(2, '0');
const N = STACK.length;

/** Eyebrow, headline (its last word carries the scribble and the lime stop), outcome. */
function PosterCopy({ need, i }: { need: Need; i: number }) {
  const head = need.need.slice(0, need.need.length - need.keyword.length);
  return (
    <div className="pn-copy">
      <p className="pn-eye">
        <b>{pad2(i + 1)}</b> / {pad2(N)} &nbsp;—&nbsp; {need.short}
      </p>
      <h3 id={`pn-h-${need.id}`} className="pn-h">
        {head}
        <span className="mk">
          {need.keyword}
          <span className="text-app-accent">.</span>
        </span>
      </h3>
      {/* drawn on by the hook; shapes are rescaled to the key word's real box */}
      <svg className="mark" aria-hidden="true">
        {need.scribble.d.split(' M').map((seg, k) => (
          <path key={seg} data-d={k ? `M${seg}` : seg} pathLength={1} />
        ))}
      </svg>
      <p className="pn-out">{need.outcome}</p>
    </div>
  );
}

/** Round sticker: the poster's number, its need on a ring that turns with the scroll. */
function Sticker({ need, i }: { need: Need; i: number }) {
  const id = `stk-${need.id}`;
  return (
    <div className="stk" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <path id={id} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <g className="stk-ring">
          <text>
            <textPath href={`#${id}`} textLength="228" lengthAdjust="spacing">
              {`${need.short} · ${pad2(i + 1)} / ${pad2(N)} · ${need.short} · `}
            </textPath>
          </text>
        </g>
      </svg>
      <b>{pad2(i + 1)}</b>
    </div>
  );
}

/** A tool's name as letters that roll on hover; the plain name stays for screen readers. */
function RollName({ name }: { name: string }) {
  return (
    <span className="tk-n">
      <span className="sr-only">{name}</span>
      <span className="roll" aria-hidden="true">
        {[...name].map((c, k) => (
          <span key={k} className="ch" style={{ '--k': k } as CSSProperties}>
            {c}
          </span>
        ))}
      </span>
    </span>
  );
}

/** The tools, set as type: name always shown, its plain-language line under it. */
function ToolList({ need, cols2 = false }: { need: Need; cols2?: boolean }) {
  return (
    <div className="bt-wrap">
      <p className="hint-c">
        <span className="t-hover">Hover a tool</span>
        <span className="t-touch">Tap a tool</span>
        &nbsp;to see it in the picture
      </p>
      <ul className={`bt${cols2 ? ' cols2' : ''}`} aria-label={`Built with, for: ${need.short}`}>
        {need.tools.map((t) => (
          <li key={t.id}>
            {/* a toggle: hover/focus previews, a press keeps the tool lit (aria-pressed) */}
            <button type="button" className="tk" data-tech={t.id} aria-pressed="false">
              <Logo tool={t} />
              <span>
                <RollName name={t.name} />
                <span className="tk-d">{t.desc}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 01 · an exploded view of a site being built: structure, style, motion ---------- */
const WIRE = [[4, 4, 92, 9], [4, 20, 50, 40], [60, 20, 36, 46], [4, 70, 28, 24], [36, 70, 28, 24], [68, 70, 28, 24]] as const;
function Exploded() {
  return (
    <div className="ex pic" aria-hidden="true">
      <div className="ex-stack">
        <div className="ex-l ex-wire" data-techs="nextjs react typescript javascript">
          {WIRE.map(([l, t, w, h]) => (
            <i key={`${l}-${t}`} style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }} />
          ))}
        </div>
        <div className="ex-l ex-site" data-techs="tailwindcss">
          <SiteMock />
        </div>
        <div className="ex-l ex-motion" data-techs="gsap threejs">
          <svg viewBox="0 0 160 100" preserveAspectRatio="none">
            <path d="M8 88 C 40 40, 70 90, 100 46 S 140 20, 152 12" fill="none" stroke="#bde66a" strokeWidth="1.2" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <circle cx="152" cy="12" r="2.4" fill="#bde66a" />
          </svg>
          <span className="st-obj">
            <Cube />
          </span>
        </div>
      </div>
      <p className="ex-cap ex-cap-3" data-techs="gsap threejs">
        <b>03</b> Motion · GSAP, Three.js
      </p>
      <p className="ex-cap ex-cap-2" data-techs="tailwindcss">
        <b>02</b> Style · Tailwind CSS
      </p>
      <p className="ex-cap ex-cap-1" data-techs="nextjs react typescript javascript">
        <b>01</b> Structure · Next.js, React
      </p>
    </div>
  );
}

/* ---------- 02 · the checkout story: browse → cart → paid ---------- */
function Storyboard() {
  return (
    <div className="story pic" aria-hidden="true">
      {/* slots take the scroll drift; the phones inside take the entrance and the hover fan */}
      <div className="slot sp-a">
        <Phone className="lit" {...lit({ techs: 'liquid wordpress elementor', lab: 'Liquid · product page' })}>
          <ScreenProduct />
        </Phone>
      </div>
      <div className="slot sp-b">
        <Phone>
          <ScreenCart />
        </Phone>
      </div>
      <div className="slot sp-c">
        <Phone>
          <ScreenDone />
        </Phone>
      </div>
      <p className="story-n sn-a">
        <b>01</b> Browse
      </p>
      <p className="story-n sn-b">
        <b>02</b> Cart
      </p>
      <p className="story-n sn-c">
        <b>03</b> Paid
      </p>
      <p className="toast">
        <i />
        <span>
          New order ·{' '}
          <span className="cnt" data-to="72" data-pre="$">
            $72
          </span>
          <small>Fieldhouse admin</small>
        </span>
      </p>
    </div>
  );
}

/* ---------- 03 · system map: the phone, the server in between, where the data lives ---------- */
const ROUTES = [['GET', '/orders/today', '200'], ['POST', '/orders/2041/status', '200'], ['PUSH', 'driver.location', 'live'], ['AUTH', 'staff · drivers', 'ok']] as const;
const ROWS = [['2041', 'On the way', 'Zahle'], ['2040', 'Packed', 'Jounieh'], ['2039', 'Delivered', 'Beirut']] as const;
function SystemMap() {
  return (
    <div className="map pic" aria-hidden="true">
      <div className="col" data-techs="reactnative kotlin android">
        <p className="cap">
          <b>01</b> On the phone
        </p>
        <div className="col-ph">
          <Phone>
            <div className="cq2">
              <AppList />
            </div>
          </Phone>
          <Phone>
            <div className="cq2">
              <AppMap />
            </div>
          </Phone>
        </div>
      </div>
      <div className="col api" data-techs="aspnetcore csharp nodejs">
        <p className="cap">
          <b>02</b> In between · the server
        </p>
        {ROUTES.map(([verb, path, code]) => (
          <p key={path}>
            <b>{verb}</b> {path} <span>{code}</span>
          </p>
        ))}
      </div>
      <div className="col tbl2" data-techs="sqlserver postgresql">
        <p className="cap">
          <b>03</b> Where the data lives
        </p>
        <div>
          <span>Order</span>
          <span>Status</span>
          <span>City</span>
        </div>
        {ROWS.map((r) => (
          <div key={r[0]}>
            {r.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        ))}
      </div>
      <i className="map-ln map-ln-1" />
      <i className="map-ln map-ln-2" />
    </div>
  );
}

/* ---------- 04 · an automation's run log, next to the conversation it handled ---------- */
const LOG = [
  ['09:41', 'in', 'New WhatsApp message', 'with a photo'],
  ['09:41', 'gemini', 'Gemini', 'reads the photo: layer feed, 2 bags'],
  ['09:41', 'claude', 'Claude', 'understands: deliver to Zahle tomorrow'],
  ['09:41', 'mcp', 'MCP', 'checks stock: 14 in the warehouse'],
  ['09:42', 'python', 'Python', 'adds the order and the invoice'],
  ['09:42', 'gpt', 'GPT', 'drafts the reply'],
  ['09:42', 'out', 'Reply sent', 'to the customer'],
] as const;
function RunLog() {
  const code = toolById('claudecode') as Tool;
  return (
    <div className="run pic">
      <div className="log-wrap">
        <i className="rail" aria-hidden="true">
          <i className="rail-fill" />
          <b className="rail-dot" />
        </i>
        <ol className="log" aria-label="An automation, step by step">
          {LOG.map(([time, id, title, rest]) => {
            const t = toolById(id);
            // rows answer to hover; keyboards reach the same tools in the list above
            return (
              <li key={id} {...(t ? { 'data-tech': id } : {})}>
                <time dateTime={time}>{time}</time>
                {t ? <Logo tool={t} /> : <span className="nd-ic">{id.toUpperCase()}</span>}
                <span>
                  <b>{title}</b> {rest}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="wa">
        <p className="wa-h" aria-hidden="true">
          <span>WhatsApp · Feed store</span>
          <span>Today</span>
        </p>
        <p className="in">
          <span className="sr-only">Customer: </span>
          Hi, do you have 2 bags of layer feed? Delivered to Zahle.
          <span className="ph-img" aria-hidden="true">
            Photo
          </span>
        </p>
        <p className="out">
          <span className="sr-only">Automatic reply: </span>
          Yes, 14 in stock. 2 bags are $36, delivered tomorrow in Zahle. Shall I confirm?
        </p>
        <p className="badge" data-tech="claudecode">
          <Logo tool={code} />
          Built and tested with Claude Code
        </p>
      </div>
    </div>
  );
}

const VISUAL = { web: Exploded, store: Storyboard, apps: SystemMap, ai: RunLog } as const;

/** One poster: sticker, copy, its picture and its tools. Light posters: store and AI. */
export function Poster({ need, i }: { need: Need; i: number }) {
  const Visual = VISUAL[need.id];
  return (
    <article className={`pn pn-${need.id}`} style={{ '--i': i } as CSSProperties} aria-labelledby={`pn-h-${need.id}`}>
      <div className="pn-in">
        <Sticker need={need} i={i} />
        <PosterCopy need={need} i={i} />
        <Visual />
        <ToolList need={need} cols2={need.id !== 'store'} />
      </div>
      <i className="pn-shade" aria-hidden="true" />
    </article>
  );
}
