'use client';

import React, { useEffect } from 'react';
import EamLoader from '../components/layout/EamLoader';
import Navbar from '../components/layout/Navbar';
import CustomCursor from '../components/layout/CustomCursor';
import ScrollProgress from '../components/layout/ScrollProgress';
import ScrollPath from '../components/layout/ScrollPath';
import SectionHeading from '../components/layout/SectionHeading';
import HeroSplit from '../components/sections/HeroSplit';
import Profile from '../components/sections/profile/Profile';
import StackDeck from '../components/sections/stack/StackDeck';
import Statement from '../components/sections/statement/Statement';
import WorkDimension from '../components/sections/work/WorkDimension';
import Experience from '../components/sections/Experience';
import Testimonials from '../components/sections/Testimonials';
import Contact from '../components/sections/Contact';
import Footer from '../components/layout/Footer';
import {
  getExperience,
  getTestimonials,
  getSiteSettings,
} from '../lib/api';

export default function Home() {
  const settings = getSiteSettings();
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
      <EamLoader />
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      <ScrollPath />


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
        {/*
          Hero — owns id="hero". Must stay the element immediately before
          #profile: the blade-sweep hand-off pulls Profile up under the hero
          with a `#hero + #profile` rule (globals.css).
        */}
        <HeroSplit />

        {/* 01 / PROFILE — statement, bio, career log and services, then the stack deck. */}
        <section id="profile" aria-label="Profile" className="relative overflow-x-clip">
          <Profile />
          <StackDeck />
        </section>

        {/*
          "What I do" — one line, then the camera pushes through it into the
          dark and leaves a light at the centre, which the Dimension's own
          opening light takes over. Must stay directly before #work.
        */}
        <Statement />

        {/*
          02 / WORK — the Digital Dimension (selected work, tagged with the
          services each project took; the old Services list was folded into
          it). It ends on the contact portal.
        */}
        <section id="work" className="relative overflow-x-clip bg-app-bg">
          <WorkDimension />
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
