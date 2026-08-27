import { clsx, type ClassValue } from 'clsx';

/**
 * Combines CSS class names conditionally using clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Formats a date string (YYYY-MM-DD or similar) into "Month Year" (e.g., "Jan 2026").
 * If the input is null, returns "Present".
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // fallback if parsing fails
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Validates an email address.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
