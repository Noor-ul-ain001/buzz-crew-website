import type { ApiBudgetRange, ApiCountry, ApiService } from "@/lib/api/client";
import type { BUDGETS, COUNTRIES, SERVICES } from "@/lib/validation/inquiry";

type Country = (typeof COUNTRIES)[number];
type ServiceLabel = (typeof SERVICES)[number];
type Budget = (typeof BUDGETS)[number];

// Display labels (what visitors see) → stable API enum values (research R9).
export const COUNTRY_TO_API: Record<Country, ApiCountry> = {
  Pakistan: "pakistan",
  UAE: "uae",
  UK: "uk",
  Other: "other",
};

export const SERVICE_TO_API: Record<ServiceLabel, ApiService> = {
  "Social Media": "social_media",
  SEO: "seo",
  "Web & Software": "web_software",
  "UI/UX Design": "ui_ux_design",
  "Meta Ads": "meta_ads",
};

export const BUDGET_TO_API: Record<Budget, ApiBudgetRange> = {
  "Under PKR 50k": "under_50k",
  "PKR 50k–150k": "50k_150k",
  "PKR 150k+": "150k_plus",
  "Not sure yet": "not_sure",
};

export const API_TO_SERVICE = Object.fromEntries(
  Object.entries(SERVICE_TO_API).map(([label, value]) => [value, label]),
) as Record<ApiService, ServiceLabel>;

// API field names → form field names, for mapping 422 errors onto inline messages.
export const API_FIELD_TO_FORM: Record<string, string> = {
  name: "name",
  email: "email",
  phone: "phone",
  business: "businessName",
  country: "country",
  services: "services",
  budget_range: "budget",
  message: "message",
};
