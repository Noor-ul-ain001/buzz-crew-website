// Mock newsletter API until the FastAPI endpoint and email provider exist. Sign-up is
// double opt-in: the subscriber stays "Pending" until they click the confirmation email.
// To preview the error state, sign up with an email ending in "@fail.test".

export const SUBSCRIBER_STATUSES = ["Pending", "Confirmed", "Unsubscribed"] as const;

export type Subscriber = {
  id: string;
  email: string;
  status: (typeof SUBSCRIBER_STATUSES)[number];
  source: string;
  subscribedAt: string;
};

const MOCK_LATENCY_MS = 900;

export async function subscribeToNewsletter(email: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  if (email.toLowerCase().endsWith("@fail.test")) {
    throw new Error("Mock subscribe failure");
  }
}

const SUBSCRIBERS: [email: string, status: Subscriber["status"], source: string, day: string][] = [
  ["ayesha.k@gmail.com", "Confirmed", "Footer", "2026-09-27"],
  ["marketing@chaikhana.example", "Confirmed", "Footer", "2026-09-25"],
  ["james.w@outlook.com", "Pending", "Footer", "2026-09-25"],
  ["noura@saeeddental.example", "Confirmed", "Blog post", "2026-09-22"],
  ["hira.bakes@gmail.com", "Confirmed", "Footer", "2026-09-18"],
  ["owner@ellisongym.example", "Unsubscribed", "Footer", "2026-09-12"],
  ["saad.mirza@gmail.com", "Confirmed", "Blog post", "2026-09-09"],
  ["hello@langflorists.example", "Confirmed", "Footer", "2026-09-02"],
  ["fatima@noorbridal.example", "Pending", "Footer", "2026-08-30"],
  ["tom.price@gmail.com", "Confirmed", "Blog post", "2026-08-21"],
  ["rabia.anwar@gmail.com", "Confirmed", "Footer", "2026-08-14"],
  ["zain.ali@hotmail.com", "Unsubscribed", "Footer", "2026-08-03"],
];

export async function getSubscribers(): Promise<Subscriber[]> {
  return SUBSCRIBERS.map(([email, status, source, day], index) => ({
    id: `subscriber-${index + 1}`,
    email,
    status,
    source,
    subscribedAt: `${day}T08:00:00Z`,
  }));
}
