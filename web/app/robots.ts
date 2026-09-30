import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Future authenticated areas; never indexed.
      disallow: ["/admin", "/portal"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
