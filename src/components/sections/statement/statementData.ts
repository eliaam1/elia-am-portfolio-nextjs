import { PROJECTS_DELIVERED } from '../profile/profileData';

/** A run of the sentence; `key` runs are the three promises, set in lime. */
export interface StatementPart {
  text: string;
  key?: boolean;
}

/** "Websites and apps that look premium, load fast and are easy for your customers to use." */
export const STATEMENT_PARTS: readonly StatementPart[] = [
  { text: 'Websites and apps that look ' },
  { text: 'premium', key: true },
  { text: ', load ' },
  { text: 'fast', key: true },
  { text: ' and are ' },
  { text: 'easy', key: true },
  { text: ' for your customers to use' },
];

/** The giant beats that cut through before the sentence (decorative; the sentence says it). */
export const STATEMENT_BEATS = ['Premium', 'Fast', 'Easy'] as const;

export const STATEMENT_PROOF = { count: `${PROJECTS_DELIVERED}+`, text: 'projects delivered · web & mobile' } as const;
