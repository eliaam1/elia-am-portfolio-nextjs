import type { Testimonial } from '../types';

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    author_name: 'Retail Client Lead',
    author_title: 'E-Commerce Operations Manager',
    author_company: 'Shopify Storefront',
    author_avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    content: 'Elia built and maintains our custom Shopify storefront with multi-store inventory sync and Liquid custom theme development. His work is exceptionally reliable and fast.',
    rating: 5,
    featured: true,
    sort_order: 1,
  },
  {
    id: 't2',
    author_name: 'IT Operations Team',
    author_title: 'Enterprise Systems Lead',
    author_company: 'Lebanese Military IT Dept',
    author_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    content: 'Elia engineered robust .NET Core Web APIs and SQL Server architectures for critical internal operations. High technical standard and solid execution.',
    rating: 5,
    featured: true,
    sort_order: 2,
  },
];
