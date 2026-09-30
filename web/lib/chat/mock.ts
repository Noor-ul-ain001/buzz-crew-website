// Chat assistant without AI calls: replies are canned answers picked by keyword and
// streamed word by word, so the UI behaves as it will with a real streaming API.
//
// To preview the error states, send a message containing:
//   "#unavailable"  -> the provider is down
//   "#limit"        -> the daily message limit is reached
// The daily limit (DAILY_LIMIT messages) is also counted for real in localStorage.

export type ChatLink = { label: string; href: string };

export type ChatReplyKind = "answer" | "decline";

export type ChatStreamEvent =
  | { type: "token"; text: string }
  | { type: "done"; kind: ChatReplyKind; links: ChatLink[] };

export class ProviderUnavailableError extends Error {}
export class DailyLimitError extends Error {}

export const DAILY_LIMIT = 20;
const USAGE_KEY = "buzz-crew-chat-usage";

type Canned = { keywords: string[]; text: string; links?: ChatLink[] };

// Every answer sticks to facts from the brochure (ABOUT BUZZ CREW.pdf) and the site.
const ANSWERS: Canned[] = [
  {
    keywords: ["service", "offer", "do you do", "what do you"],
    text: "We're a full-service digital agency founded in Karachi in 2022. Our services: digital marketing, creative and graphic design, web and software development, UI/UX design, video and content production, public relations, branding, copywriting, AI and automation, and IoT and smart digital solutions.",
    links: [
      { label: "All services", href: "/services" },
      { label: "Contact the team", href: "/contact" },
    ],
  },
  {
    keywords: ["industr", "sector", "niche"],
    text: "We bring cross-industry experience, not a one-vertical playbook: food and beverages, farmhouses and event venues, healthcare and dental, education and e-commerce.",
    links: [{ label: "Where we've worked", href: "/#industries-heading" }],
  },
  {
    keywords: ["restaurant", "café", "cafe", "food", "bakery", "catering", "kitchen"],
    text: "Yes, food and beverages is one of our main industries: restaurants, catering, cafés and home kitchens. Clients include Farzana's Kitchen, Halki Aanch by Ayesha, Mr. Bawarchi and Nawab's Dynasty.",
    links: [{ label: "Food and beverage marketing", href: "/industries/food-and-beverages" }],
  },
  {
    keywords: ["farm", "venue", "event", "picnic"],
    text: "We work with farmhouses and event and picnic venues, including Black Gold Farm and The Farm Villa, on content, social media and bookings.",
    links: [{ label: "Farmhouses", href: "/industries/farmhouses" }],
  },
  {
    keywords: ["clinic", "dental", "hospital", "health"],
    text: "For healthcare and dental, we build automation systems for clinics and hospitals, alongside websites and patient-friendly content.",
    links: [{ label: "Healthcare and dental", href: "/industries/healthcare-and-dental" }],
  },
  {
    keywords: ["school", "education", "institute", "university", "enrol"],
    text: "For schools and institutes we run enrolment-focused marketing, timed around the admissions calendar.",
    links: [{ label: "Education", href: "/industries/education" }],
  },
  {
    keywords: ["price", "pricing", "cost", "budget", "how much", "fee", "get started", "start a project"],
    text: "Every project is quoted on its scope. After a short call the team sends a fixed quote, so the best first step is to tell us what you need.",
    links: [{ label: "Start a project", href: "/contact" }],
  },
  {
    keywords: ["how do you work", "process", "approach"],
    text: "A repeatable process behind every account: discovery and audit, strategy, execution and creative, then reporting and growth, with clear numbers each cycle.",
    links: [{ label: "How we work", href: "/services" }],
  },
  {
    keywords: ["where", "based", "location", "uae", "uk", "dubai", "international"],
    text: "We're based in Karachi and work with clients in Pakistan, the UAE, the UK and beyond, with more than 12 international clients so far. We're available for worldwide collaborations.",
    links: [{ label: "About us", href: "/about" }],
  },
  {
    keywords: ["website", "web", "site", "app", "develop", "software", "e-commerce", "ecommerce", "store"],
    text: "We build websites, online stores and custom software, including a tailored CRM system for Discovery Homes in Dubai.",
    links: [{ label: "Web and software development", href: "/services#web-software" }],
  },
  {
    keywords: ["work", "portfolio", "example", "case study", "clients"],
    text: "We've completed more than 90 projects. Our work includes Instagram for Islamabad Now (156K followers), AwamiWeb (102K) and Mercantile Pakistan (101K).",
    links: [{ label: "See our work", href: "/work" }],
  },
  {
    keywords: ["hello", "hi", "salam", "hey"],
    text: "Hi! I can answer questions about The Buzz Crew's services, industries we work with and how to get started. What would you like to know?",
  },
];

const DECLINE =
  "Sorry, I can only help with questions about The Buzz Crew: our services, industries and how to work with us. For anything else, or if you'd rather speak to a person, the team is happy to help.";

// Keywords (plain words, no regex characters) match at the start of a word, so "hi"
// doesn't match "which".
function mentions(message: string, keyword: string) {
  return new RegExp(`(^|[^\\p{L}])${keyword}`, "iu").test(message);
}

function pickReply(message: string): { text: string; kind: ChatReplyKind; links: ChatLink[] } {
  const match = ANSWERS.find((answer) => answer.keywords.some((keyword) => mentions(message, keyword)));
  if (!match) return { text: DECLINE, kind: "decline", links: [] };
  return { text: match.text, kind: "answer", links: match.links ?? [] };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readUsage(): { day: string; count: number } {
  try {
    const stored = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? "null");
    if (stored?.day === today() && typeof stored.count === "number") return stored;
  } catch {
    // Storage blocked or corrupt: start a fresh count.
  }
  return { day: today(), count: 0 };
}

export function messagesLeftToday() {
  return Math.max(0, DAILY_LIMIT - readUsage().count);
}

function countMessage() {
  const usage = readUsage();
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify({ day: usage.day, count: usage.count + 1 }));
  } catch {
    // Without storage the limit can't be enforced across reloads; that's fine for a mock.
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Streams the assistant's reply. Throws ProviderUnavailableError or DailyLimitError. */
export async function* sendMessage(message: string): AsyncGenerator<ChatStreamEvent> {
  if (message.includes("#limit") || messagesLeftToday() === 0) throw new DailyLimitError();
  // "Thinking" time before the first token.
  await wait(700);
  if (message.includes("#unavailable")) throw new ProviderUnavailableError();
  countMessage();

  const reply = pickReply(message);
  const words = reply.text.split(" ");
  for (let index = 0; index < words.length; index++) {
    await wait(35 + Math.random() * 45);
    yield { type: "token", text: (index === 0 ? "" : " ") + words[index] };
  }
  yield { type: "done", kind: reply.kind, links: reply.links };
}

/** A short summary of the visitor's side of the chat, for the inquiry form. */
export function summariseConversation(userMessages: string[]) {
  const recent = userMessages.slice(-5).map((message) => `- ${message.replace(/\s+/g, " ").trim().slice(0, 200)}`);
  return [
    "Summary of my chat with the Buzz Crew AI assistant:",
    ...recent,
    "",
    "I'd like to talk to the team about this.",
  ].join("\n");
}
