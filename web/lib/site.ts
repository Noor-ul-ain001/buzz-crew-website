// Site-wide constants. Replace the TODO placeholders with the agency's real details.

export const SITE_NAME = "The Buzz Crew";

export const SITE_TAGLINE = "We tell your stories.";

export const SITE_DESCRIPTION =
  "The Buzz Crew is a full-service digital agency founded in Karachi in 2022: social media, SEO, web and software development, UI/UX design and Meta Ads for brands in Pakistan, the UAE and the UK.";

// www.thebuzzcrew.com per the brochure; set NEXT_PUBLIC_SITE_URL to override (e.g. previews).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thebuzzcrew.com";

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

// Brand colours from the brochure and logo, shared with contexts that can't read CSS variables
// (Open Graph images). Keep in sync with the tokens in app/globals.css.
export const BRAND_COLORS = {
  yellow: "#d9c24a",
  ink: "#0a1535",
  paper: "#f5f2e8",
  purple: "#a77bd6",
  teal: "#66c2d4",
} as const;

// From the agency brochure (ABOUT BUZZ CREW.pdf).
export const CONTACT_EMAIL = "buzzcrewofficial@gmail.com";

// Instagram handle from the brochure (@itsbuzzcrew). TODO: confirm the other profile URLs.
export const INSTAGRAM_URL = "https://www.instagram.com/itsbuzzcrew/";

export const SOCIAL_LINKS = [
  { label: "Instagram", href: INSTAGRAM_URL },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "TikTok", href: "https://www.tiktok.com/" },
] as const;
