'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import SectionWrapper from '../layout/SectionWrapper';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { isValidEmail } from '../../lib/utils';
import { submitContactForm } from '../../lib/api';
import { MQ, TIER, addMotionTiers, GSAP_EASE, DUR, REVEAL_START } from '../../config/motion';
import type { SiteSettings } from '../../types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

interface ContactProps {
  settings: SiteSettings | null;
  loading: boolean;
}

export const Contact: React.FC<ContactProps> = ({ settings, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const contactEmail = settings?.contact_email || 'Elie_am2000@hotmail.com';
  const socialWhatsapp = settings?.social_whatsapp || 'https://wa.me/96176330429';
  const socialGithub = settings?.social_github || 'https://github.com';

  /* ------------------------------------------------------------------ *
   * Layered entrance choreography for the closing chapter.
   *
   * Visibility (I1):
   *   No authored opacity-0 class on inputs or text in SSR markup. GSAP
   *   matchMedia applies runtime reveals so markup is always visible on
   *   first paint.
   * ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ *
   * Closing headline — masked per-line reveal.
   *
   * A separate hook from the generic reveal timeline below, targeting
   * `.contact-headline`, which carries no `contact-reveal-item` class. That
   * separation is what keeps one owner per property: this hook owns the
   * headline's transform and opacity, the timeline below owns everything
   * else's.
   *
   * Visibility (I1): the <h2> is authored fully visible; the split and its
   * masks exist only inside a matchMedia branch and revert on cleanup.
   * ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const headline = containerRef.current?.querySelector<HTMLElement>(
        '.contact-headline'
      );
      if (!headline) return;

      const mm = gsap.matchMedia();

      addMotionTiers(mm, () => {
        const split = SplitText.create(headline, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'contact-headline-line',
          aria: 'auto',
        });

        gsap.from(split.lines, {
          yPercent: 112,
          duration: 0.72,
          stagger: 0.09,
          ease: GSAP_EASE.snap,
          scrollTrigger: { trigger: headline, start: REVEAL_START, once: true },
        });

        return () => split.revert();
      });

      // Reduced motion: the authored markup is already the resting state.
      mm.add(MQ.reduced, () => {});

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const leftItems = container.querySelectorAll<HTMLElement>('.contact-reveal-item');
      const rightCard = container.querySelector<HTMLElement>('.contact-card-item');

      const mm = gsap.matchMedia();

      // The old mobile branch animated only the left column and silently
      // dropped the form card entrance. Every tier now gets both.
      addMotionTiers(mm, (tier) => {
        const T = TIER[tier];

        if (leftItems.length > 0) {
          gsap.fromTo(
            leftItems,
            { opacity: 0, y: T.item },
            {
              opacity: 1,
              y: 0,
              duration: T.dur,
              stagger: T.stagger,
              ease: GSAP_EASE.out,
              scrollTrigger: {
                trigger: container,
                start: REVEAL_START,
                once: true,
              },
            }
          );
        }

        if (rightCard) {
          gsap.fromTo(
            rightCard,
            { opacity: 0, y: T.travel },
            {
              opacity: 1,
              y: 0,
              duration: T.dur,
              delay: 0.15,
              ease: GSAP_EASE.out,
              scrollTrigger: {
                trigger: container,
                start: REVEAL_START,
                once: true,
              },
            }
          );
        }
      });

      mm.add(MQ.reduced, () => {
        if (leftItems.length > 0) {
          gsap.fromTo(
            leftItems,
            { opacity: 0 },
            {
              opacity: 1,
              duration: DUR.reduced,
              ease: GSAP_EASE.out,
              scrollTrigger: {
                trigger: container,
                start: REVEAL_START,
                once: true,
              },
            }
          );
        }
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [loading] }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleValidation = (): boolean => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required.';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required.';
    } else if (!isValidEmail(formData.email)) {
      tempErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) {
      tempErrors.message = 'Message is required.';
    } else if (formData.message.trim().length < 10) {
      tempErrors.message = 'Message must be at least 10 characters.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setStatus('loading');

    if (formData.honeypot.trim()) {
      setTimeout(() => {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
      }, 800);
      return;
    }

    try {
      await submitContactForm({
        sender_name: formData.name,
        sender_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        honeypot: formData.honeypot,
      });
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
    } catch (err) {
      console.error('Contact submission error:', err);
      setStatus('error');
      const error = err as Error;
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <SectionWrapper id="contact" className="bg-app-bg relative">
        <div className="mb-16">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-app-accent mb-3 block font-semibold">
            GET IN TOUCH
          </span>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-app-text-primary mb-4 tracking-tight font-sans text-left">
            Have a project in mind? Let&apos;s talk.
          </h2>
          <div className="h-4 w-5/6 bg-app-surface border border-app-border/80 rounded-lg animate-pulse" />
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="contact" className="bg-app-bg relative">
      <div
        ref={containerRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 max-w-6xl mx-auto items-start text-left"
      >
        {/* Left Column (6/12): Large Visual Closing Statement & Direct Action Links */}
        <div className="lg:col-span-6 flex flex-col items-start select-none">
          <div className="contact-reveal-item flex items-center gap-3 mb-4">
            <span className="text-xs font-mono font-bold text-app-accent">04</span>
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-app-text-secondary font-semibold">
              / CONTACT
            </span>
          </div>

          {/* Genuinely Large Final Visual Statement */}
          {/*
            Deliberately NOT `contact-reveal-item`: that class is driven by
            the generic reveal timeline below, and pointing both it and the
            headline's own masked-line reveal at this element would put two
            tweens on one opacity.
          */}
          <h2 className="contact-headline text-4xl sm:text-6xl lg:text-7xl font-black text-app-text-primary mb-6 tracking-tight leading-[0.95] font-sans">
            HAVE A PROJECT <br />
            IN MIND?<br />
            <span className="text-app-accent">LET&apos;S TALK.</span>
          </h2>

          <p className="contact-reveal-item text-base sm:text-lg text-app-text-secondary leading-relaxed font-sans max-w-md mb-8">
            Open for full-time engineering roles, custom Shopify &amp; enterprise .NET architecture, or consulting on modern AI workflows.
          </p>

          {/* Live Availability Badge with Emerald Radar Pulse */}
          <div className="contact-reveal-item p-4 rounded-xl bg-app-surface border border-app-border/80 flex items-center gap-3 mb-8 w-full max-w-md shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-app-text-primary">
              Available for New Roles &amp; Projects
            </span>
          </div>

          {/* Direct Email Action Link */}
          <div className="contact-reveal-item mb-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-app-text-secondary mb-2 block font-semibold">
              Direct Email Channel
            </span>
            <a
              href={`mailto:${contactEmail}`}
              className="group inline-flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-app-text-primary hover:text-app-accent transition-colors duration-200 font-sans tracking-tight"
            >
              <span>{contactEmail}</span>
              <ArrowUpRight className="w-6 h-6 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 text-app-accent" />
            </a>
          </div>

          {/* Social Channels */}
          <div className="contact-reveal-item">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-app-text-secondary mb-3 block font-semibold">
              Direct Channels
            </span>
            <div className="flex flex-wrap gap-3">
              {socialWhatsapp && (
                <a
                  href={socialWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-app-border/80 bg-app-surface text-xs font-semibold text-app-text-primary hover:text-app-accent hover:border-app-accent/40 transition-[color,border-color] duration-200"
                >
                  <MessageCircle className="w-4 h-4 text-app-accent" />
                  <span>WhatsApp</span>
                </a>
              )}
              {socialGithub && (
                <a
                  href={socialGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-app-border/80 bg-app-surface text-xs font-semibold text-app-text-primary hover:text-app-accent hover:border-app-accent/40 transition-[color,border-color] duration-200"
                >
                  <svg className="w-4 h-4 fill-current text-app-accent" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (6/12): Clean Interactive Contact Form */}
        <div className="contact-card-item lg:col-span-6 w-full">
          <Card
            hoverEffect={false}
            className="p-8 sm:p-10 bg-app-surface border border-app-border/80 rounded-2xl h-full flex flex-col justify-center shadow-lg"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="py-12 flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-app-text-primary mb-3 font-sans">
                    Message Sent!
                  </h3>
                  <p className="text-sm text-app-text-secondary max-w-sm leading-relaxed mb-8 font-sans">
                    Thank you for reaching out. Elia has received your message and will respond shortly.
                  </p>
                  <Button variant="secondary" size="md" onClick={() => setStatus('idle')}>
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5 text-left"
                >
                  <input
                    type="text"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleChange}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="name"
                        className="text-xs font-semibold text-app-text-secondary uppercase tracking-wider font-sans"
                      >
                        Your Name <span className="text-app-accent">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        error={!!errors.name}
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                      />
                      {errors.name && (
                        <span id="name-error" role="alert" className="text-red-500 text-[11px] font-sans font-medium">
                          {errors.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="email"
                        className="text-xs font-semibold text-app-text-secondary uppercase tracking-wider font-sans"
                      >
                        Your Email <span className="text-app-accent">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <span id="email-error" role="alert" className="text-red-500 text-[11px] font-sans font-medium">
                          {errors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="subject"
                      className="text-xs font-semibold text-app-text-secondary uppercase tracking-wider font-sans"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="Project Inquiry / Role Opportunity"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="message"
                      className="text-xs font-semibold text-app-text-secondary uppercase tracking-wider font-sans"
                    >
                      Your Message <span className="text-app-accent">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Hello Elia, I would like to discuss..."
                      value={formData.message}
                      onChange={handleChange}
                      error={!!errors.message}
                      aria-required="true"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message && (
                      <span id="message-error" role="alert" className="text-red-500 text-[11px] font-sans font-medium">
                        {errors.message}
                      </span>
                    )}
                  </div>

                  {status === 'error' && (
                    <div role="alert" className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={status === 'loading'}
                    className="w-full sm:w-auto mt-2 self-start font-bold uppercase tracking-wider text-xs"
                  >
                    Send Message &rarr;
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default Contact;
