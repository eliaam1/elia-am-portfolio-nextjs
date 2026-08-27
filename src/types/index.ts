export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  created_at?: string;
  updated_at?: string;
}

/**
 * Which end of the gallery's continuous environment a project sits at.
 *
 * The gallery background is ONE gradient field that interpolates between
 * these tones as the camera travels, so this is a position on a scale rather
 * than a per-project colour. Declared per record because the narrative order
 * (commerce -> product -> system) is a content decision, not a derived one.
 */
export type ProjectEnvironment = 'commerce' | 'clinical' | 'technical';

export interface Project {
  id: string;
  /** Brand identity. Carries the semantic <h3>. */
  title: string;
  /** Discipline line beneath the brand, e.g. 'Shopify E-Commerce Development'. */
  discipline: string;
  /** Engagement and origin, e.g. 'Freelance · sportzonelb.com'. */
  role: string;
  description: string;
  tech_stack: string[];
  live_url: string | null;
  github_url: string | null;
  thumbnail_url: string;
  /**
   * Narrow companion surface floated at a nearer Z than the main one. Absent
   * where a project has no meaningful second viewport.
   */
  secondary_image_url?: string;
  /** Brand mark. Absent until a file is supplied — the gallery falls back to a wordmark. */
  logo_url?: string;
  /**
   * Deployment caveat, e.g. 'IN DEVELOPMENT · LOCAL'. Present only where the
   * work is NOT publicly deployed, so its absence is the normal case rather
   * than an omission.
   */
  status?: string;
  /** Call-to-action wording. The href is live_url ?? github_url. */
  cta_label: string;
  /**
   * Headline figure for the work, e.g. '10,000+ ERP SKUs'. Optional because
   * inventing one where no measured number exists would be a claim, not a
   * design decision.
   */
  metric?: string;
  gallery_images: string[];
  category: string;
  environment: ProjectEnvironment;
  project_date: string;
  featured: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  icon_url: string | null;
  category: 'Frontend' | 'Backend' | 'Design' | 'Tools' | 'Other';
  proficiency: number; // 1-100
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null; // null means 'Present'
  description: string;
  type: 'work' | 'education';
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_title: string;
  author_company: string | null;
  author_avatar_url: string | null;
  content: string;
  rating: number | null; // 1-5
  featured: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Visual rank of a capability within the services stack.
 *
 * Declared per record rather than derived from `sort_order`, because rank and
 * order are not the same claim: reordering the list should not silently
 * promote a supporting capability into the featured slot.
 */
export type ServiceProminence = 'featured' | 'major' | 'supporting';

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  features: string[];
  price_range: string | null;
  image_url?: string;
  /**
   * Technology keys resolved to brand marks by TECH_REGISTRY in
   * components/ui/TechIcon.tsx. Keys rather than components so this data
   * layer stays free of JSX and could move to an API response unchanged.
   */
  tech?: string[];
  /** Defaults to 'major' when absent. */
  prominence?: ServiceProminence;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at?: string;
}

export interface SiteSettings {
  id: string; // singleton row
  hero_title: string;
  hero_subtitle: string;
  hero_tagline: string;
  about_text: string;
  about_image_url: string;
  resume_url: string;
  social_facebook: string | null;
  social_instagram: string | null;
  social_github: string | null;
  social_whatsapp: string | null;
  calendly_url: string | null;
  contact_email: string;
  updated_at?: string;
}
