import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverEffect = true, children, ...props }) => {
  return (
    <div
      className={cn(
        "bg-app-surface border border-app-border/80 rounded-2xl p-6 transition-[border-color,background-color] duration-200",
        {
          'hover:border-app-accent/40 hover:bg-app-surface/90': hoverEffect,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
