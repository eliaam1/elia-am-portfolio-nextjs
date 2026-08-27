import type { Project, Skill, Experience, Testimonial, Service, SiteSettings } from '../types';
import { siteSettings, skills, services, projects, experience, testimonials } from '../config/portfolioData';

// ==========================================
// STATIC READ APIS (Synchronous & Instant)
// ==========================================

export function getProjects(): Project[] {
  return projects;
}

export function getSkills(): Skill[] {
  return skills;
}

export function getExperience(): Experience[] {
  return experience;
}

export function getTestimonials(): Testimonial[] {
  return testimonials;
}

export function getServices(): Service[] {
  return services;
}

export function getSiteSettings(): SiteSettings {
  return siteSettings;
}

/**
 * Handles contact form submission client-side with instant feedback.
 */
export async function submitContactForm(formData: {
  sender_name: string;
  sender_email: string;
  subject?: string;
  message: string;
  honeypot?: string;
}) {
  // Simulate instant client response delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (formData.honeypot?.trim()) {
    return { success: true };
  }

  return {
    success: true,
    message: 'Thank you for reaching out! Your message has been received.',
  };
}
