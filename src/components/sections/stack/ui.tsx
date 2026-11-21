import type { CSSProperties, ReactNode } from 'react';
import type { Tool } from './stackData';

/*
 * Made-up interfaces for the Stack posters. Stack never shows the client work
 * that Selected Work shows, so the site, the store, its products and the apps
 * are drawn here. All of it is decorative (aria-hidden by its poster): the
 * tool lists carry the content for screen readers.
 */

type Lit = { techs: string; lab?: string };
/** Marks something a tool powers: it lights (and shows `lab`) while that tool is active. */
export const lit = ({ techs, lab }: Lit) => ({ 'data-techs': techs, 'data-lab': lab });

/** A tool's brand mark in its brand colour, on a light tile; a text badge where no mark exists. */
export function Logo({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <span className="lg" aria-hidden="true" style={{ '--brand': tool.brand } as CSSProperties}>
      {Icon ? <Icon /> : <b className="mono">{tool.mono}</b>}
    </span>
  );
}

export function Phone({ className = '', children, ...rest }: { className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div className={`ph ${className}`} {...rest}>
      <div className="ph-scr">{children}</div>
    </div>
  );
}

/** A real 3D object in CSS: the wireframe cube the Three.js credit points at. */
export function Cube() {
  return (
    <span className="cube">
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

/* product art: plain line drawings on soft tiles, no real products */
const PRODUCTS = [
  { name: 'Trail bottle', bg: '#e3e8d6', d: ['M10 3h4v3l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z', 'M8 13h8'] },
  { name: 'Day pack', bg: '#e8e4da', d: ['M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v12H5z', 'M9 6V4a3 3 0 0 1 6 0v2M8 15h8v4H8z'] },
] as const;

export function ProductTile({ n, tag }: { n: 0 | 1; tag?: string }) {
  const p = PRODUCTS[n];
  return (
    <span className="pt" style={{ '--pt': p.bg } as CSSProperties}>
      {tag && <span className="tag">{tag}</span>}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {p.d.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}

/** A made-up client website, mid-build. `m` = its phone layout. */
export function SiteMock({ m = false }: { m?: boolean }) {
  return (
    <div className={`site${m ? ' is-m' : ''}`}>
      <div className="st-nav">
        <span className="st-logo">
          <i className="rd-cut" />
          Northline
        </span>
        <span className="st-links">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="st-btn">Contact</span>
      </div>
      <div className="st-hero">
        <div className="st-copy">
          <p className="st-k">Studio · Since 2025</p>
          <p className="st-h">Made to be remembered.</p>
          <p className="st-p">
            <i />
            <i />
          </p>
          <span className="st-cta">Start a project →</span>
        </div>
        <div className="st-obj">
          <Cube />
        </div>
      </div>
      <div className="st-cards">
        {[0, 1, 2].map((k) => (
          <div key={k}>
            <i />
            <b />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

const ORDERS = [
  ['2041', 'Zahle · 3 items', 'On the way', true],
  ['2040', 'Jounieh · 1 item', 'Packed', false],
  ['2039', 'Beirut · 5 items', 'Delivered', false],
  ['2038', 'Tyre · 2 items', 'Delivered', false],
] as const;

export function AppList() {
  return (
    <div className="app">
      <p className="app-h">Today&apos;s orders</p>
      <p className="app-sub">
        <span className="cnt" data-to="12">
          12
        </span>{' '}
        to deliver
      </p>
      {ORDERS.map(([id, where, status, go]) => (
        <div key={id} className="app-row">
          <span>
            Order {id}
            <small>{where}</small>
          </span>
          <b className={`pill${go ? ' is-go' : ''}`}>{status}</b>
        </div>
      ))}
      <div className="app-nav">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function AppMap() {
  return (
    <div className="app">
      <p className="app-h">Order 2041</p>
      <p className="app-sub">Driver is 8 min away</p>
      <div className="app-map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M10 85 C 30 70, 25 45, 50 45 S 75 25, 88 14" fill="none" stroke="#bde66a" strokeWidth="2.4" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          <circle cx="88" cy="14" r="3.5" fill="#bde66a" />
          <circle cx="10" cy="85" r="3" fill="#f1f2ec" />
        </svg>
      </div>
      <div className="app-row">
        <span>
          Call driver
          <small>Rami · Van 3</small>
        </span>
      </div>
      <div className="app-nav">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

/* the store's checkout story: three phone screens */
export function ScreenProduct() {
  return (
    <div className="cq">
      <p className="row">
        <span className="bn">Fieldhouse</span>
        <span className="pill2">Cart 1</span>
      </p>
      <ProductTile n={1} tag="−30%" />
      <p className="cq-h">Day pack</p>
      <p>
        $48 <s>$68</s>
      </p>
      <span className="btn">Add to cart</span>
    </div>
  );
}

export function ScreenCart() {
  return (
    <div className="cq">
      <p className="row">
        <span className="bn">Your cart</span>
        <span>2</span>
      </p>
      <div className="line">
        <ProductTile n={1} />
        <span>Day pack</span>
        <b>$48</b>
      </div>
      <div className="line">
        <ProductTile n={0} />
        <span>Trail bottle</span>
        <b>$24</b>
      </div>
      <span className="chipx lit" {...lit({ techs: 'php', lab: 'PHP · price rules' })}>
        −30% applied
      </span>
      <span className="btn dark lit" {...lit({ techs: 'shopify', lab: 'Shopify checkout' })}>
        Checkout · $72
      </span>
    </div>
  );
}

export function ScreenDone() {
  return (
    <div className="cq">
      <span className="ok">✓</span>
      <p className="cq-h">Order placed.</p>
      <ul>
        <li>
          <b>Paid · $72</b>Card ending 4242
        </li>
        <li className="lit" {...lit({ techs: 'woocommerce', lab: 'Same on WooCommerce' })}>
          <b>Stock updated</b>Day pack 12 → 11
        </li>
      </ul>
    </div>
  );
}
