import type { CaseStudyCardData, CaseStudyDetail, CaseStudyPage } from "@/lib/content/case-studies";
import type { WorkFilters } from "@/lib/content/work-filters";

// Built-in copy of the published projects, used only when the API can't be reached (for
// example while only the website is deployed). Keep in step with api/app/seed_case_studies.py;
// once the API is live, its data always takes precedence.

type Project = Omit<CaseStudyDetail, "related" | "seo_title" | "seo_description" | "cover" | "media" | "headline_metrics" | "results" | "updated_at"> & {
  handle: string;
  metrics: [value: string, label: string, period: string][];
};

const PUBLISHED_AT = "2026-09-30T00:00:00Z";

const PROJECTS: Project[] = [
  {
    slug: "islamabad-now",
    client_name: "Islamabad Now",
    handle: "islamabadnowpk",
    title: "A verified city news brand with 156K followers",
    summary: "Daily Islamabad news on Instagram, grown into a verified account followed by 156K people.",
    industry: "media_news",
    country: "pakistan",
    services: ["social_media"],
    challenge_md:
      "Islamabad Now covers everything happening in the capital. Breaking news moves fast, so every post has to be accurate, on-brand and out quickly.",
    strategy_md:
      "- One recognisable template for every story\n- Urdu headlines that read at a glance in the feed\n- A steady daily publishing rhythm, with video for the biggest stories",
    execution_md: "Branded news cards and short videos, published through the day across politics, civic updates and local stories.",
    metrics: [
      ["156K", "Instagram followers", "verified account"],
      ["2,515", "posts published", "on the feed"],
    ],
    project_period: null,
    before_after: null,
    testimonial: null,
    published_at: PUBLISHED_AT,
  },
  {
    slug: "awami-web",
    client_name: "AwamiWeb",
    handle: "awami_web",
    title: "Timely Pakistan news for 102K followers",
    summary: "A national news page with more than 6,000 posts and 102K followers on Instagram.",
    industry: "media_news",
    country: "pakistan",
    services: ["social_media"],
    challenge_md:
      "AwamiWeb has published news since 2010. Its Instagram needed to keep pace with the website and stand out in a crowded news feed.",
    strategy_md:
      "- A bold, consistent AwamiWeb frame on every post\n- Bilingual headlines for a wider audience\n- High-volume publishing, prioritising stories people share",
    execution_md: "Designed news posts and reels covering sport, national affairs, technology and civic updates.",
    metrics: [
      ["102K", "Instagram followers", "and growing"],
      ["6,113", "posts published", "on the feed"],
    ],
    project_period: null,
    before_after: null,
    testimonial: null,
    published_at: PUBLISHED_AT,
  },
  {
    slug: "mercantile-pakistan",
    client_name: "Mercantile Pakistan",
    handle: "mercantile.pak",
    title: "Launch campaigns for Apple's authorised distributor",
    summary: "Product launches, customer stories and raffles for Mercantile Pakistan, followed by 101K people.",
    industry: "retail",
    country: "pakistan",
    services: ["social_media"],
    challenge_md:
      "Mercantile is Apple's authorised distributor and service provider in Pakistan. Each launch needs clear, official messaging that still feels exciting.",
    strategy_md:
      "- Launch content for every new iPhone\n- Highlights for testimonials, raffles and awards\n- Store and customer moments alongside product posts",
    execution_md: "Launch visuals, pricing announcements, happy-customer posts and campaign highlights on Instagram.",
    metrics: [
      ["101K", "Instagram followers", "on the brand account"],
      ["1,253", "posts published", "on the feed"],
    ],
    project_period: null,
    before_after: null,
    testimonial: null,
    published_at: PUBLISHED_AT,
  },
  {
    slug: "mera-pakistan",
    client_name: "Mera Pakistan",
    handle: "merapakistannews",
    title: "Building a new news brand from its first post",
    summary: "A new digital news creator, set up with a strong visual identity from day one.",
    industry: "media_news",
    country: "pakistan",
    services: ["social_media"],
    challenge_md: "Mera Pakistan started from zero and needed to look credible next to established news pages straight away.",
    strategy_md:
      "- A distinctive green and white news template\n- Urdu headlines designed for the feed\n- Consistent posting to build an audience from scratch",
    execution_md: "Branded news cards covering national stories, public figures and sport.",
    metrics: [
      ["2,946", "Instagram followers", "since launch"],
      ["141", "posts published", "on the feed"],
    ],
    project_period: null,
    before_after: null,
    testimonial: null,
    published_at: PUBLISHED_AT,
  },
];

function toCard({ handle, metrics, ...project }: Project): CaseStudyCardData {
  return {
    slug: project.slug,
    client_name: project.client_name,
    title: project.title,
    summary: project.summary,
    industry: project.industry,
    country: project.country,
    services: project.services,
    headline_metrics: metrics.map(([value, label, period]) => ({ value, label, period, starting_value: null, is_headline: true })),
    cover: {
      url: `/work/${project.slug}-cover.webp`,
      alt: `The @${handle} Instagram profile with its follower count`,
      width: 750,
      height: 469,
    },
  };
}

const CARDS = PROJECTS.map(toCard);

function facets(): CaseStudyPage["facets"] {
  const count = (values: string[]) =>
    [...new Set(values)].map((value) => ({ value, count: values.filter((item) => item === value).length }));
  return {
    industries: count(CARDS.map((card) => card.industry)),
    services: count(CARDS.flatMap((card) => card.services)),
  };
}

export function fallbackPage(filters: WorkFilters, pageSize: number): CaseStudyPage {
  const matching = CARDS.filter(
    (card) => (!filters.industry || card.industry === filters.industry) && (!filters.service || card.services.includes(filters.service)),
  );
  const start = (filters.page - 1) * pageSize;
  return { items: matching.slice(start, start + pageSize), total: matching.length, page: filters.page, facets: facets() };
}

export function fallbackCaseStudy(slug: string): CaseStudyDetail | undefined {
  const project = PROJECTS.find((item) => item.slug === slug);
  if (!project) return undefined;
  const card = toCard(project);
  // Same industry first, then the rest, as the API orders related projects.
  const related = CARDS.filter((other) => other.slug !== slug)
    .sort((a, b) => Number(b.industry === card.industry) - Number(a.industry === card.industry))
    .slice(0, 3);
  return {
    ...card,
    challenge_md: project.challenge_md,
    strategy_md: project.strategy_md,
    execution_md: project.execution_md,
    project_period: project.project_period,
    results: card.headline_metrics,
    media: [
      {
        kind: "image",
        image: { url: `/work/${slug}-profile.webp`, alt: `The full @${project.handle} Instagram profile and recent posts`, width: 750, height: 1334 },
        video_url: null,
        description: null,
      },
    ],
    before_after: null,
    testimonial: null,
    related,
    seo_title: `${project.client_name}: ${project.title}`.slice(0, 60),
    seo_description: project.summary.slice(0, 160),
    published_at: project.published_at,
    updated_at: project.published_at,
  };
}

export function fallbackSlugs(): { slug: string; updated_at: string }[] {
  return PROJECTS.map((project) => ({ slug: project.slug, updated_at: project.published_at }));
}
