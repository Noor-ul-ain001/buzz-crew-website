import type {
  Lead,
  LeadBudget,
  LeadCountry,
  LeadEvent,
  LeadNote,
  LeadService,
  LeadStatus,
} from "@/lib/leads/types";

// Mock leads until the FastAPI leads endpoints exist. Everything is derived from the fixed
// MOCK_NOW so server and client renders always agree and "this month" stays meaningful.
export const MOCK_NOW = new Date("2026-09-28T09:00:00Z");

/** The signed-in admin for mock actions (status changes, notes). */
export const CURRENT_ADMIN = "Hamza Qureshi";

const TEAM = ["Hamza Qureshi", "Sana Malik", "Omar Farooq"];

const SERVICE_CODES: Record<string, LeadService> = {
  S: "Social Media",
  O: "SEO",
  W: "Web & Software",
  U: "UI/UX Design",
  M: "Meta Ads",
};

const BUDGET_BY_INDEX: LeadBudget[] = [
  "Under PKR 50k",
  "PKR 50k–150k",
  "PKR 150k+",
  "Not sure yet",
];

type Row = {
  name: string;
  business: string;
  country: Exclude<LeadCountry, "Other">;
  services: string; // service codes, see SERVICE_CODES
  budget: 0 | 1 | 2 | 3;
  status: LeadStatus;
  message: string;
  /** Days from creation to Won/Lost. Defaults to 12. */
  closeDays?: number;
  /** Personal address instead of one at the business domain. */
  email?: string;
  noPhone?: boolean;
};

// Oldest first, grouped by month from October 2025 to September 2026.
const MONTHS: Row[][] = [
  [
    { name: "Bilal Ahmed", business: "Chai Khana Co.", country: "Pakistan", services: "SM", budget: 1, status: "Won", message: "We're opening our third café in DHA next month and want Instagram and Meta Ads handled end to end, including the launch week." },
  ],
  [
    { name: "Fatima Noor", business: "Noor Bridal Studio", country: "Pakistan", services: "SU", budget: 1, status: "Won", message: "Looking for someone to run our Instagram through wedding season and redesign our lookbook pages. Most of our clients find us on Instagram." },
    { name: "Oliver Grant", business: "Grant & Hale Joinery", country: "UK", services: "WO", budget: 2, status: "Lost", message: "Our website is ten years old and doesn't show up for 'bespoke kitchens Leeds'. We need a rebuild and some local SEO." },
  ],
  [
    { name: "Aisha Al Mansoori", business: "Sahra Wellness Spa", country: "UAE", services: "SM", budget: 2, status: "Won", message: "We'd like a monthly social media and paid ads retainer for our two Dubai branches, in English and Arabic." },
    { name: "Usman Tariq", business: "Tariq Textiles", country: "Pakistan", services: "W", budget: 2, status: "Lost", message: "Need a B2B catalogue website where buyers abroad can browse fabrics and request samples." },
  ],
  [
    { name: "Hannah Brooks", business: "Brooks Physio", country: "UK", services: "OW", budget: 1, status: "Won", message: "Small physio clinic in Bristol. We want more bookings from Google and a website that works properly on phones." },
    { name: "Zainab Hussain", business: "Little Sprouts Montessori", country: "Pakistan", services: "S", budget: 0, status: "Lost", message: "Admissions open in March. Can you help us with Facebook and Instagram posts for parents in Lahore?" },
  ],
  [
    { name: "Rashid Khan", business: "Khan Auto Detailing", country: "UAE", services: "M", budget: 0, status: "Won", message: "Want to try Meta Ads for our ceramic coating packages in Sharjah. Budget is small to start." },
    { name: "Emily Carter", business: "Carter Candle Co.", country: "UK", services: "SM", budget: 1, status: "Lost", message: "Handmade candle brand, selling on our own Shopify store. Looking for help growing Instagram and running ads before Mother's Day." },
    { name: "Hassan Raza", business: "Raza Real Estate", country: "Pakistan", services: "WOM", budget: 2, status: "Won", message: "We need a property listings website for Bahria Town projects plus lead generation ads. Currently all leads come from WhatsApp." },
  ],
  [
    { name: "Mariam Siddiqui", business: "Threadline Boutique", country: "Pakistan", services: "SM", budget: 1, status: "Won", message: "Eid collection launches in three weeks. We need shoots planned, reels and ads running." },
    { name: "James Whitfield", business: "Whitfield Accountants", country: "UK", services: "O", budget: 1, status: "Lost", message: "Looking for an SEO audit and a six-month plan. We're an accountancy practice in Manchester." },
    { name: "Noura Saeed", business: "Saeed Dental Clinic", country: "UAE", services: "WO", budget: 2, status: "Won", message: "New clinic opening in Abu Dhabi. We need a bilingual website with online booking and to rank for dental keywords." },
  ],
  [
    { name: "Kamran Sheikh", business: "PakGrocer", country: "Pakistan", services: "WU", budget: 2, status: "Lost", message: "We're building a grocery delivery app for Karachi and need UI/UX design plus a web ordering site." },
    { name: "Sophie Lang", business: "Lang Florists", country: "UK", services: "S", budget: 0, status: "Won", message: "Could you manage our Instagram? Two posts a week and stories. We're a small florist in Brighton." },
    { name: "Yousef Haddad", business: "Haddad Interiors", country: "UAE", services: "SU", budget: 2, status: "Lost", message: "Interior design studio in Dubai Marina. We want a premium portfolio look across Instagram and a refreshed brand kit." },
  ],
  [
    { name: "Sadia Batool", business: "Glow by Sadia", country: "Pakistan", services: "SM", budget: 0, status: "Won", message: "Home-based skincare brand. I need help with content ideas and a small ad budget to reach customers in Islamabad.", email: "glowbysadia@gmail.com" },
    { name: "Tom Ellison", business: "Ellison Gym", country: "UK", services: "M", budget: 1, status: "Won", message: "Independent gym in Leicester. We want a January-style membership push in the summer with Facebook and Instagram ads." },
    { name: "Layla Rahman", business: "Rahman Legal Consultants", country: "UAE", services: "WO", budget: 2, status: "Lost", message: "Law firm website needs a rebuild with practice area pages and a blog, and we need to rank in Dubai." },
    { name: "Imran Qadir", business: "Qadir Logistics", country: "Pakistan", services: "W", budget: 3, status: "Lost", message: "We need a shipment tracking portal for our corporate clients. Not sure about budget, would like a proposal." },
  ],
  [
    { name: "Hira Aslam", business: "Crumbs Bakery", country: "Pakistan", services: "S", budget: 0, status: "Won", message: "Bakery in Gulshan. Our Instagram is inactive and we want regular posts and reels of the cakes." },
    { name: "Daniel Price", business: "Price & Co Estate Agents", country: "UK", services: "OM", budget: 2, status: "Proposal sent", message: "We want more valuation requests from homeowners in Croydon. Interested in SEO and lead ads." },
    { name: "Khalid Al Suwaidi", business: "Desert Rose Events", country: "UAE", services: "SMU", budget: 2, status: "Won", message: "Events company planning our winter season campaign. Need a social strategy, ads and new event page designs." },
    { name: "Nimra Javed", business: "", country: "Pakistan", services: "U", budget: 3, status: "Lost", message: "I have an idea for a tutoring app and need UI/UX designs to show investors. Can we discuss?", email: "nimra.javed@gmail.com", noPhone: true },
  ],
  [
    { name: "Saad Mirza", business: "Mirza Motors", country: "Pakistan", services: "MS", budget: 1, status: "Won", closeDays: 45, message: "Used car showroom in Lahore. We want to generate leads with Meta Ads and keep our page active with new stock." },
    { name: "Charlotte Hughes", business: "Hughes Skincare", country: "UK", services: "SM", budget: 2, status: "Proposal sent", message: "Launching a new vitamin C serum in autumn. Looking for an agency to plan the launch on Instagram and TikTok with paid ads." },
    { name: "Omar Al Nuaimi", business: "Nuaimi Properties", country: "UAE", services: "WO", budget: 2, status: "Won", closeDays: 50, message: "We need a new website for our off-plan projects with landing pages for each development and SEO." },
    { name: "Ayesha Kamal", business: "Kamal Kitchens", country: "Pakistan", services: "WU", budget: 1, status: "Lost", message: "Want a website where customers can browse kitchen designs and book a home visit." },
    { name: "Ben Russell", business: "Russell Coffee Roasters", country: "UK", services: "O", budget: 0, status: "Contacted", message: "Small coffee roaster selling online. We'd like help getting found for 'speciality coffee beans UK'." },
  ],
  [
    { name: "Mehwish Iqbal", business: "Iqbal School of Languages", country: "Pakistan", services: "SO", budget: 1, status: "Proposal sent", message: "We teach IELTS and German. Need more enquiries from Google and a stronger Facebook presence." },
    { name: "Ahmed Farouk", business: "Farouk Trading LLC", country: "UAE", services: "W", budget: 2, status: "Won", closeDays: 30, message: "Corporate website for our trading company, with a product catalogue and enquiry form. Arabic and English." },
    { name: "George Mitchell", business: "Mitchell Dog Grooming", country: "UK", services: "S", budget: 0, status: "Contacted", message: "Mobile dog groomer in Kent. I'd love some help making my Instagram look more professional." },
    { name: "Rabia Anwar", business: "Anwar Jewellers", country: "Pakistan", services: "SMU", budget: 2, status: "Proposal sent", message: "Family jewellery business since 1985. We want a modern brand look online, Instagram content and ads for the wedding season." },
    { name: "Faisal Al Hammadi", business: "Hammadi Fitness", country: "UAE", services: "M", budget: 1, status: "Lost", message: "Personal training studio. Need Meta Ads to get trial class sign-ups." },
  ],
  [
    { name: "Zara Ali", business: "Zara's Kitchen", country: "Pakistan", services: "SM", budget: 0, status: "New", message: "Home kitchen doing frozen food orders in Karachi. Want to grow on Instagram and try some ads.", email: "zaraskitchen.khi@gmail.com" },
    { name: "Liam O'Connor", business: "O'Connor Plumbing", country: "UK", services: "OW", budget: 1, status: "Contacted", message: "Plumbing and heating business in Birmingham. Our site gets no calls. Need a simple site and local SEO." },
    { name: "Mariam Al Falasi", business: "Falasi Abaya House", country: "UAE", services: "SU", budget: 2, status: "Proposal sent", message: "We design luxury abayas and want a full Instagram refresh and a new look for our online store." },
    { name: "Asad Mehmood", business: "", country: "Pakistan", services: "W", budget: 3, status: "New", message: "I need a website for my freelance photography. Something simple with a gallery and contact form.", email: "asad.mehmood.photo@gmail.com" },
    { name: "Priya Nair", business: "Nair Yoga Studio", country: "UK", services: "S", budget: 0, status: "New", message: "Opening a yoga studio in Leicester in November. Looking for social media help before launch.", noPhone: true },
    { name: "Waleed Hashmi", business: "Hashmi Pharma", country: "Pakistan", services: "OWM", budget: 2, status: "Contacted", message: "Pharma distributor looking to build a corporate website, improve search visibility and run awareness campaigns." },
  ],
];

const TLD: Record<Row["country"], string> = { Pakistan: "pk", UAE: "ae", UK: "co.uk" };

function slug(text: string) {
  return text.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function digits(seed: number, length: number) {
  return String((seed * 7919 + 104729) % 10 ** length).padStart(length, "0");
}

function phoneFor(country: Row["country"], seed: number) {
  if (country === "Pakistan") return `+92 3${digits(seed, 2)} ${digits(seed * 3, 7)}`;
  if (country === "UAE") return `+971 5${"02568"[seed % 5]} ${digits(seed * 5, 3)} ${digits(seed * 11, 4)}`;
  return `+44 7${digits(seed * 13, 3)} ${digits(seed * 17, 6)}`;
}

const DAY = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number, hours = 0) {
  return new Date(date.getTime() + days * DAY + hours * 60 * 60 * 1000);
}

// The route to each status; Lost leads on small or unknown budgets drop out before a proposal.
function statusPath(row: Row): LeadStatus[] {
  switch (row.status) {
    case "New":
      return ["New"];
    case "Contacted":
      return ["New", "Contacted"];
    case "Proposal sent":
      return ["New", "Contacted", "Proposal sent"];
    case "Won":
      return ["New", "Contacted", "Proposal sent", "Won"];
    case "Lost":
      return row.budget === 0 || row.budget === 3
        ? ["New", "Contacted", "Lost"]
        : ["New", "Contacted", "Proposal sent", "Lost"];
  }
}

const LOST_REASONS = [
  "Went with a freelancer at a lower price.",
  "Budget put on hold until next quarter.",
  "Decided to keep it in-house for now.",
  "No reply after three follow-ups. Closing.",
];

function noteFor(status: LeadStatus, row: Row, index: number): string | null {
  const first = row.name.split(" ")[0];
  const services = row.services.split("").map((code) => SERVICE_CODES[code]).join(" + ");
  switch (status) {
    case "Contacted":
      return `Spoke to ${first} on a call. Keen to see similar work in ${row.country}; sent three case studies.`;
    case "Proposal sent":
      return `Proposal sent for ${services}, ${BUDGET_BY_INDEX[row.budget]}. Follow up in a week.`;
    case "Won":
      return "Proposal signed and deposit received. Kick-off call booked.";
    case "Lost":
      return LOST_REASONS[index % LOST_REASONS.length];
    default:
      return null;
  }
}

function buildLead(row: Row, monthIndex: number, positionInMonth: number, monthSize: number, index: number): Lead {
  const id = `lead-${1001 + index}`;
  const day = Math.round(((positionInMonth + 1) * 27) / (monthSize + 1));
  const createdAt = new Date(Date.UTC(2025, 9 + monthIndex, day, 5 + (index % 9), (index * 13) % 60));

  const path = statusPath(row);
  const offsets: Record<LeadStatus, number> = {
    New: 0,
    Contacted: 1,
    "Proposal sent": 4,
    Won: row.closeDays ?? 12,
    Lost: row.closeDays ?? (path.length === 3 ? 6 : 12),
  };

  const events: LeadEvent[] = path.map((status, step) => ({
    id: `${id}-event-${step + 1}`,
    from: step === 0 ? null : path[step - 1],
    to: status,
    actor: step === 0 ? "Website form" : TEAM[(index + step) % TEAM.length],
    createdAt: addDays(createdAt, offsets[status], step === 0 ? 0 : 2).toISOString(),
  }));

  const notes: LeadNote[] = events.flatMap((event, step) => {
    const body = noteFor(event.to, row, index);
    if (!body) return [];
    return [
      {
        id: `${id}-note-${step}`,
        author: event.actor,
        body,
        createdAt: addDays(new Date(event.createdAt), 0, 1).toISOString(),
      },
    ];
  });

  const first = row.name.split(" ")[0].toLowerCase();

  return {
    id,
    name: row.name,
    email: row.email ?? `${first}@${slug(row.business)}.${TLD[row.country]}`,
    phone: row.noPhone ? "" : phoneFor(row.country, index + 1),
    business: row.business,
    country: row.country,
    services: row.services.split("").map((code) => SERVICE_CODES[code]),
    budget: BUDGET_BY_INDEX[row.budget],
    message: row.message,
    status: row.status,
    createdAt: createdAt.toISOString(),
    notes,
    events,
  };
}

const OLDEST_FIRST: Lead[] = MONTHS.flatMap((rows, monthIndex) =>
  rows.map((row, position) => ({ row, monthIndex, position, monthSize: rows.length })),
).map(({ row, monthIndex, position, monthSize }, index) =>
  buildLead(row, monthIndex, position, monthSize, index),
);

/** Newest first, as the leads table shows them. */
export const MOCK_LEADS: Lead[] = [...OLDEST_FIRST].reverse();

export function findMockLead(id: string): Lead | undefined {
  return MOCK_LEADS.find((lead) => lead.id === id);
}
