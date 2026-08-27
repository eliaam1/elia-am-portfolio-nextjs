'use client';

import React, { useEffect } from 'react';
import WebGLPreloader from '../components/layout/WebGLPreloader';
import Navbar from '../components/layout/Navbar';
import CustomCursor from '../components/layout/CustomCursor';
import TravellingPortrait from '../components/ui/TravellingPortrait';
import ScrollProgress from '../components/layout/ScrollProgress';
import ScrollPath from '../components/layout/ScrollPath';
import SectionHeading from '../components/layout/SectionHeading';
import Hero from '../components/sections/Hero';
import HeroLenisExperience from '../components/sections/HeroLenisExperience';
import { USE_EXPERIMENTAL_HERO } from '../config/constants';
import About from '../components/sections/About';
import Skills from '../components/sections/Skills';
import Services from '../components/sections/Services';
import Statement from '../components/sections/Statement';
import Projects from '../components/sections/Projects';
import Experience from '../components/sections/Experience';
import Testimonials from '../components/sections/Testimonials';
import Contact from '../components/sections/Contact';
import Footer from '../components/layout/Footer';
import {
  getProjects,
  getSkills,
  getExperience,
  getTestimonials,
  getServices,
  getSiteSettings,
} from '../lib/api';

export default function Home() {
  const settings = getSiteSettings();
  const projects = getProjects();
  const skills = getSkills();
  const services = getServices();
  const experience = getExperience();
  const testimonials = getTestimonials();

  useEffect(() => {
    const titleName = settings?.hero_title || 'Elia Abdel Massih';
    document.title = `${titleName} | Full Stack Developer & AI Specialist`;
  }, [settings]);

  return (
    <div className="relative min-h-screen bg-app-bg text-app-text-primary selection:bg-app-accent/20">
      {/* Accessible Skip-to-Content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:px-4 focus:py-2.5 focus:bg-app-accent focus:text-black focus:font-bold focus:rounded-lg focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-black"
      >
        Skip to main content
      </a>

      {/* Global Navigation & Spatial Indicator Shell */}
      <WebGLPreloader />
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      <ScrollPath />

      {/*
        Shared-element portrait that flies from the Hero frame into the
        About frame. Deliberately outside <main>: it is permanently
        position:fixed and has to draw across two sections, so it must not
        live inside either of their stacking contexts.

        It self-disables on mobile, under reduced motion, and if either
        [data-portrait-slot] is missing -- in every one of those cases both
        real portraits simply render normally.
      */}
      <TravellingPortrait />

      {/*
        FOUR chapters plus the hero, down from nine sections.

        The <section> elements live HERE rather than inside the components,
        because a merged chapter needs one id, one <h2> and one shared
        background — none of which a child can own once several children share
        the chapter. The children are body-only; each supplies its own
        max-w-6xl container, which is what lets a chapter hold a full-bleed
        block (About's ambient field) right next to a contained one.

        Section ids must stay in lockstep with NAV_LINKS in config/constants —
        those same strings are the useScrollSpy anchors.
      */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {/* Hero — owns its own id="hero" internally. */}
        {USE_EXPERIMENTAL_HERO ? (
          <HeroLenisExperience settings={settings} loading={false} />
        ) : (
          <Hero settings={settings} loading={false} />
        )}

        {/* 01 / PROFILE — biography, metrics and portrait, then the stack. */}
        <section id="profile" className="relative overflow-x-clip">
          {/*
            About is deliberately NOT wrapped in a container: it carries its
            own full-bleed ambient WebGL field, and boxing it inside
            max-w-6xl would stop that field being full-bleed. It also still
            carries the chapter's "01 / PROFILE" overline and its Wave B
            split-heading choreography.
          */}
          <About settings={settings} loading={false} />

          <div className="w-full max-w-6xl mx-auto px-6 md:px-10 pt-8 pb-20 md:pb-28">
            <SectionHeading
              variant="sub"
              overline="STACK"
              title={
                <>
                  Stack &amp; Technologies<span className="text-app-accent">.</span>
                </>
              }
              intro="Core tools, languages and architecture patterns I reach for when building modern digital products."
            />
            <Skills skills={skills} loading={false} />
          </div>
        </section>

        {/* 02 / WORK — capabilities, the philosophy beat, then selected work. */}
        <section id="work" className="relative overflow-x-clip bg-app-bg">
          <div className="w-full max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-28">
            <SectionHeading
              index="02"
              overline="WORK"
              title={
                <>
                  What I Do<span className="text-app-accent">.</span>
                </>
              }
              intro="Specialized engineering and digital architecture offerings, built to scale and to last."
            />
            <Services services={services} loading={false} />
          </div>

          {/* Philosophy — full-bleed breathing space between the two halves. */}
          <Statement />

          <div className="w-full max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-20 md:pb-28">
            <SectionHeading
              variant="sub"
              overline="SELECTED WORK"
              title={
                <>
                  Selected Work<span className="text-app-accent">.</span>
                </>
              }
              intro="Enterprise applications, full-stack systems and custom commerce products engineered for performance."
            />
            <Projects projects={projects} loading={false} />
          </div>
        </section>

        {/* 03 / JOURNEY — timeline, then endorsements. */}
        <section id="journey" className="relative overflow-x-clip bg-app-surface/20">
          <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
            <SectionHeading
              index="03"
              overline="JOURNEY"
              title={
                <>
                  Work &amp; Education<span className="text-app-accent">.</span>
                </>
              }
              intro="A timeline of my professional experience and academic background across software engineering and AI workflows."
            />
            <Experience experience={experience} loading={false} />

            <div className="mt-24 md:mt-32">
              <SectionHeading
                variant="sub"
                overline="ENDORSEMENTS"
                title={
                  <>
                    What Clients Say<span className="text-app-accent">.</span>
                  </>
                }
                intro="Feedback from the engineering leads and business partners I have shipped with."
              />
              <Testimonials testimonials={testimonials} loading={false} />
            </div>
          </div>
        </section>

        {/* 04 / CONTACT — Contact still owns its own id and header. */}
        <Contact settings={settings} loading={false} />
      </main>

      {/* Section 10: Minimalist Footer Departure & Return */}
      <Footer settings={settings} />
    </div>
  );
}
