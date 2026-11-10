import type { NextConfig } from "next";

/**
 * Private by owner decision: nothing on this site may be indexed, previewed or
 * cached by search engines, including the photos and the CV PDF. Sent on every
 * response (pages, images, files), not only on HTML pages, because a meta tag
 * cannot cover an image or a PDF.
 */
const NO_INDEX = "noindex, nofollow, noimageindex, noarchive, nosnippet";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: NO_INDEX }] }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
