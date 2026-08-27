import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-3 bg-app-surface border rounded-xl text-app-text-primary placeholder-app-text-secondary/40 focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-[border-color,box-shadow] duration-200 disabled:opacity-50 disabled:pointer-events-none text-sm font-sans",
          error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500" : "border-app-border/80",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export default Input;
