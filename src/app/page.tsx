'use client';

import React, { useEffect } from 'react';
import EamLoader from '../components/layout/EamLoader';
import IslandNav from '../components/layout/nav/IslandNav';
import CustomCursor from '../components/layout/CustomCursor';
import HeroSplit from '../components/sections/HeroSplit';
import Profile from '../components/sections/profile/Profile';
import StackDeck from '../components/sections/stack/StackDeck';
import Statement from '../components/sections/statement/Statement';
import WorkDimension from '../components/sections/work/WorkDimension';
import Contact from '../components/sections/contact/Contact';
import SiteFooter from '../components/sections/contact/SiteFooter';
import { getSiteSettings } from '../lib/api';

export default function Home() {
  const settings = getSiteSettings();

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
      <CustomCursor />
      <IslandNav />


      {/*
        Three chapters plus the hero (Journey was removed: the career log in
        Profile already covers work and education).

        The <section> elements live HERE rather than inside the components,
        because a merged chapter needs one id, one <h2> and one shared
        background — none of which a child can own once several children share
        the chapter. The children are body-only; each supplies its own
        max-w-6xl container, which is what lets a chapter hold a full-bleed
        block (About's ambient field) right next to a contained one.

        Section ids must stay in lockstep with NAV_LINKS in config/constants —
        those same strings are the island nav's chapter anchors.
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
          it). It ends on the contact portal, which leads straight into Contact.
        */}
        <section id="work" className="relative overflow-x-clip bg-app-bg">
          <WorkDimension />
        </section>

        {/*
          03 / CONTACT — a raised panel (WhatsApp and phone only) that lifts
          off the footer below it like a curtain. Must stay the last section:
          SiteFooter tucks up under its rounded bottom edge.
        */}
        <Contact />
      </main>

      <SiteFooter />
    </div>
  );
}
