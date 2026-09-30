import type { BUDGETS, COUNTRIES, SERVICES } from "@/lib/validation/inquiry";

export const LEAD_STATUSES = ["New", "Contacted", "Proposal sent", "Won", "Lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadCountry = (typeof COUNTRIES)[number];
export type LeadService = (typeof SERVICES)[number];
export type LeadBudget = (typeof BUDGETS)[number];

export type LeadNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

/** A status change. `from` is null for the event that created the lead. */
export type LeadEvent = {
  id: string;
  from: LeadStatus | null;
  to: LeadStatus;
  actor: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  /** Empty string when the visitor didn't provide one (the field is optional on the form). */
  phone: string;
  business: string;
  country: LeadCountry;
  services: LeadService[];
  budget: LeadBudget;
  message: string;
  status: LeadStatus;
  createdAt: string;
  notes: LeadNote[];
  events: LeadEvent[];
};
