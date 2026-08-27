import React from 'react';
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md' }) => {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-app-accent/20 border-t-app-accent",
          {
            "w-4 h-4 border-2": size === 'sm',
            "w-8 h-8 border-3": size === 'md',
            "w-12 h-12 border-4": size === 'lg',
          }
        )}
      />
    </div>
  );
};

export default Spinner;
