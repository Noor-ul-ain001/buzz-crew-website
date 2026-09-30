// Mock chat assistant: no AI calls. Replies are canned answers picked by keyword and
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

const ANSWERS: Canned[] = [
  {
    keywords: ["service", "offer", "do you do", "what do you"],
    text: "We're a full-service digital agency. We run social media (content, Reels and community), SEO and local SEO, websites and web apps, UI/UX design, and Meta Ads, for brands in Pakistan, the UAE and the UK. Most clients start with one or two services and add more as results come in.",
    links: [
      { label: "Frequently asked questions", href: "/faq" },
      { label: "Contact the team", href: "/contact" },
    ],
  },
  {
    keywords: ["restaurant", "café", "cafe", "food", "bakery"],
    text: "Yes, restaurants and cafés are one of our biggest sectors. We help them fill quiet weeknights with Instagram content and local Meta Ads, and get into Google's map results. Chai Khana Co. doubled calls from Google Maps in four months.",
    links: [
      { label: "Restaurant marketing in Karachi", href: "/industries/restaurant-marketing-karachi" },
      { label: "Case study: Instagram for restaurants", href: "/blog/instagram-lessons-restaurants" },
    ],
  },
  {
    keywords: ["price", "pricing", "cost", "budget", "how much", "fee", "get started", "start a project"],
    text: "Every project is quoted on its scope. After a short call the team sends a fixed quote, so the best first step is to tell us what you need.",
    links: [
      { label: "Start a project", href: "/contact" },
    ],
  },
  {
    keywords: ["seo", "google", "rank", "search"],
    text: "For SEO we start with your Google Business Profile and local pages, then fix technical issues and build content around what your customers search for. Local SEO often shows movement within two to three months.",
    links: [{ label: "Local SEO checklist", href: "/blog/local-seo-karachi-checklist" }],
  },
  {
    keywords: ["real estate", "property", "dubai", "uae"],
    text: "We work with agencies and developers in Dubai on lead generation, project landing pages and bilingual English and Arabic SEO.",
    links: [{ label: "Real estate marketing in Dubai", href: "/industries/real-estate-marketing-dubai" }],
  },
  {
    keywords: ["clinic", "dental", "physio", "uk", "london"],
    text: "Yes. We help private clinics in the UK with local SEO, fast websites with online booking, and calm, rules-aware social media.",
    links: [{ label: "Marketing for UK clinics", href: "/industries/clinic-marketing-uk" }],
  },
  {
    keywords: ["website", "web", "site", "app", "develop"],
    text: "We build fast, accessible websites and web apps with Next.js, including bilingual sites and online booking. A typical business website takes four to six weeks.",
    links: [{ label: "Why websites are slow on 4G", href: "/blog/website-speed-4g-pakistan" }],
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
