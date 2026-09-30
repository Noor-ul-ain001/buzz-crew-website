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

// Brand colours from the logo, shared with contexts that can't read CSS variables
// (Open Graph images). Keep in sync with the tokens in app/globals.css.
export const BRAND_COLORS = {
  yellow: "#f5cb42",
  ink: "#0b0c1e",
  paper: "#ffffff",
  purple: "#b58ae6",
  teal: "#6cc4d8",
} as const;

// From the agency brochure (ABOUT BUZZ CREW.pdf).
export const CONTACT_EMAIL = "buzzcrewofficial@gmail.com";

// International format, digits only (no "+", spaces or dashes), as wa.me requires.
// The agency's WhatsApp (0314 7971082); NEXT_PUBLIC_WHATSAPP_NUMBER can override it.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923147971082";

export const WHATSAPP_MESSAGE =
  "Hi Buzz Crew! I found you on your website and I'd like to talk about a project.";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`;

// Instagram handle from the brochure (@itsbuzzcrew). TODO: confirm the other profile URLs.
export const INSTAGRAM_URL = "https://www.instagram.com/itsbuzzcrew/";

export const SOCIAL_LINKS = [
  { label: "Instagram", href: INSTAGRAM_URL },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "TikTok", href: "https://www.tiktok.com/" },
] as const;
