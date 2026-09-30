import type { NextConfig } from "next";

// The browser only ever talks to this app's origin. /api/v1/* is proxied to the FastAPI
// service in every environment (specs/DEPLOYMENT.md D2), so cookies stay first-party and
// no CORS is needed for browser traffic.
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:8000";
// A separate, easy-to-remember address for the team: https://buzz-crew-admin.vercel.app
const ADMIN_HOST = process.env.ADMIN_HOST ?? "buzz-crew-admin.vercel.app";

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
  async redirects() {
    return [
      // The admin's own address opens the admin (sign-in first when signed out).
      { source: "/", has: [{ type: "host", value: ADMIN_HOST }], destination: "/admin", permanent: false },
      // Earlier industry pages, replaced by the brochure's industries.
      { source: "/industries/restaurant-marketing-karachi", destination: "/industries/food-and-beverages", permanent: true },
      { source: "/industries/clinic-marketing-uk", destination: "/industries/healthcare-and-dental", permanent: true },
      { source: "/industries/real-estate-marketing-dubai", destination: "/work", permanent: true },
    ];
  },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }];
  },
};

export default nextConfig;
