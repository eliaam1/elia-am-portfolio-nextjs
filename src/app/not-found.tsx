import React from 'react';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0a0b] text-[#f0f0f0] overflow-hidden">
      {/* Visual background decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-red-500/5 blur-[100px]" />
        <div className="absolute bottom-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-app-accent/5 blur-[100px]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-md mx-auto flex flex-col items-center">
        <h1 className="text-8xl md:text-9xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-app-accent via-amber-400 to-[#eadaaf] select-none font-sans mb-6">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 font-sans">
          Lost in Space
        </h2>

        <p className="text-sm text-app-text-secondary leading-relaxed mb-10 font-sans">
          The page you are looking for has been moved, deleted, or never existed in the first place. Let&apos;s get you back on track.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center font-medium tracking-wide rounded-full transition-[transform,opacity,border-color,background-color,color] duration-200 active:scale-[0.98] px-6 py-3 text-sm bg-app-accent text-black font-semibold border border-transparent gap-2"
        >
          <Home className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
