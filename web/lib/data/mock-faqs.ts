import type { FaqItem } from "@/lib/content/types";

// Mock FAQs, grouped for the /faq page. Placeholder answers: review before launch.

export const FAQ_GROUPS = ["Working with us", "Pricing and contracts", "Social media and ads", "Websites and SEO"] as const;

const ITEMS: [group: (typeof FAQ_GROUPS)[number], question: string, answer: string][] = [
  ["Working with us", "Where are you based, and who do you work with?", "We're based in Karachi and work with brands across Pakistan, the UAE and the UK. Most of our work is remote, with in-person shoots and meetings in Karachi."],
  ["Working with us", "How quickly can you start?", "Most projects start within one to two weeks of signing. Urgent launches, such as a new branch opening, can often start sooner."],
  ["Working with us", "Who will I be working with day to day?", "Every client has one account lead who knows your business and pulls in designers, developers and ad specialists as needed."],
  ["Working with us", "How do we communicate?", "Usually a shared WhatsApp group for quick questions, plus a monthly call to review results. We reply within one working day."],
  ["Pricing and contracts", "How much do your services cost?", "Every project is quoted on its scope. After a short call we'll send a fixed quote."],
  ["Pricing and contracts", "Do you have minimum contract lengths?", "Monthly retainers have a three-month minimum, because social media and SEO take time to show results. After that, it's a rolling month."],
  ["Pricing and contracts", "Can you invoice in AED or GBP?", "Yes. We invoice clients in the UAE in AED and clients in the UK in GBP."],
  ["Pricing and contracts", "Is ad spend included in your fee?", "No. Ad spend is paid directly to Meta or Google from your own account, so you always keep full control and visibility of it."],
  ["Social media and ads", "Do you create the content or do we?", "We plan, shoot and edit content for you. If you have your own photos or videos, we'll use them too."],
  ["Social media and ads", "How soon will Meta Ads bring in leads?", "Most campaigns bring in their first leads within a week. It usually takes three to four weeks to find the best-performing audiences and ads."],
  ["Social media and ads", "Can you manage our TikTok as well?", "Yes, as part of a social media retainer. We'll recommend the platforms that suit your audience best."],
  ["Social media and ads", "Who owns the ad accounts and pages?", "You do. We work inside your accounts with partner access, so you keep everything if we stop working together."],
  ["Websites and SEO", "How long does a new website take?", "A typical business website takes four to six weeks from kick-off to launch. Larger sites or online stores take longer."],
  ["Websites and SEO", "Will I be able to update the website myself?", "Yes. We build on a content management system and show you how to edit pages, blog posts and images."],
  ["Websites and SEO", "How long does SEO take to work?", "You'll usually see early movement in two to three months and stronger results in six. Local SEO can be faster."],
  ["Websites and SEO", "Do you build websites in Arabic?", "Yes. We build bilingual English and Arabic websites with proper right-to-left layouts and Arabic SEO."],
];

export const MOCK_FAQS: FaqItem[] = ITEMS.map(([group, question, answer], index) => ({
  id: `faq-${index + 1}`,
  group,
  question,
  answer,
  // One draft so the admin list shows both states.
  status: index === 10 ? "Draft" : "Published",
  updatedAt: "2026-09-01T09:00:00Z",
}));
