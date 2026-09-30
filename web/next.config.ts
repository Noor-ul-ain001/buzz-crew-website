import type { NextConfig } from "next";

// The browser only ever talks to this app's origin. /api/v1/* is proxied to the FastAPI
// service in every environment (specs/DEPLOYMENT.md D2), so cookies stay first-party and
// no CORS is needed for browser traffic.
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Cloudinary resizes uploaded images itself (free plan), so Vercel's optimiser isn't used.
  images: { loader: "custom", loaderFile: "./lib/images/cloudinary-loader.ts" },
  async headers() {
    return [
      {
        // Admin pages are never cached or framed (003 T020).
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }];
  },
};

export default nextConfig;
