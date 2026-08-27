'use client';

import React from 'react';

interface ProjectPlaceholderProps {
  category: string;
  techStack: string[];
  className?: string;
}

/**
 * Stylized placeholder that visually communicates a project's domain
 * without relying on stock photography. Each category gets a unique gradient
 * + tech-stack badge overlay.
 */
const CATEGORY_THEMES: Record<string, { from: string; to: string; label: string }> = {
  Web: { from: 'from-indigo-500/20', to: 'to-app-accent/15', label: 'Web Application' },
  'E-Commerce': { from: 'from-sky-500/20', to: 'to-app-accent/15', label: 'E-Commerce Platform' },
  AI: { from: 'from-violet-500/25', to: 'to-slate-900/25', label: 'AI Agent System' },
  Desktop: { from: 'from-slate-500/20', to: 'to-app-accent/15', label: 'Desktop System' },
  'Mobile / IoT': { from: 'from-emerald-500/20', to: 'to-app-accent/15', label: 'Mobile / IoT' },
  Mobile: { from: 'from-emerald-500/20', to: 'to-app-accent/15', label: 'Mobile App' },
  Design: { from: 'from-rose-500/20', to: 'to-app-accent/15', label: 'Design Work' },
};

export const ProjectPlaceholder: React.FC<ProjectPlaceholderProps> = ({
  category,
  techStack,
  className = '',
}) => {
  const theme = CATEGORY_THEMES[category] || CATEGORY_THEMES.Web;

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br ${theme.from} ${theme.to} ${className}`}
      aria-hidden="true"
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,61,222,0.16),transparent_60%)]" />

      {/* Category label centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-app-accent/80 mb-2">
            {theme.label}
          </p>
          <p className="font-sans text-sm sm:text-base text-app-text-primary/70 font-medium max-w-xs">
            {techStack.slice(0, 3).join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectPlaceholder;
