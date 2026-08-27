import React from 'react';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isMagnetic?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isMagnetic = false, loading = false, children, ...props }, ref) => {
    const magneticRef = useMagneticEffect<HTMLButtonElement>(0.3, 80);
    const actualRef = isMagnetic ? magneticRef : (ref as React.RefObject<HTMLButtonElement>);

    return (
      <button
        ref={actualRef}
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-wide rounded-full transition-[transform,opacity,border-color,background-color,color] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none font-sans",
          {
            'bg-app-accent text-black hover:opacity-90 font-semibold border border-transparent': variant === 'primary',
            'bg-app-surface border border-app-border text-app-text-primary hover:bg-app-surface/90': variant === 'secondary',
            'border border-app-border text-app-text-primary hover:border-app-accent hover:text-app-accent': variant === 'outline',
            'text-app-text-secondary hover:text-app-text-primary hover:bg-app-surface/40': variant === 'ghost',
          },
          {
            'px-4 py-2 text-xs': size === 'sm',
            'px-6 py-3 text-sm': size === 'md',
            'px-8 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
