import type { LeadService } from "@/lib/leads/types";

// Mock industry landing pages until the CMS exists. Case study figures are placeholders:
// replace them with real, client-approved results before launch.

export type Industry = {
  slug: string;
  /** Short name for links and breadcrumbs, e.g. "Restaurants". */
  name: string;
  title: string;
  metaDescription: string;
  intro: string;
  heroStat: { value: string; label: string };
  painPoints: { title: string; body: string }[];
  services: { service: LeadService; why: string }[];
  caseStudies: { client: string; title: string; metric: string; metricLabel: string; summary: string }[];
  ctaHeading: string;
};

const INDUSTRIES: Industry[] = [
  {
    slug: "restaurant-marketing-karachi",
    name: "Restaurants",
    title: "Restaurant marketing in Karachi",
    metaDescription:
      "Instagram, Meta Ads and local SEO for Karachi restaurants and cafés. Fill more tables on quiet nights with The Buzz Crew.",
    intro:
      "From home kitchens to multi-branch cafés, we help Karachi restaurants fill tables on quiet nights, sell out new dishes and get found on Google Maps.",
    heroStat: { value: "2×", label: "more calls from Google Maps for Chai Khana Co. in four months" },
    painPoints: [
      { title: "Busy weekends, empty weekdays", body: "Friday and Saturday are packed, but Monday to Thursday barely cover costs." },
      { title: "Lots of likes, few bookings", body: "Your food looks great on Instagram, but likes aren't turning into tables or orders." },
      { title: "Invisible on Google Maps", body: "People searching 'restaurants near me' in DHA or Clifton see your competitors first." },
      { title: "No time to post", body: "Running a kitchen leaves no time to plan content, shoot Reels and reply to messages." },
    ],
    services: [
      { service: "Social Media", why: "Weekly Reels and stories shot in your kitchen, with captions that give people a reason to visit this week." },
      { service: "Meta Ads", why: "Targeted offers for quiet nights, shown to people within a few kilometres of each branch." },
      { service: "SEO", why: "A complete Google Business Profile and review strategy so you appear in the map pack." },
    ],
    caseStudies: [
      { client: "Chai Khana Co.", title: "Launching a third café", metric: "140", metricLabel: "Google reviews in four months", summary: "A launch campaign on Instagram and Meta Ads, plus a review drive at the counter." },
      { client: "Crumbs Bakery", title: "Bringing an inactive Instagram back to life", metric: "3×", metricLabel: "more custom cake orders by DM", summary: "Consistent Reels of cakes being made, and a clear order process in stories." },
    ],
    ctaHeading: "Let's fill your tables on a Tuesday.",
  },
  {
    slug: "real-estate-marketing-dubai",
    name: "Real estate",
    title: "Real estate marketing in Dubai",
    metaDescription:
      "Lead generation, landing pages and bilingual SEO for Dubai real estate agencies and developers. Serious buyers, not just clicks.",
    intro:
      "We help Dubai agencies and developers generate qualified buyer leads for off-plan and ready properties, in English and Arabic.",
    heroStat: { value: "AED 38", label: "average cost per qualified lead for Nuaimi Properties" },
    painPoints: [
      { title: "Cheap leads that never answer", body: "Lead ads bring in hundreds of form fills, but most never pick up the phone." },
      { title: "One page for every project", body: "Each new launch needs its own landing page, and your website can't keep up." },
      { title: "Missing Arabic searchers", body: "Your site only ranks in English, so Arabic-speaking buyers find other agencies." },
      { title: "No idea which ads sell", body: "You can't tell which campaigns lead to viewings and which just use up budget." },
    ],
    services: [
      { service: "Meta Ads", why: "Higher-intent lead forms with qualifying questions, so your agents call real buyers." },
      { service: "Web & Software", why: "Fast landing pages for every launch, connected straight to your CRM." },
      { service: "SEO", why: "Bilingual English and Arabic pages with proper hreflang and right-to-left layouts." },
    ],
    caseStudies: [
      { client: "Nuaimi Properties", title: "Off-plan launch landing pages", metric: "4.2%", metricLabel: "enquiry rate on project pages", summary: "A page per development with floor plans, payment plans and WhatsApp enquiries." },
      { client: "Farouk Trading", title: "A bilingual corporate website", metric: "2×", metricLabel: "organic enquiries in six months", summary: "An English and Arabic website with a product catalogue and enquiry forms." },
    ],
    ctaHeading: "Get buyers, not just form fills.",
  },
  {
    slug: "clinic-marketing-uk",
    name: "Private clinics",
    title: "Marketing for private clinics in the UK",
    metaDescription:
      "Local SEO, websites and patient-friendly social media for UK physios, dentists and aesthetics clinics.",
    intro:
      "We help independent physios, dentists and aesthetics clinics across the UK get more bookings from Google, while staying within healthcare advertising rules.",
    heroStat: { value: "65%", label: "of new Brooks Physio patients now find them on Google" },
    painPoints: [
      { title: "Losing patients to chains", body: "Bigger clinic groups outrank you on Google, even in your own town." },
      { title: "A website that's hard to book from", body: "Patients have to call during opening hours because online booking is buried or missing." },
      { title: "Worried about the rules", body: "You're not sure what you're allowed to say in ads, reviews and before-and-after photos." },
      { title: "No time for social media", body: "Clinicians are busy with patients, so your social accounts go quiet for months." },
    ],
    services: [
      { service: "SEO", why: "Local SEO and Google Business Profile management focused on your treatments and town." },
      { service: "Web & Software", why: "A fast, accessible website with online booking on every page." },
      { service: "Social Media", why: "Calm, reassuring content that introduces your team and explains treatments." },
    ],
    caseStudies: [
      { client: "Brooks Physio", title: "From page two to the map pack", metric: "65%", metricLabel: "of new patients from Google", summary: "A new mobile-friendly website and a steady review strategy." },
      { client: "Saeed Dental Clinic", title: "Filling a new clinic's diary", metric: "3 months", metricLabel: "to a fully booked diary", summary: "A bilingual website with online booking and local SEO from day one." },
    ],
    ctaHeading: "More bookings, fewer empty appointment slots.",
  },
];

export async function getIndustries(): Promise<Industry[]> {
  return INDUSTRIES;
}

export async function getIndustry(slug: string): Promise<Industry | undefined> {
  return INDUSTRIES.find((industry) => industry.slug === slug);
}
