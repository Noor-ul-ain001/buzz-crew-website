import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/metadata";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: `The terms that apply when you use ${SITE_NAME} website.`,
  path: "/terms",
});

// TODO: placeholder text. Replace with the reviewed terms before launch.
const sections: LegalSection[] = [
  {
    id: "about-these-terms",
    title: "About these terms",
    body: (
      <p>
        These terms apply to your use of this website. By using it, you agree to them. If
        you do not agree, please do not use the website.
      </p>
    ),
  },
  {
    id: "our-services",
    title: "Our services",
    body: (
      <p>
        Information on this website describes the services {SITE_NAME} offers. It is not an
        offer to provide services. Any project is governed by a separate written agreement
        or proposal accepted by both parties.
      </p>
    ),
  },
  {
    id: "inquiries",
    title: "Inquiries and quotes",
    body: (
      <p>
        Sending an inquiry does not create a contract. Budget ranges and estimates shown on
        this website are indicative only and are confirmed in a written proposal.
      </p>
    ),
  },
  {
    id: "ai-tools",
    title: "AI-powered tools",
    body: (
      <p>
        Some tools on this website use artificial intelligence. Their output is labelled as
        AI-generated, is provided for general information only and does not commit{" "}
        {SITE_NAME} to any price, timeline or result.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <p>
        The content, design and case studies on this website belong to {SITE_NAME} or its
        clients and are used with permission. You may not copy or reuse them without our
        written consent.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <ul>
        <li>do not use the website for anything unlawful;</li>
        <li>do not submit false information or other people&apos;s details;</li>
        <li>do not try to disrupt, overload or gain unauthorised access to the website.</li>
      </ul>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        We work to keep this website accurate and available, but we provide it &ldquo;as
        is&rdquo; and cannot guarantee it will always be error-free or uninterrupted.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: (
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains how we handle the personal
        information you share with us.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="Not yet published"
      intro={<p>Please read these terms carefully before using {SITE_NAME} website.</p>}
      sections={sections}
    />
  );
}
