import type { Schemas } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/request";
import { errorMessage } from "@/lib/auth/errors";
import type { Lead, LeadBudget, LeadCountry, LeadNote, LeadStatus } from "@/lib/leads/types";
import { API_TO_SERVICE, BUDGET_TO_API, COUNTRY_TO_API } from "@/lib/validation/enum-map";

// Leads come from the API (admin only). The API speaks snake_case and lowercase enums;
// the admin screens use the shapes in lib/leads/types.ts.

type ApiLeadStatus = Schemas["LeadStatus"];

const invert = <K extends string, V extends string>(map: Record<K, V>) =>
  Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key])) as Record<V, K>;

const COUNTRY_FROM_API = invert(COUNTRY_TO_API) as Record<Schemas["Country"], LeadCountry>;
const BUDGET_FROM_API = invert(BUDGET_TO_API) as Record<Schemas["BudgetRange"], LeadBudget>;

export const STATUS_TO_API: Record<LeadStatus, ApiLeadStatus> = {
  New: "new",
  Contacted: "contacted",
  "Proposal sent": "proposal_sent",
  Won: "won",
  Lost: "lost",
};
const STATUS_FROM_API = invert(STATUS_TO_API);

function noteFromApi(note: Schemas["LeadNoteOut"]): LeadNote {
  return { id: note.id, author: note.author_name, body: note.body, createdAt: note.created_at };
}

export function leadFromApi(lead: Schemas["LeadOut"]): Lead {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? "",
    business: lead.business ?? "",
    country: COUNTRY_FROM_API[lead.country],
    services: lead.services.map((service) => API_TO_SERVICE[service]),
    budget: BUDGET_FROM_API[lead.budget_range],
    message: lead.message,
    status: STATUS_FROM_API[lead.status],
    createdAt: lead.created_at,
    notes: lead.notes.map(noteFromApi),
    events: lead.events.map((event) => ({
      id: event.id,
      from: event.from_status ? STATUS_FROM_API[event.from_status] : null,
      to: STATUS_FROM_API[event.to_status],
      actor: event.actor_name,
      createdAt: event.created_at,
    })),
  };
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const result = await apiRequest<T>(method, path, body);
  if (!result.ok) throw new Error(errorMessage(result.error));
  return result.data as T;
}

/** Returns the lead as the API now has it, with the new event in its history. */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  return leadFromApi(await call<Schemas["LeadOut"]>("PATCH", `/api/v1/leads/${id}`, { status: STATUS_TO_API[status] }));
}

export async function addLeadNote(id: string, body: string): Promise<LeadNote> {
  return noteFromApi(await call<Schemas["LeadNoteOut"]>("POST", `/api/v1/leads/${id}/notes`, { body }));
}

export async function deleteLead(id: string): Promise<void> {
  await call("DELETE", `/api/v1/leads/${id}`);
}
