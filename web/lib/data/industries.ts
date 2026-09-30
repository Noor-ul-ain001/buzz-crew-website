import type { Industry as WorkIndustry } from "@/lib/content/work-labels";
import type { LeadService } from "@/lib/leads/types";

// The industries from the brochure's "Where we've worked" page (ABOUT BUZZ CREW.pdf), each
// with the brochure's own one-line description. Clients are only listed where the brochure
// names one that clearly belongs to the industry; logos live in public/clients.

export type Industry = {
  slug: string;
  /** Short name for links and breadcrumbs, e.g. "Farmhouses". */
  name: string;
  /** The brochure's description, e.g. "Event & picnic venues". */
  tagline: string;
  title: string;
  metaDescription: string;
  intro: string;
  challenges: { title: string; body: string }[];
  services: { service: LeadService; why: string }[];
  clients: { name: string; logo: string }[];
  /** The matching filter on /work, when there is one. */
  workFilter?: WorkIndustry;
  ctaHeading: string;
};

const INDUSTRIES: Industry[] = [
  {
    slug: "food-and-beverages",
    name: "Food & beverages",
    tagline: "Restaurants, catering, cafés and home kitchens",
    title: "Marketing for food and beverage brands",
    metaDescription:
      "Social media, content and campaigns for restaurants, caterers, cafés and home kitchens, from The Buzz Crew in Karachi.",
    intro:
      "From home kitchens to full restaurants and caterers, we create content people want to stop for, and campaigns that turn attention into orders and bookings.",
    challenges: [
      { title: "Great food, quiet feed", body: "The dishes are good, but the photos and videos don't do them justice." },
      { title: "Busy weekends, slow weekdays", body: "Demand bunches up, and there's no plan to fill the quieter days." },
      { title: "Orders scattered everywhere", body: "Enquiries arrive by DMs, calls and messages with no clear way to order." },
    ],
    services: [
      { service: "Video & Content Production", why: "Reels and shoots that show your food, your kitchen and the people behind it." },
      { service: "Digital Marketing", why: "A content calendar and local campaigns built around real goals, not vanity metrics." },
      { service: "Creative & Graphic Design", why: "Menus, offers and social creatives that look unmistakably like your brand." },
    ],
    clients: [
      { name: "Farzana's Kitchen", logo: "/clients/farzanas-kitchen.webp" },
      { name: "Halki Aanch by Ayesha", logo: "/clients/halki-aanch.webp" },
      { name: "Mr. Bawarchi", logo: "/clients/mr-bawarchi.webp" },
      { name: "Nawab's Dynasty", logo: "/clients/nawabs-dynasty.webp" },
    ],
    workFilter: "food_beverages",
    ctaHeading: "Let's tell your food's story.",
  },
  {
    slug: "farmhouses",
    name: "Farmhouses",
    tagline: "Event and picnic venues",
    title: "Marketing for farmhouses and event venues",
    metaDescription:
      "Content, social media and bookings for farmhouses, event and picnic venues, from The Buzz Crew in Karachi.",
    intro:
      "We help farmhouses and event venues show the experience before guests arrive, and make booking the next event or picnic simple.",
    challenges: [
      { title: "Hard to picture the day", body: "Guests can't imagine their event from a few static photos." },
      { title: "Seasonal bookings", body: "Weekends and holidays fill up, while the rest of the calendar sits empty." },
      { title: "Bookings by phone only", body: "Every enquiry needs a call, and details get lost along the way." },
    ],
    services: [
      { service: "Video & Content Production", why: "Cinematic reels and photos of the venue, the setup and real events." },
      { service: "Digital Marketing", why: "Campaigns planned around the booking calendar, not just follower counts." },
      { service: "Web / Software Development", why: "A clear website with availability and a simple way to enquire." },
    ],
    clients: [
      { name: "Black Gold Farm", logo: "/clients/black-gold-farm.webp" },
      { name: "The Farm Villa", logo: "/clients/the-farm-villa.webp" },
    ],
    workFilter: "farmhouses",
    ctaHeading: "Let's fill your calendar.",
  },
  {
    slug: "healthcare-and-dental",
    name: "Healthcare & dental",
    tagline: "Automation systems for clinics and hospitals",
    title: "Automation and marketing for clinics and hospitals",
    metaDescription:
      "Automation systems, websites and patient-friendly content for clinics and hospitals, from The Buzz Crew.",
    intro:
      "We build automation systems that take routine work off your team, alongside websites and content that help patients find and trust you.",
    challenges: [
      { title: "Staff buried in admin", body: "Appointments, reminders and follow-ups eat time that should go to patients." },
      { title: "Enquiries that slip through", body: "Calls and messages go unanswered after hours, and patients book elsewhere." },
      { title: "Hard to stand out", body: "Patients compare clinics online, and yours doesn't show what makes it different." },
    ],
    services: [
      { service: "AI & Automation", why: "Booking, reminder and follow-up flows that run without extra staff." },
      { service: "Web / Software Development", why: "A fast, accessible website and patient systems built around your workflow." },
      { service: "Digital Marketing", why: "Calm, trustworthy content that explains your services and introduces your team." },
    ],
    clients: [],
    workFilter: "healthcare_dental",
    ctaHeading: "Let's give your team time back.",
  },
  {
    slug: "education",
    name: "Education",
    tagline: "Enrolment-focused marketing for schools and institutes",
    title: "Enrolment marketing for schools and institutes",
    metaDescription:
      "Enrolment-focused marketing, content and websites for schools and institutes, from The Buzz Crew in Karachi.",
    intro:
      "We plan marketing around your admissions calendar, so the right families and students hear from you when they're choosing.",
    challenges: [
      { title: "Admissions come in waves", body: "Enquiries peak for a few weeks, and the rest of the year goes quiet." },
      { title: "Every school looks the same", body: "Parents and students struggle to see what makes you different." },
      { title: "Enquiries without follow-up", body: "Interested families don't hear back quickly enough to apply." },
    ],
    services: [
      { service: "Digital Marketing", why: "Campaigns timed to your admissions calendar, measured by enquiries and enrolments." },
      { service: "Video & Content Production", why: "Real campus life, teachers and students, filmed in-house." },
      { service: "Branding", why: "A clear identity that parents and students recognise and remember." },
    ],
    clients: [],
    workFilter: "education",
    ctaHeading: "Let's fill your next intake.",
  },
  {
    slug: "e-commerce",
    name: "E-commerce",
    tagline: "Customised e-commerce brand development",
    title: "E-commerce brand development",
    metaDescription:
      "Customised e-commerce brand development: branding, online stores and campaigns, from The Buzz Crew in Karachi.",
    intro:
      "We build e-commerce brands from the ground up: the identity, the store and the campaigns that bring customers back.",
    challenges: [
      { title: "A store without a brand", body: "Products are listed, but nothing makes customers remember you." },
      { title: "Traffic that doesn't buy", body: "Visitors arrive from ads and social, then leave without ordering." },
      { title: "One-time customers", body: "Buyers order once and never hear from you again." },
    ],
    services: [
      { service: "Branding", why: "An identity and tone of voice that set your products apart." },
      { service: "Web / Software Development", why: "A fast, customised online store that makes ordering easy." },
      { service: "Digital Marketing", why: "Campaigns and content that bring the right customers back again." },
    ],
    clients: [],
    workFilter: "ecommerce",
    ctaHeading: "Let's build your brand online.",
  },
];

export async function getIndustries(): Promise<Industry[]> {
  return INDUSTRIES;
}

export async function getIndustry(slug: string): Promise<Industry | undefined> {
  return INDUSTRIES.find((industry) => industry.slug === slug);
}
