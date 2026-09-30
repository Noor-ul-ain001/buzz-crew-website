import { CURRENT_ADMIN } from "@/lib/data/mock-leads";
import type { Lead, LeadNote, LeadStatus } from "@/lib/leads/types";

// Mock admin API until the FastAPI endpoints exist:
//   PATCH  /api/v1/leads/{id}        { status }
//   POST   /api/v1/leads/{id}/notes  { body }
//   DELETE /api/v1/leads/{id}
// To preview the error states, act on a lead whose email ends in "@fail.test"
// (same convention as createLead in lib/data/leads.ts).

const MOCK_LATENCY_MS = 700;

async function mockRequest(lead: Pick<Lead, "email">) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  if (lead.email.toLowerCase().endsWith("@fail.test")) {
    throw new Error("Mock admin API failure");
  }
}

export async function updateLeadStatus(lead: Lead, status: LeadStatus): Promise<void> {
  void status;
  await mockRequest(lead);
}

export async function addLeadNote(lead: Lead, body: string): Promise<LeadNote> {
  await mockRequest(lead);
  return {
    id: crypto.randomUUID(),
    author: CURRENT_ADMIN,
    body,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteLead(lead: Lead): Promise<void> {
  await mockRequest(lead);
}
