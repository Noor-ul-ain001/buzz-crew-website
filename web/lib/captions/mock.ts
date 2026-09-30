// Mock caption generator: no AI calls. Ideas come from templates filled with the
// business type, goal and platform, so the UI works as it will with a real model.
//
// To preview the daily limit, include "limit" in the business type. The limit
// (DAILY_CAPTION_LIMIT generations) is also counted for real in localStorage.

export const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const GOALS = [
  { value: "enquiries", label: "Get more enquiries or bookings" },
  { value: "followers", label: "Grow followers" },
  { value: "launch", label: "Launch a product or offer" },
  { value: "trust", label: "Build trust and reputation" },
] as const;
export type Goal = (typeof GOALS)[number]["value"];

export type CaptionIdea = { id: string; title: string; format: string; caption: string; hashtags: string[] };

export class CaptionLimitError extends Error {}

export const DAILY_CAPTION_LIMIT = 5;
const USAGE_KEY = "buzz-crew-caption-usage";

const CTA: Record<Goal, string> = {
  enquiries: "Send us a message to book yours.",
  followers: "Follow for more like this every week.",
  launch: "Available from this Friday. Don't miss it.",
  trust: "Thank you for trusting us. It means everything.",
};

const FORMATS: Record<Platform, [string, string, string, string]> = {
  Instagram: ["Reel", "Carousel", "Story series", "Photo post"],
  Facebook: ["Photo post", "Video", "Album", "Event post"],
  TikTok: ["Short video", "Trend remix", "Behind the scenes", "Q&A video"],
  LinkedIn: ["Text post", "Document carousel", "Photo post", "Short video"],
};

// "dental clinic" -> "#DentalClinic": capitalised words are easier to read and to hear
// with a screen reader.
function tag(text: string) {
  return `#${text
    .split(/[^a-z0-9]+/i)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")}`;
}

function ideas(business: string, goal: Goal, platform: Platform): CaptionIdea[] {
  const b = business.trim();
  const lower = b.toLowerCase();
  const formats = FORMATS[platform];
  const pro = platform === "LinkedIn";
  const short = platform === "TikTok";
  const baseTags = [tag(b), tag(`${b}Karachi`), tag("SmallBusiness")];
  const platformTags: Record<Platform, string[]> = {
    Instagram: ["#InstaDaily", "#ReelsPakistan", "#ShopLocal"],
    Facebook: ["#SupportLocal", "#Karachi"],
    TikTok: ["#fyp", "#TikTokPakistan", "#BehindTheScenes"],
    LinkedIn: ["#Entrepreneurship", "#Growth"],
  };
  const limitTags = (tags: string[]) => (pro ? tags.slice(0, 3) : tags.slice(0, 6));

  const raw: Omit<CaptionIdea, "id">[] = [
    {
      title: "A day behind the scenes",
      format: formats[0],
      caption: short
        ? `POV: 6am at a ${lower} 👀 Wait for the end. ${CTA[goal]}`
        : pro
          ? `What does a day at our ${lower} really look like? Early starts, careful prep and a team that cares about the details. Here's what goes on before you walk through the door. ${CTA[goal]}`
          : `Ever wondered what happens before we open? ☀️ Here's a peek behind the scenes at our ${lower}: the prep, the people and the little details. ${CTA[goal]}`,
      hashtags: limitTags([...baseTags, ...platformTags[platform]]),
    },
    {
      title: "Answer your most-asked question",
      format: formats[1],
      caption: pro
        ? `The question our clients ask most: "How do I choose the right ${lower}?" Here are the three things we'd look for, and the one mistake to avoid. ${CTA[goal]}`
        : `You ask, we answer 💬 The question we get most at our ${lower}, finally answered in one post. Save it for later! ${CTA[goal]}`,
      hashtags: limitTags([...baseTags, tag("FAQ"), ...platformTags[platform]]),
    },
    {
      title: "Customer story",
      format: formats[2],
      caption: short
        ? `This review made our week 🥹 Thank you! ${CTA[goal]}`
        : `"Best ${lower} experience I've had in Karachi." ⭐⭐⭐⭐⭐ Words like this are why we do what we do. Thank you for sharing! ${CTA[goal]}`,
      hashtags: limitTags([...baseTags, tag("CustomerLove"), tag("Reviews"), ...platformTags[platform]]),
    },
    {
      title: goal === "launch" ? "Countdown to launch" : "This week's highlight",
      format: formats[3],
      caption:
        goal === "launch"
          ? `Something new is coming to our ${lower} 👀 We've been working on it for months and can't wait to show you. ${CTA[goal]}`
          : `This week at our ${lower}: the thing everyone's talking about. Come and see what the fuss is about. ${CTA[goal]}`,
      hashtags: limitTags([...baseTags, tag(goal === "launch" ? "ComingSoon" : "ThisWeek"), ...platformTags[platform]]),
    },
  ];
  return raw.map((idea, index) => ({ ...idea, id: `${platform}-${goal}-${index}` }));
}

function readUsage(): { day: string; count: number } {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const stored = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? "null");
    if (stored?.day === day && typeof stored.count === "number") return stored;
  } catch {
    // Storage blocked or corrupt: start a fresh count.
  }
  return { day, count: 0 };
}

export function generationsLeftToday() {
  return Math.max(0, DAILY_CAPTION_LIMIT - readUsage().count);
}

export async function generateCaptions(input: { business: string; goal: Goal; platform: Platform }): Promise<CaptionIdea[]> {
  const usage = readUsage();
  if (input.business.toLowerCase().includes("limit") || usage.count >= DAILY_CAPTION_LIMIT) throw new CaptionLimitError();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify({ day: usage.day, count: usage.count + 1 }));
  } catch {
    // Without storage the limit can't be enforced across reloads; fine for a mock.
  }
  return ideas(input.business, input.goal, input.platform);
}
