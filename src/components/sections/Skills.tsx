'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import OrbitingSkills from '../ui/OrbitingSkills';
import { MQ, TIER, addMotionTiers, GSAP_EASE, DUR, REVEAL_START } from '../../config/motion';
import type { Skill } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface SkillsProps {
  skills: Skill[];
  loading: boolean;
}

type SkillCategory = 'Frontend' | 'Backend' | 'Tools' | 'Design';

const CATEGORY_ORDER: SkillCategory[] = ['Frontend', 'Backend', 'Tools', 'Design'];

export const Skills: React.FC<SkillsProps> = ({ skills, loading }) => {
  const categoriesRef = useRef<HTMLDivElement>(null);

  /* Category stagger reveal. Once-only on every branch. */
  useGSAP(
    () => {
      const list = categoriesRef.current;
      if (!list) return;

      const groups = list.querySelectorAll<HTMLElement>('.skill-category');
      if (groups.length === 0) return;

      const mm = gsap.matchMedia();

      const reveal = (travel: number, duration: number, stagger: number) =>
        gsap.fromTo(
          groups,
          { opacity: 0, y: travel },
          {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: GSAP_EASE.out,
            scrollTrigger: { trigger: list, start: REVEAL_START, once: true },
          }
        );

      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];
        reveal(T.item, T.dur, T.stagger);
      });
      mm.add(MQ.reduced, () => reveal(0, DUR.reduced, 0));

      return () => mm.revert();
    },
    { scope: categoriesRef, dependencies: [loading] }
  );

  // Group skills by category
  const groupedByCategory = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  // Sort each category by sort_order
  Object.values(groupedByCategory).forEach((arr) => {
    arr.sort((a, b) => a.sort_order - b.sort_order);
  });

  if (loading) {
    return (
      <>
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-app-accent mb-3 block font-semibold">
            Expertise
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-app-text-primary mb-4 tracking-tight font-sans">
            Stack
          </h2>
          <div className="h-4 w-5/6 bg-app-surface border border-app-border rounded-lg animate-pulse mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-[300px] h-[300px] sm:w-[440px] sm:h-[440px] rounded-full bg-app-surface border border-app-border animate-pulse" />
          </div>
          <div className="lg:col-span-6 flex flex-col gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="h-3 w-24 bg-app-surface border border-app-border rounded animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-8 w-24 bg-app-surface border border-app-border rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 2-column layout with enhanced column gap and padding separation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/*
          Left column is span-6, not span-5. The orbit box is derived from
          its own ring geometry (ORBIT_BOX in config/motion.ts), and span-5
          was narrower than that box at every breakpoint — which is the
          "square limiting it".
        */}
        <div className="lg:col-span-6 flex w-full min-w-0 justify-center">
          <OrbitingSkills />
        </div>

        {/* Right Column — Categorized Skill Badges */}
        <div
          ref={categoriesRef}
          className="lg:col-span-6 flex flex-col gap-8 text-left lg:pl-8 border-l border-app-border/20 lg:border-app-border/30"
        >
          {CATEGORY_ORDER.map((category) => {
            const items = groupedByCategory[category] || [];
            if (items.length === 0) return null;

            return (
              <div key={category} className="skill-category">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-app-text-secondary mb-3 font-bold">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {items.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-4 py-2 rounded-full bg-app-surface border border-app-border/80 text-xs sm:text-sm font-medium text-app-text-primary font-sans transition-[border-color,color,background-color] duration-200 hover:border-app-accent/50 hover:text-app-accent hover:bg-app-surface/90"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Skills;
