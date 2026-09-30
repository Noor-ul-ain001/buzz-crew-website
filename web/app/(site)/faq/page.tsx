import CtaBand from "@/components/CtaBand";
import FaqSearch from "@/components/faq/FaqSearch";
import { getPublishedContent } from "@/lib/data/content";
import { FAQ_GROUPS } from "@/lib/data/mock-faqs";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about working with The Buzz Crew: pricing, contracts, timelines, social media, Meta Ads, websites and SEO.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = await getPublishedContent("faqs");
  const groups = FAQ_GROUPS.map((name) => ({ name, items: faqs.filter((item) => item.group === name) })).filter(
    (group) => group.items.length > 0,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Frequently asked questions</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Everything clients usually ask before working with us. Can&apos;t find your answer? Just ask.
        </p>
        <FaqSearch groups={groups} />
      </main>
      <CtaBand heading="Still have a question?" body="Send us a message and the crew will reply within 24 hours." />
    </>
  );
}
