import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/metadata";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects the details you share with us.`,
  path: "/privacy",
});

// TODO: placeholder text. Replace with the reviewed policy before launch.
const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        {SITE_NAME} is a digital agency based in Karachi, Pakistan, working with clients in
        Pakistan, the United Arab Emirates and the United Kingdom. We are responsible for the
        personal information you share with us through this website.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>When you send us an inquiry, we collect:</p>
        <ul>
          <li>your name and email address;</li>
          <li>your phone number and business name, if you provide them;</li>
          <li>your country, the services you are interested in and your budget range;</li>
          <li>the message you write to us.</li>
        </ul>
        <p>
          We also collect basic, non-identifying usage information (such as pages visited)
          to understand how the website performs.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use your information",
    body: (
      <ul>
        <li>to reply to your inquiry and discuss your project;</li>
        <li>to prepare proposals you have asked us for;</li>
        <li>to improve our website and services.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <p>
        We do not sell your information. We use trusted service providers to host this
        website, store inquiries and send email. They process your information only on our
        instructions.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and tracking",
    body: (
      <p>
        We use analytics and advertising tools to measure how our website and campaigns
        perform. Where the law requires it, for example for visitors in the United Kingdom,
        these tools load only after you give consent.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep inquiry details for as long as we need them to respond and to manage any
        resulting project, and then delete them.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <p>
        You can ask us for a copy of the information we hold about you, ask us to correct
        it, or ask us to delete it. Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will respond promptly.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The date at the top of this page shows
        when it last changed.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="Not yet published"
      intro={
        <p>
          This policy explains what information {SITE_NAME} collects when you use this
          website, why we collect it and what you can ask us to do with it.
        </p>
      }
      sections={sections}
    />
  );
}
