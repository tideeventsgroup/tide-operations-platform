import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // The service worker file itself must never be served stale — Vercel's
  // CDN otherwise caches /sw.js like any other static asset, so a new
  // deploy's worker code can take a long time to actually reach clients
  // (browsers only check for a byte-different sw.js on their own schedule,
  // and a CDN-cached stale copy defeats that check entirely).
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
