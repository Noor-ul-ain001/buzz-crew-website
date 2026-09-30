import type { SERVICES } from "@/lib/validation/inquiry";

// The agency's ten services, as the brochure (ABOUT BUZZ CREW.pdf) lists them, with the
// short descriptions the site shows. `id` is the anchor on /services, e.g. /services#branding.

export type ServiceDetail = {
  id: string;
  name: (typeof SERVICES)[number];
  summary: string;
  deliverables: string[];
};

export const SERVICE_DETAILS: ServiceDetail[] = [
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    summary: "Social media, search and paid campaigns planned around real goals, not vanity metrics.",
    deliverables: ["Social media management", "SEO", "Meta and Google Ads", "Monthly reporting"],
  },
  {
    id: "creative-design",
    name: "Creative & Graphic Design",
    summary: "Campaign visuals, social creatives and print that look unmistakably like your brand.",
    deliverables: ["Social creatives", "Campaign visuals", "Print and packaging"],
  },
  {
    id: "web-software",
    name: "Web / Software Development",
    summary: "Websites, online stores and custom software that are fast, reliable and built to scale.",
    deliverables: ["Business websites", "E-commerce", "Custom software and CRMs"],
  },
  {
    id: "ui-ux-design",
    name: "UI/UX Design",
    summary: "Interfaces that feel intuitive, look on-brand and make it easy to take action.",
    deliverables: ["User journeys", "Wireframes and prototypes", "Design systems"],
  },
  {
    id: "video-content",
    name: "Video & Content Production",
    summary: "Scripting, shooting and editing in-house, from reels to full brand films.",
    deliverables: ["Reels and short-form video", "Photo and video shoots", "Editing"],
  },
  {
    id: "public-relations",
    name: "Public Relations",
    summary: "Your story, placed where your audience is already paying attention.",
    deliverables: ["Media outreach", "Launch announcements", "Reputation building"],
  },
  {
    id: "branding",
    name: "Branding",
    summary: "Identities and guidelines for brands that want to be recognised and remembered.",
    deliverables: ["Brand strategy", "Logo and identity", "Brand guidelines"],
  },
  {
    id: "copywriting",
    name: "Copywriting",
    summary: "Clear, persuasive words for websites, social posts and campaigns.",
    deliverables: ["Website copy", "Social captions", "Campaign scripts"],
  },
  {
    id: "ai-automation",
    name: "AI & Automation",
    summary: "Automation that takes busywork off your team, from lead flow to clinic and hospital systems.",
    deliverables: ["Lead and CRM automation", "Booking and follow-up flows", "AI assistants"],
  },
  {
    id: "iot-smart",
    name: "IoT & Smart Digital Solutions",
    summary: "Connected devices and smart systems that join the physical and digital sides of a business.",
    deliverables: ["Smart device integration", "Monitoring dashboards", "Custom connected systems"],
  },
];

export function serviceDetail(name: string): ServiceDetail | undefined {
  return SERVICE_DETAILS.find((service) => service.name === name);
}
