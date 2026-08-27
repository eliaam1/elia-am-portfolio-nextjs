'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  SiReact,
  SiTypescript,
  SiShopify,
  SiTailwindcss,
  SiDotnet,
  SiNodedotjs,
  SiPostgresql,
  SiPhp,
  SiGit,
  SiFigma,
  SiFramer,
} from 'react-icons/si';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  MQ,
  addMotionTiers,
  GSAP_EASE,
  DUR,
  STAGGER,
  REVEAL_START,
  ORBIT_GEOMETRY,
  ORBIT_BOX,
} from '../../config/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export type SkillCategory = 'Frontend' | 'Backend' | 'AI & Tools' | 'Design';

export interface OrbitSkillItem {
  id: string;
  label: string;
  category: SkillCategory;
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}

interface OrbitConfig extends OrbitSkillItem {
  orbitRadius: number;
  size: number;
  speed: number;
  phaseShift: number;
  ringIndex: number;
}

const ALL_SKILLS: OrbitSkillItem[] = [
  // Inner Orbit (Core Frontend & Shopify)
  { id: 'react', label: 'React / Next.js', category: 'Frontend', color: '#61DAFB', icon: SiReact },
  { id: 'typescript', label: 'TypeScript', category: 'Frontend', color: '#3178C6', icon: SiTypescript },
  { id: 'shopify', label: 'Shopify / Liquid', category: 'Frontend', color: '#95BF47', icon: SiShopify },
  { id: 'tailwind', label: 'Tailwind CSS', category: 'Frontend', color: '#06B6D4', icon: SiTailwindcss },

  // Middle Orbit (Backend, APIs & Databases)
  { id: 'dotnet', label: '.NET Core / C#', category: 'Backend', color: '#512BD4', icon: SiDotnet },
  { id: 'nodejs', label: 'Node.js / Express', category: 'Backend', color: '#339933', icon: SiNodedotjs },
  { id: 'sql', label: 'SQL Server & Postgres', category: 'Backend', color: '#CC292B', icon: SiPostgresql },
  { id: 'php', label: 'PHP / WordPress', category: 'Backend', color: '#777BB4', icon: SiPhp },

  // Outer Orbit (AI Workflows, MCP & Design)
  { id: 'ai', label: 'AI & MCP Workflows', category: 'AI & Tools', color: '#0F3DDE', icon: Sparkles },
  { id: 'git', label: 'Git / GitHub', category: 'AI & Tools', color: '#F05032', icon: SiGit },
  { id: 'figma', label: 'Figma & Stitch UI', category: 'Design', color: '#F24E1E', icon: SiFigma },
  { id: 'framer', label: 'Framer Animation', category: 'Design', color: '#0055FF', icon: SiFramer },
];

/**
 * Ring layers. Radii come from ORBIT_GEOMETRY, which is also what ORBIT_BOX
 * is derived from — so changing a radius resizes the container automatically
 * instead of silently pushing nodes outside it.
 */
const ORBIT_LAYERS = [
  { radius: ORBIT_GEOMETRY.rings[0], speed: 0.8, delay: 0, glow: 'rgba(15, 61, 222, 0.22)' },
  { radius: ORBIT_GEOMETRY.rings[1], speed: -0.5, delay: 1, glow: 'rgba(97, 218, 251, 0.2)' },
  { radius: ORBIT_GEOMETRY.rings[2], speed: 0.35, delay: 2, glow: 'rgba(81, 43, 212, 0.2)' },
];

const SKILLS_PER_RING = 4;

const ORBIT_CONFIGS: OrbitConfig[] = ALL_SKILLS.map((skill, idx) => {
  const ringIndex = Math.floor(idx / SKILLS_PER_RING);
  const ring = ORBIT_LAYERS[ringIndex] || ORBIT_LAYERS[0];
  const indexInRing = idx % SKILLS_PER_RING;

  return {
    ...skill,
    orbitRadius: ring.radius,
    size: ORBIT_GEOMETRY.nodeSize,
    speed: ring.speed,
    phaseShift: (indexInRing * (2 * Math.PI)) / SKILLS_PER_RING,
    ringIndex,
  };
});

/**
 * A single orbiting node.
 *
 * Transform ownership is split deliberately:
 *  - the OUTER element's `transform` is written every frame by the parent's
 *    gsap.ticker callback (orbital position) and by nothing else;
 *  - the INNER element carries the entrance tween and all hover styling.
 *
 * Before this split, GSAP's entrance animated `y` on the same element that
 * carried the orbital `translate(...)`, so the two clobbered each other.
 */
const OrbitingSkillItemView = memo(
  ({
    config,
    nodeRef,
    onTouchToggle,
  }: {
    config: OrbitConfig;
    nodeRef: (el: HTMLDivElement | null) => void;
    /** Touch taps have to drive the pause explicitly; there is no hover. */
    onTouchToggle: (open: boolean) => void;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { size, label, color, icon: Icon } = config;

    // A tap is not a hover. Without this, a touch user can reach the
    // tooltip only via whatever mouseenter the browser chooses to emulate,
    // and the orbit keeps turning under their finger.
    const handlePointerDown = (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const next = !isHovered;
      setIsHovered(next);
      onTouchToggle(next);
    };

    return (
      <div
        ref={nodeRef}
        className="orbit-node absolute top-1/2 left-1/2"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          // Starting transform. Overwritten each frame on desktop; on mobile
          // and under reduced motion this static position is the final one.
          transform: `translate(-50%, -50%) translate(${
            Math.cos(config.phaseShift) * config.orbitRadius
          }px, ${Math.sin(config.phaseShift) * config.orbitRadius}px)`,
          zIndex: isHovered ? 30 : 10,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
      >
        <div
          className={`
            orbit-node-inner relative w-full h-full p-2 bg-app-surface/90 backdrop-blur-md
            border border-app-border rounded-full flex items-center justify-center
            transition-[scale,border-color,box-shadow] duration-300 cursor-pointer select-none
            ${isHovered ? 'scale-125 border-app-accent shadow-2xl' : 'shadow-md'}
          `}
          style={{
            boxShadow: isHovered ? `0 0 25px ${color}60, 0 0 50px ${color}30` : undefined,
          }}
        >
          <Icon
            size={isHovered ? 22 : 18}
            color={isHovered ? color : 'currentColor'}
            className="transition-opacity duration-200"
          />

          {/* Hover Tooltip Card. This renders OUTSIDE the orbit box, which
              is one of the reasons the container must not clip overflow. */}
          {isHovered && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-app-surface/95 border border-app-border backdrop-blur-md rounded-lg text-xs font-semibold text-app-text-primary whitespace-nowrap pointer-events-none shadow-xl flex items-center gap-1.5 z-40">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          )}
        </div>
      </div>
    );
  }
);
OrbitingSkillItemView.displayName = 'OrbitingSkillItemView';

const GlowingOrbitRing = memo(({ radius, color, delay }: { radius: number; color: string; delay: number }) => {
  return (
    <div
      className="orbit-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
    >
      {/*
        The entrance scales THIS element rather than .orbit-ring above it,
        because the parent carries Tailwind centring translates and GSAP
        writing `transform` there would wipe them out. It also animates
        `scale` only — `animate-pulse` owns opacity, and two owners of one
        property is a fight nobody wins.
      */}
      <div
        className="orbit-ring-glow absolute inset-0 rounded-full animate-pulse"
        style={{
          border: `1px dashed var(--color-border)`,
          boxShadow: `0 0 30px ${color}`,
          animationDuration: '4s',
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
});
GlowingOrbitRing.displayName = 'GlowingOrbitRing';

export const OrbitingSkills: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Array<HTMLDivElement | null>>([]);

  // Hover pause is a ref, not state: pausing must not re-render 12 children.
  const pausedRef = useRef(false);

  const registerNode = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      nodeEls.current[index] = el;
    },
    []
  );

  // Stable, so the memoised node views do not re-render when it is passed.
  const setPausedFromTouch = useCallback((open: boolean) => {
    pausedRef.current = open;
  }, []);

  /* ------------------------------------------------------------------ *
   * Fit-to-column scaling.
   *
   * This is the real fix for "there is a square limiting it". The orbit is
   * authored at ORBIT_BOX — a size DERIVED from the outermost ring plus
   * half a node plus clearance — so no node can sit outside its own
   * container by construction. Whatever column it lands in, one uniform
   * downscale makes the whole system fit.
   *
   * What it replaces: two hardcoded breakpoint sizes (300px / 480px) that
   * matched neither the ring geometry (which needed 504px) nor the grid
   * column (which supplied 413px), wrapped in an overflow-hidden that hid
   * the evidence.
   *
   * Scale down only — the orbit is never blown up past its authored size.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const fit = fitRef.current;
    const box = boxRef.current;
    if (!fit || !box) return;

    let lastWidth = -1;

    const apply = (available: number) => {
      const width = available || ORBIT_BOX;
      // Guard the write: we set this element's height below, which fires the
      // observer again. Without this the two would ping-pong.
      if (Math.abs(width - lastWidth) < 0.5) return;
      lastWidth = width;

      const scale = Math.min(1, width / ORBIT_BOX);
      box.style.transform = `translateX(-50%) scale(${scale})`;
      // Collapse the reserved height to match, or a downscaled orbit leaves
      // a band of dead space underneath itself.
      fit.style.height = `${ORBIT_BOX * scale}px`;
      ScrollTrigger.refresh();
    };

    apply(fit.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) apply(entry.contentRect.width);
    });
    observer.observe(fit);

    return () => observer.disconnect();
  }, []);

  /* ------------------------------------------------------------------ *
   * Orbit motion.
   *
   * DESKTOP: a single gsap.ticker callback writes each node's transform
   *   directly to the DOM, plus a scroll-coupled rotation offset.
   * MOBILE / REDUCED: no loop at all. Nodes keep the static positions
   *   rendered in their inline style.
   *
   * This replaces a requestAnimationFrame loop that called setTime() every
   * frame — a full React re-render of this component and all 12 children,
   * 60 times a second, running unconditionally once the section had been
   * scrolled past (including while the user was reading other sections, and
   * on mobile). It was the largest main-thread cost on the page.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();

      /**
       * Entrance. Reads centre-outward — core, then rings unfurling, then
       * each node popping in on the ring it belongs to — so the graphic
       * assembles as one system instead of twelve independent fades.
       *
       * Runs on every branch, so nodes are never left hidden.
       */
      const playEntrance = () => {
        const rings = gsap.utils.toArray<HTMLElement>('.orbit-ring-glow');
        const inners = gsap.utils.toArray<HTMLElement>('.orbit-node-inner');
        const core = coreRef.current;

        const tl = gsap.timeline({
          defaults: { ease: GSAP_EASE.snap },
          scrollTrigger: { trigger: container, start: REVEAL_START, once: true },
        });

        if (core) {
          tl.fromTo(core, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5 }, 0);
        }
        // Scale only. `animate-pulse` owns these elements' opacity.
        tl.fromTo(rings, { scale: 0.5 }, { scale: 1, duration: 0.75, stagger: 0.1 }, 0.08);
        tl.fromTo(
          inners,
          { opacity: 0, scale: 0.3 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: STAGGER.tight },
          0.26
        );

        return tl;
      };

      // Every width, motion allowed.
      //
      // The orbit loop used to be desktop-only for battery reasons. It runs
      // everywhere now, and what makes that affordable is the on-screen gate
      // below: the ticker returns immediately unless the section is actually
      // in the viewport, so a phone spends frames on this only while the
      // reader is looking at it.
      addMotionTiers(mm, () => {
        playEntrance();

        // Scroll-coupled twist: scrolling through the section rotates the
        // rings, so the graphic reacts to the reader rather than just looping.
        const scrollState = { twist: 0 };
        gsap.to(scrollState, {
          twist: ORBIT_GEOMETRY.scrollTwist,
          ease: GSAP_EASE.scrub,
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        });

        // Only spend frames while the section is actually on screen.
        let onScreen = false;
        const visibility = ScrollTrigger.create({
          trigger: container,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            onScreen = self.isActive;
          },
        });

        let elapsed = 0;
        const tick = (_time: number, deltaMs: number) => {
          if (!onScreen || pausedRef.current) return;
          elapsed += deltaMs / 1000;

          for (let i = 0; i < ORBIT_CONFIGS.length; i++) {
            const el = nodeEls.current[i];
            if (!el) continue;

            const cfg = ORBIT_CONFIGS[i];
            // Ring direction alternates via the sign of `speed`, so the twist
            // reads as counter-rotation between adjacent rings.
            const angle =
              elapsed * cfg.speed +
              cfg.phaseShift +
              scrollState.twist * Math.sign(cfg.speed);

            const x = Math.cos(angle) * cfg.orbitRadius;
            const y = Math.sin(angle) * cfg.orbitRadius;

            // Direct style write — no React, no reconciler, one property.
            el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
          }
        };

        gsap.ticker.add(tick);

        return () => {
          gsap.ticker.remove(tick);
          visibility.kill();
        };
      });

      // Reduced motion: one opacity fade on the container. Nothing scales,
      // and nothing touches the ring elements, whose opacity belongs to
      // their CSS pulse.
      mm.add(MQ.reduced, () => {
        gsap.fromTo(
          container,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DUR.reduced,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: container, start: REVEAL_START, once: true },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      // No overflow-hidden. That one class was clipping the outer ring,
      // every node on it, and every hover tooltip.
      className="relative my-8 flex w-full max-w-full select-none flex-col items-center justify-center"
    >
      {/* Ambient background radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 rounded-full bg-app-accent/5 blur-3xl"
        style={{ width: ORBIT_BOX * 0.85, height: ORBIT_BOX * 0.85 }}
        aria-hidden="true"
      />

      {/* Measuring wrapper. Its width is what the fit scale is computed
          from; its height is written to match the scaled orbit. */}
      <div ref={fitRef} className="relative w-full" style={{ height: ORBIT_BOX }}>
        <div
          ref={boxRef}
          className="absolute left-1/2 top-0 flex items-center justify-center"
          style={{
            width: ORBIT_BOX,
            height: ORBIT_BOX,
            transform: 'translateX(-50%)',
            transformOrigin: 'top center',
          }}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          {/* Central Core Element */}
          <div
            ref={coreRef}
            className="orbit-core w-20 h-20 sm:w-24 sm:h-24 bg-app-surface/90 border border-app-accent/50 rounded-full flex flex-col items-center justify-center z-20 shadow-2xl relative group cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full bg-app-accent/20 blur-xl animate-pulse" />
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-app-accent relative z-10 transition-transform duration-300 hover-fine:group-hover:scale-110" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-app-text-primary mt-1 relative z-10 font-sans">
              SKILLS
            </span>
          </div>

          {/* Render Concentric Orbit Rings */}
          {ORBIT_LAYERS.map((layer) => (
            <GlowingOrbitRing
              key={`ring-${layer.radius}`}
              radius={layer.radius}
              color={layer.glow}
              delay={layer.delay}
            />
          ))}

          {/* Render Orbiting Skill Nodes */}
          {ORBIT_CONFIGS.map((config, idx) => (
            <OrbitingSkillItemView
              key={config.id}
              config={config}
              nodeRef={registerNode(idx)}
              onTouchToggle={setPausedFromTouch}
            />
          ))}
        </div>
      </div>

      {/* Wording covers both input models, because the orbit now animates
          on touch devices too and "hover" is not an instruction there. */}
      <p className="text-xs font-mono text-app-text-secondary/70 mt-4 tracking-wider uppercase">
        Tap or hover any node to pause the orbit &amp; read the full skill
      </p>
    </div>
  );
};

export default OrbitingSkills;
