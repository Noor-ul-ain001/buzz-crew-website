import { MOCK_NOW } from "@/lib/data/mock-leads";
import type { Lead } from "@/lib/leads/types";

// Mock "AI" lead priority: a transparent points score standing in for a model's
// suggestion. The reason names the strongest factors, so the team can judge it.

export type Priority = "Hot" | "Warm" | "Cold";
export type LeadScore = { priority: Priority; reason: string };

const DAY = 24 * 60 * 60 * 1000;

export function scoreLead(lead: Lead, now = MOCK_NOW): LeadScore {
  if (lead.status === "Won") return { priority: "Cold", reason: "Already won, so no follow-up needed." };
  if (lead.status === "Lost") return { priority: "Cold", reason: "Marked as lost." };

  const factors: { points: number; text: string }[] = [];
  const budgetPoints = { "PKR 150k+": 3, "PKR 50k–150k": 2, "Under PKR 50k": 0, "Not sure yet": 1 }[lead.budget];
  if (budgetPoints >= 2) factors.push({ points: budgetPoints, text: `${lead.budget} budget` });
  if (lead.services.length >= 2) factors.push({ points: 1, text: `wants ${lead.services.length} services` });
  const ageDays = (now.getTime() - new Date(lead.createdAt).getTime()) / DAY;
  if (ageDays <= 7) factors.push({ points: 1, text: "enquired this week" });
  if (lead.status === "Proposal sent") factors.push({ points: 2, text: "proposal already sent" });
  if (lead.message.length >= 120) factors.push({ points: 1, text: "detailed brief" });

  const score = factors.reduce((sum, factor) => sum + factor.points, 0);
  const priority: Priority = score >= 5 ? "Hot" : score >= 3 ? "Warm" : "Cold";
  const top = factors.sort((a, b) => b.points - a.points).slice(0, 3).map((factor) => factor.text);
  const reason = top.length > 0 ? `${top.join(", ")}.` : "Small or unclear budget and a short brief.";
  return { priority, reason: reason.charAt(0).toUpperCase() + reason.slice(1) };
}
