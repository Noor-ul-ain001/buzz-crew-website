import createClient from "openapi-fetch";
import { markActivity } from "@/lib/auth/activity";
import type { components, paths } from "./schema";

// Generated from the FastAPI schema: `npm run api:export && npm run api:types`.
// Browser calls stay same-origin; /api/v1 is rewritten to the API (DEPLOYMENT D2).
export const api = createClient<paths>({ baseUrl: "" });

// Any successful admin API call counts as activity for the idle-timeout warning.
api.use({
  onResponse({ response }) {
    if (response.ok && typeof window !== "undefined") markActivity();
  },
});

export type Schemas = components["schemas"];
export type LeadCreate = Schemas["LeadCreate"];
export type LeadCreated = Schemas["LeadCreated"];
export type ApiService = Schemas["Service"];
export type ApiCountry = Schemas["Country"];
export type ApiBudgetRange = Schemas["BudgetRange"];

/** FastAPI 422 body: one entry per invalid field. */
export type ValidationErrorBody = { detail: { loc: (string | number)[]; msg: string; type: string }[] };

/** Our error body for 400/429/500. */
export type ErrorDetailBody = { detail: { code: string; message: string } };
