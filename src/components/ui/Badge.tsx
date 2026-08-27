import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'secondary', children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide font-mono border transition-[border-color,background-color,color] duration-200",
        {
          'bg-app-accent/10 border-app-accent/25 text-app-accent': variant === 'primary',
          'bg-app-surface border-app-border text-app-text-secondary': variant === 'secondary',
          'bg-accent-500/10 border-accent-500/30 text-accent-700': variant === 'accent',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
