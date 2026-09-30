import type { Author, BlogPost } from "@/lib/content/types";

// Mock blog posts until the FastAPI content endpoints exist. Newest first. Code blocks use
// ~~~ fences (valid GFM) so the Markdown can live in template literals without escaping.

const AUTHORS = {
  hamza: {
    name: "Hamza Qureshi",
    role: "Founder & Creative Director",
    photo: { url: "/mock/people/hamza-qureshi.svg", alt: "Hamza Qureshi" },
  },
  sana: {
    name: "Sana Malik",
    role: "Head of Social",
    photo: { url: "/mock/people/sana-malik.svg", alt: "Sana Malik" },
  },
  omar: {
    name: "Omar Farooq",
    role: "Web Lead",
    photo: { url: "/mock/people/omar-farooq.svg", alt: "Omar Farooq" },
  },
  danish: {
    name: "Danish Ali",
    role: "Performance Marketer",
    photo: { url: "/mock/people/danish-ali.svg", alt: "Danish Ali" },
  },
} satisfies Record<string, Author>;

type PostInput = Omit<BlogPost, "id" | "status" | "updatedAt" | "cover" | "seo"> & {
  coverUrl: string;
  coverAlt: string;
  seo?: BlogPost["seo"];
};

function post(input: PostInput, index: number): BlogPost {
  const { coverUrl, coverAlt, seo, ...rest } = input;
  return {
    ...rest,
    id: `post-${index + 1}`,
    status: "Published",
    updatedAt: input.publishedAt,
    cover: { url: coverUrl, alt: coverAlt },
    seo: seo ?? { metaTitle: "", metaDescription: "" },
  };
}

const POSTS: PostInput[] = [
  {
    slug: "local-seo-karachi-checklist",
    title: "Local SEO for Karachi businesses: a 2026 checklist",
    excerpt:
      "Most local customers never scroll past the map. Here's the checklist we use to get cafés, clinics and shops into Google's top three in Karachi.",
    category: "seo",
    tags: ["Local SEO", "Google Business Profile", "Karachi"],
    author: AUTHORS.hamza,
    publishedAt: "2026-09-22T06:00:00Z",
    readingMinutes: 7,
    coverUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&q=85",
    coverAlt: "Aerial view of a dense city neighbourhood",
    seo: {
      metaTitle: "Local SEO checklist for Karachi businesses (2026)",
      metaDescription:
        "A practical local SEO checklist for Karachi businesses: Google Business Profile, reviews, local pages and schema, from The Buzz Crew.",
    },
    bodyMarkdown: `When someone in Clifton searches for "bakery near me", Google shows a map with three businesses before any normal results. That box, the **local pack**, is where most local enquiries come from. This checklist is what we run through for every new local client.

![Diagram of a Google search for "bakery near me" showing a map and three listed businesses, with yours at the top](/mock/blog/local-pack-diagram.svg "The local pack sits above the normal results.")

## 1. Get your Google Business Profile right

Your profile matters more than your website for local searches. Start here:

- Choose the **most specific primary category** (for example "Pakistani restaurant", not just "Restaurant").
- Use your real business name. Adding keywords like "Best Bakery Karachi" breaks Google's guidelines and can get the profile suspended.
- Add opening hours, including Ramadan and Eid hours when they change.
- Upload at least ten recent photos: storefront, interior, team and products.

### Your address has to match everywhere

Google cross-checks your name, address and phone number (NAP) across the web. "Shop 4, Block 5, Clifton" on Google and "Plot 4-C, Clifton Block 5" on Facebook look like two different places. Pick one format and use it everywhere.

## 2. Reviews: ask every happy customer

Review count and recency are two of the strongest local ranking signals we see.

1. Create a short review link from your profile.
2. Put it on a QR code at the counter and in your WhatsApp follow-ups.
3. Reply to every review, good or bad, within a few days.

> "We went from 23 to 140 reviews in four months just by asking at the till. Calls from Google Maps doubled."
> — Bilal Ahmed, Chai Khana Co.

## 3. Give Google a page for every location

If you have branches in DHA and Gulshan, each one needs its own page on your website with its address, map, opening hours and photos. One "Locations" page listing everything isn't enough.

## 4. Add LocalBusiness structured data

Structured data tells Google exactly what your business is. Add this to each location page, with your own details:

~~~json
{
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": "Your Bakery",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Shop 4, Block 5, Clifton",
    "addressLocality": "Karachi",
    "addressCountry": "PK"
  },
  "telephone": "+92 21 1234567",
  "openingHours": "Mo-Su 09:00-23:00"
}
~~~

## 5. Track what matters

Rankings move every day. Instead, watch these monthly in your profile's Performance tab:

- calls from the profile,
- direction requests,
- website clicks.

If those are growing, your local SEO is working.
`,
  },
  {
    slug: "instagram-lessons-restaurants",
    title: "What we learned running Instagram for Pakistani restaurants",
    excerpt:
      "Food looks good on Instagram, but likes don't fill tables. The content, timing and captions that actually brought diners in.",
    category: "social-media",
    tags: ["Instagram", "Restaurants", "Content strategy"],
    author: AUTHORS.sana,
    publishedAt: "2026-09-08T06:00:00Z",
    readingMinutes: 6,
    coverUrl: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=85",
    coverAlt: "A colourful spread of dishes on a restaurant table",
    bodyMarkdown: `We've run Instagram for restaurants from small home kitchens to multi-branch cafés. Some posts got thousands of likes and no bookings; some plain-looking stories filled a Tuesday night. Here's what we learned.

## People follow for food, but book for reasons

Beautiful plates get likes. What gets bookings is a **reason to come this week**:

- a new dish that's only available for a limited time,
- a deal on a quiet night,
- an event, like live qawwali or a football screening.

## Post when people decide where to eat

Our best-performing slots across Karachi and Lahore were:

| Day | Time | Why |
| --- | --- | --- |
| Thursday | 6–8 pm | Weekend plans are being made |
| Friday | 12–1 pm | After Jummah, deciding on lunch |
| Sunday | 5–7 pm | Family dinner decisions |

## Stories do the selling

Grid posts build the brand; stories drive action. Use the link sticker for your menu and booking link every time, and keep a "Menu" highlight up to date.

> Treat your highlights like a mini website: Menu, Deals, Location, Reviews.

## Captions: say what, where and when

A caption like "Tag someone you'd share this with 😍" does nothing for footfall. Compare:

> **New: Smoked Beef Nihari.** Only at our DHA branch, weekends till Eid. Book a table from the link in our bio.

The second one tells people what it is, where to get it and when. That's the one that worked.

## What we'd tell every restaurant owner

1. Film short clips in the kitchen during service. Real beats staged.
2. Reply to every comment and DM within the hour during dinner time.
3. Repost diners' stories. It's free, trusted content.
`,
  },
  {
    slug: "meta-ads-budget-pkr",
    title: "Meta Ads budgets in PKR: how much should a small business spend?",
    excerpt:
      "PKR 20,000 a month or PKR 200,000? A simple way to set your Meta Ads budget from the number of customers you actually need.",
    category: "meta-ads",
    tags: ["Budgeting", "Lead generation", "Small business"],
    author: AUTHORS.danish,
    publishedAt: "2026-08-25T06:00:00Z",
    readingMinutes: 8,
    coverUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=85",
    coverAlt: "Marketing performance charts displayed on a laptop",
    bodyMarkdown: `"How much should we spend on ads?" is the first question every new client asks. The honest answer is: work backwards from the customers you need.

## Start from the customers, not the budget

You need three numbers:

1. **How many new customers** you want each month.
2. **Your close rate**: out of 10 enquiries, how many buy?
3. **Your likely cost per lead** in your industry.

![Funnel diagram: 120,000 people reached, 2,400 clicks, 180 leads](/mock/blog/ads-funnel-diagram.svg "A typical lead generation funnel for a local service business.")

### A worked example

A salon in Lahore wants **20 new bridal clients** a month. It closes 1 in 4 enquiries, so it needs about 80 leads. If leads cost around PKR 450:

~~~text
80 leads × PKR 450 = PKR 36,000 a month
~~~

That's the starting budget. Not a round number someone guessed.

## Typical cost per lead in Pakistan (2026)

These are ranges we've seen across our own campaigns. Yours will vary:

- **Restaurants and cafés:** PKR 150–400 per message or booking
- **Salons and clinics:** PKR 300–700 per lead
- **Real estate:** PKR 800–2,500 per qualified lead
- **B2B services:** PKR 1,500+ per lead

## Give it enough time to learn

Meta's delivery system needs about **50 results a week** per ad set to optimise well. If your budget can only buy 10 leads a week, run fewer ad sets rather than splitting the money thinly.

> Spend enough to learn, then scale what works. Don't spread PKR 20,000 across six campaigns.

## When to increase the budget

Raise spend by 20–30% at a time when:

- cost per lead has been stable for two weeks,
- your team is keeping up with follow-ups,
- leads are turning into customers.

If your sales team can't call leads back within an hour, more budget just means more wasted leads.
`,
  },
  {
    slug: "website-speed-4g-pakistan",
    title: "Why your website is slow on 4G in Pakistan (and how to fix it)",
    excerpt:
      "Most of your visitors are on mid-range Android phones and patchy 4G. Four fixes that make the biggest difference to load times.",
    category: "web-development",
    tags: ["Performance", "Core Web Vitals", "Next.js"],
    author: AUTHORS.omar,
    publishedAt: "2026-08-11T06:00:00Z",
    readingMinutes: 7,
    coverUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=85",
    coverAlt: "Lines of code on a laptop screen",
    bodyMarkdown: `Your website probably feels fast on office Wi-Fi. Your customers are on a three-year-old Android phone on 4G in a busy market. Here's what slows it down for them.

## 1. Images are almost always the problem

A single 4 MB hero photo takes several seconds on a weak connection. Fix it by:

- serving **WebP or AVIF** instead of JPEG or PNG,
- sizing images for the screen they're shown on,
- lazy-loading anything below the first screen.

In Next.js, the Image component does most of this for you:

~~~tsx
import Image from "next/image";

export function Hero() {
  return (
    <Image
      src="/images/storefront.jpg"
      alt="Our Clifton storefront at night"
      width={1200}
      height={630}
      priority
      sizes="100vw"
    />
  );
}
~~~

## 2. Too many third-party scripts

Chat widgets, several analytics tools, heatmaps, pop-ups: each one adds weight. We regularly find sites loading **five tracking scripts** that nobody looks at. Remove what you don't use, and load the rest only after consent.

## 3. Web fonts that block the page

Loading four weights of two fonts can delay text from appearing. Use one family, two weights, and let the browser show a fallback font while it loads.

## 4. Cheap hosting far away

A server in the US adds noticeable delay for visitors in Pakistan. A CDN with edge locations nearer your customers makes every page faster.

> Test on a real mid-range phone over mobile data, not just in your browser's developer tools.

## How to check your site

Run it through PageSpeed Insights and look at the **mobile** tab. Aim for:

| Metric | Good |
| --- | --- |
| Largest Contentful Paint | under 2.5 s |
| Interaction to Next Paint | under 200 ms |
| Cumulative Layout Shift | under 0.1 |
`,
  },
  {
    slug: "bilingual-seo-uae",
    title: "Bilingual SEO in the UAE: ranking in English and Arabic",
    excerpt:
      "Half your UAE customers may search in Arabic. How to structure a bilingual site so both languages rank, without duplicate content problems.",
    category: "seo",
    tags: ["UAE", "Arabic", "hreflang"],
    author: AUTHORS.hamza,
    publishedAt: "2026-07-28T06:00:00Z",
    readingMinutes: 6,
    coverUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=85",
    coverAlt: "Open book with Arabic-style script on a desk",
    bodyMarkdown: `A clinic in Abu Dhabi told us their English site ranked well, but Arabic searches for the same services showed only competitors. The fix wasn't more content. It was structure.

## Give each language its own URL

Don't switch language with a cookie or a script. Search engines need a separate, crawlable URL for each version:

- example.ae/en/dental-implants
- example.ae/ar/زراعة-الأسنان

## Tell Google which pages are translations

Use hreflang tags so Google shows the right language to the right searcher:

~~~html
<link rel="alternate" hreflang="en-AE" href="https://example.ae/en/dental-implants" />
<link rel="alternate" hreflang="ar-AE" href="https://example.ae/ar/dental-implants" />
<link rel="alternate" hreflang="x-default" href="https://example.ae/en/dental-implants" />
~~~

## Translate for search, not word for word

People don't search in Arabic the way a translation tool writes it. Research Arabic keywords separately. The most common phrasing is often more colloquial than you'd expect.

> A direct translation of your English page is a starting point, not a finished Arabic page.

## Right-to-left needs real design work

An Arabic page needs a mirrored layout: navigation, icons with direction, and forms. A left-to-right layout with Arabic text feels broken and hurts engagement.

## Checklist

1. Separate URLs per language.
2. hreflang on every translated page.
3. Arabic keyword research.
4. A proper right-to-left layout.
5. Google Business Profile details in both languages.
`,
  },
  {
    slug: "reels-vs-carousels",
    title: "Reels vs carousels: what actually drives enquiries",
    excerpt:
      "Reels win reach, carousels win saves. We compared six months of client posts to see which format brings in messages and leads.",
    category: "social-media",
    tags: ["Instagram", "Reels", "Content strategy"],
    author: AUTHORS.sana,
    publishedAt: "2026-07-14T06:00:00Z",
    readingMinutes: 5,
    coverUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=85",
    coverAlt: "A phone displaying a social media profile",
    bodyMarkdown: `Every few months someone declares that "only Reels work now". We looked at six months of posts across our clients to see what actually leads to enquiries.

## What we compared

We tracked reach, saves, profile visits and **DMs or leads** for every Reel and carousel across twelve accounts.

## The short version

- **Reels** reached about three times more people, most of them new.
- **Carousels** got twice as many saves and more profile visits per view.
- **Enquiries** came from both, but carousels converted better for services with a considered purchase, like clinics and interiors.

## When to use Reels

Use Reels to get discovered: behind the scenes, transformations and quick tips. Keep the first two seconds strong and add captions, since most people watch without sound.

## When to use carousels

Use carousels to explain and persuade: price guides, before-and-after steps, FAQs. End with a clear call to action slide.

> Reels bring people to your profile. Carousels convince them to message you.

## Our recommended mix

For most service businesses we now plan each week like this:

1. Two Reels for reach.
2. One carousel that answers a buying question.
3. Daily stories with a clear link or reply prompt.
`,
  },
  {
    slug: "meta-lead-ads-quality",
    title: "Lead ads that don't waste your sales team's time",
    excerpt:
      "Cheap leads are easy to get and hard to close. The form settings and follow-up habits that improve lead quality from Meta lead ads.",
    category: "meta-ads",
    tags: ["Lead generation", "Forms", "CRM"],
    author: AUTHORS.danish,
    publishedAt: "2026-06-30T06:00:00Z",
    readingMinutes: 6,
    coverUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=85",
    coverAlt: "Business dashboards and charts on a computer screen",
    bodyMarkdown: `Meta lead ads can produce leads for a few hundred rupees each. The catch: many of them never pick up the phone. Here's how we fix lead quality without doubling the cost.

## Switch to "Higher intent" forms

The default form auto-fills details and submits in one tap, which makes accidental leads easy. The **Higher intent** form type adds a review step before submitting. Expect fewer leads, but more real ones.

## Ask one qualifying question

A single multiple-choice question filters out a lot of noise:

- "When are you planning to buy?" (This month / In 3 months / Just browsing)
- "What's your budget?" with realistic ranges

## Call back within five minutes

Speed matters more than anything else. Leads called within five minutes are far more likely to answer than leads called the next day.

> Connect your lead forms to WhatsApp or your CRM so no one has to download a spreadsheet.

## Send lead quality back to Meta

Mark which leads became customers and send that back to Meta with the Conversions API. The system then optimises for people like your customers, not just people who fill in forms.
`,
  },
  {
    slug: "contact-forms-that-convert",
    title: "Contact forms that people actually finish",
    excerpt:
      "Every extra field costs you enquiries. How to design a contact form that's short, clear and accessible, with examples from our own site.",
    category: "web-development",
    tags: ["Forms", "Accessibility", "Conversion"],
    author: AUTHORS.omar,
    publishedAt: "2026-06-16T06:00:00Z",
    readingMinutes: 5,
    coverUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=85",
    coverAlt: "A person reviewing a form and notes at a desk",
    bodyMarkdown: `Your contact form is the last step between a visitor and a lead. Small details decide whether people finish it.

## Ask only what you need

For a first enquiry, you rarely need more than:

- name,
- email or phone,
- a short message.

Everything else (budget, services, company) should be optional or asked later.

## Labels, not placeholders

Placeholder text disappears as soon as someone types, and it's often too faint to read. Always use a visible label above each field.

## Errors that help

"Invalid input" doesn't tell anyone what to do. Say what's wrong and how to fix it:

> Please enter a valid email address, e.g. name@company.com.

Show errors next to the field, and move focus to the first one when the form is submitted.

## Make it work with a keyboard and screen reader

- Every field needs a label connected to it.
- Required fields should say so in text, not only with a red asterisk.
- The success message should be announced, not just shown.

## Offer a faster route

Some people don't want to fill in a form at all. A WhatsApp button next to the form catches them.
`,
  },
  {
    slug: "google-business-profile-uk-clinics",
    title: "Google Business Profile for UK clinics: a practical setup guide",
    excerpt:
      "Physios, dentists and aesthetics clinics live or die by the map pack. A step-by-step setup that respects healthcare advertising rules.",
    category: "seo",
    tags: ["Google Business Profile", "Local SEO", "Healthcare"],
    author: AUTHORS.hamza,
    publishedAt: "2026-05-26T06:00:00Z",
    readingMinutes: 6,
    coverUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=85",
    coverAlt: "A bright modern clinic reception interior",
    bodyMarkdown: `For a private clinic in the UK, the Google Business Profile is often the first thing a new patient sees. Here's how we set them up.

## Choose categories carefully

Pick the most specific primary category, like "Physiotherapist" or "Cosmetic dentist", then add secondary categories for other services you actually offer.

## Services and booking

- List each treatment as a service with a short, factual description.
- Add your online booking link so patients can book straight from Google.
- Keep prices accurate if you show them.

## Reviews and healthcare rules

Ask patients for reviews after their appointment, but never offer discounts in return. Keep replies general: don't confirm someone is a patient or mention their treatment.

> In healthcare, a reply that says "thanks for choosing us for your knee treatment" can itself be a privacy problem.

## Photos patients want to see

Real photos of your reception, treatment rooms and team help nervous patients feel comfortable. Avoid before-and-after images unless you're sure they comply with advertising rules for your profession.

## Keep it updated

Post updates monthly (new clinicians, seasonal clinics, opening hours) and answer questions in the Q&A section before others answer for you.
`,
  },
];

export const MOCK_POSTS: BlogPost[] = POSTS.map(post);
