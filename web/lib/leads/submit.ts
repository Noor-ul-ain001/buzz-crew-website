import { api, type ErrorDetailBody, type LeadCreate, type ValidationErrorBody } from "@/lib/api/client";
import {
  API_FIELD_TO_FORM,
  BUDGET_TO_API,
  COUNTRY_TO_API,
  SERVICE_TO_API,
} from "@/lib/validation/enum-map";
import type { InquiryData } from "@/lib/validation/inquiry";

export type SubmitContext = {
  idempotencyKey: string;
  sourcePage: string;
  /** Hidden field; people leave it empty, bots often fill it (the API rejects it). */
  honeypot?: string;
};

export type SubmitResult =
  | { kind: "created"; id: string; postProcessToken: string }
  | { kind: "invalid"; fieldErrors: Record<string, string> }
  | { kind: "rate_limited"; message: string }
  | { kind: "error" };

export function toLeadCreate(data: InquiryData, context: SubmitContext): LeadCreate {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    business: data.businessName || null,
    country: COUNTRY_TO_API[data.country],
    services: data.services.map((service) => SERVICE_TO_API[service]),
    budget_range: BUDGET_TO_API[data.budget],
    message: data.message,
    source_page: context.sourcePage,
    idempotency_key: context.idempotencyKey,
    ...(context.honeypot ? { website: context.honeypot } : {}),
  };
}

export async function submitInquiry(data: InquiryData, context: SubmitContext): Promise<SubmitResult> {
  try {
    const { data: created, error, response } = await api.POST("/api/v1/leads", {
      body: toLeadCreate(data, context),
    });
    if (created) {
      return { kind: "created", id: created.id, postProcessToken: created.post_process_token };
    }
    if (response.status === 422) {
      return { kind: "invalid", fieldErrors: fieldErrorsFrom(error as unknown as ValidationErrorBody) };
    }
    if (response.status === 429) {
      return { kind: "rate_limited", message: (error as unknown as ErrorDetailBody).detail.message };
    }
    return { kind: "error" };
  } catch {
    return { kind: "error" };
  }
}

function fieldErrorsFrom(body: ValidationErrorBody): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const entry of body.detail ?? []) {
    const apiField = String(entry.loc[1] ?? "");
    const field = API_FIELD_TO_FORM[apiField];
    if (field && !errors[field]) errors[field] = "Please check this field.";
  }
  return errors;
}
