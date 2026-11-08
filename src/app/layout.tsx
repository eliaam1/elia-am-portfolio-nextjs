import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScrollProvider from "../components/providers/SmoothScrollProvider";
import { Toaster } from "react-hot-toast";
import {
  PRELOAD_SESSION_KEY,
  PRELOAD_FAILSAFE_MS,
  PRELOAD_COMPLETE_EVENT,
} from "../config/constants";

/*
 * Fonts are self-hosted from Fontsource packages via next/font/local, so
 * builds never fetch from Google at build time (that fetch fails on machines
 * whose TLS is intercepted, silently shipping fallback faces). next/font
 * still generates metric-matched fallbacks, so swapping causes no layout
 * shift. Exposed as CSS variables; globals.css maps them onto the Tailwind
 * font-sans / font-heading / font-mono tokens.
 */
const dmSans = localFont({
  src: "../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  weight: "100 1000",
  variable: "--font-dm-sans",
  display: "swap",
});

const poppins = localFont({
  src: [
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2", weight: "700" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#151816",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Elia Abdel Massih | Full Stack Developer & AI Specialist",
  description: "Personal portfolio of Elia Abdel Massih — Full Stack Developer & AI Specialist specializing in React, Next.js, TypeScript, Shopify Liquid, enterprise .NET, and high-performance web applications.",
  keywords: [
    "Elia Abdel Massih",
    "Full Stack Developer",
    "AI Specialist",
    "React Developer",
    "Next.js Portfolio",
    "Shopify Developer",
    ".NET Developer",
    "TypeScript",
    "Lebanon Developer"
  ],
  authors: [{ name: "Elia Abdel Massih" }],
  creator: "Elia Abdel Massih",
  icons: {
    icon: "/brand/eam-favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elia-portfolio.vercel.app",
    title: "Elia Abdel Massih | Full Stack Developer & AI Specialist",
    description: "Full Stack Developer with hands-on Shopify expertise, enterprise .NET & React architecture, and AI-assisted workflows.",
    siteName: "Elia Abdel Massih Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elia Abdel Massih | Full Stack Developer & AI Specialist",
    description: "Full Stack Developer with hands-on Shopify expertise, enterprise .NET & React architecture, and AI-assisted workflows.",
    creator: "@elia_am",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning below is REQUIRED, not cosmetic. The inline
  // script in <head> sets data-preload on <html> before React hydrates, so
  // the server HTML and the live DOM necessarily disagree about it. Without
  // it, React logs a hydration mismatch on every load.
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${poppins.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/*
          Blocking pre-paint load-state stamp.

          This must run before the first paint, which is why it is a raw
          inline script and not a React effect. The previous Preloader began
          at useState(false), so the server shipped no overlay at all: the
          hero painted, THEN the overlay mounted, THEN the hero entered
          again. Deciding the state here means the very first frame is
          already correct.

          Every failure mode resolves toward "show the site":
            - sessionStorage unavailable (private mode) -> 'ready'
            - script throws                             -> 'ready'
            - React never hydrates                      -> the failsafe
              timeout releases the overlay, so the page can never stay
              blocked behind a loader that will never finish.

          See the load-orchestration block in globals.css for the states.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;try{d.setAttribute('data-preload',sessionStorage.getItem('${PRELOAD_SESSION_KEY}')?'ready':'loading');}catch(e){d.setAttribute('data-preload','ready');}setTimeout(function(){if(d.getAttribute('data-preload')!=='loading')return;d.setAttribute('data-preload','ready');try{window.dispatchEvent(new CustomEvent('${PRELOAD_COMPLETE_EVENT}'));}catch(e){}},${PRELOAD_FAILSAFE_MS});})();`,
          }}
        />
      </head>
      <body className="antialiased bg-app-bg text-app-text-primary selection:bg-app-accent/20">
        <SmoothScrollProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '999px',
              },
            }}
          />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
