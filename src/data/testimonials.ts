import type { Testimonial } from '../types';

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    author_name: 'Maroun Kabalan',
    author_title: 'Founder & Owner',
    author_company: 'Sport Zone',
    author_avatar_url: '',
    content: 'Elia took our entire catalog — over 10,000 SKUs across multiple brands — and got it running on Shopify with our ERP syncing automatically. Before him we were updating stock manually between systems and it was a nightmare. He figured out the API integrations, set up webhooks, handled the bulk operations, all of it. The store looks great and actually works the way a modern e-commerce site should. Anytime something comes up he\'s on it fast.',
    rating: 5,
    featured: true,
    sort_order: 1,
  },
  {
    id: 't2',
    author_name: 'Youssef Abi Khers',
    author_title: 'Physiotherapist & Founder',
    author_company: 'The Physio Clinic',
    author_avatar_url: '',
    content: 'We needed a website that felt premium and matched the quality of our clinic — not a generic template. Elia built the whole thing from scratch with animations, 3D elements, and it loads incredibly fast. Our patients actually comment on how good the site looks, which never happened with our old one. He understood exactly what we wanted without us having to over-explain. Very professional to work with and delivered ahead of schedule.',
    rating: 5,
    featured: true,
    sort_order: 2,
  },
];
