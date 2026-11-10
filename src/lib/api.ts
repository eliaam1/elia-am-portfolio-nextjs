import type { Project, Skill, Service, SiteSettings } from '../types';
import { siteSettings, skills, services, projects } from '../config/portfolioData';

// ==========================================
// STATIC READ APIS (Synchronous & Instant)
// ==========================================

export function getProjects(): Project[] {
  return projects;
}

export function getSkills(): Skill[] {
  return skills;
}

export function getServices(): Service[] {
  return services;
}

export function getSiteSettings(): SiteSettings {
  return siteSettings;
}

