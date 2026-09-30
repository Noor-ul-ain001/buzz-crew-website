import type { Schemas } from "@/lib/api/client";
import { SERVICE_TO_API } from "@/lib/validation/enum-map";
import type { SERVICES } from "@/lib/validation/inquiry";

export type Industry = Schemas["Industry"];
export type ApiService = Schemas["Service"];
type ServiceLabel = (typeof SERVICES)[number];

export const INDUSTRY_LABELS: Record<Industry, string> = {
  food_beverages: "Food & beverages",
  farmhouses: "Farmhouses",
  healthcare_dental: "Healthcare & dental",
  education: "Education",
  ecommerce: "E-commerce",
  media_news: "Media & news",
  retail: "Retail",
  other: "Other",
};

export const INDUSTRIES = Object.keys(INDUSTRY_LABELS) as Industry[];

/** API value → the label visitors see (the inquiry form uses the same labels). */
export const SERVICE_LABELS = Object.fromEntries(
  Object.entries(SERVICE_TO_API).map(([label, value]) => [value, label]),
) as Record<ApiService, ServiceLabel>;

export const SERVICES_API = Object.values(SERVICE_TO_API) as ApiService[];

export const COUNTRY_LABELS: Record<Schemas["Country"], string> = {
  pakistan: "Pakistan",
  uae: "UAE",
  uk: "UK",
  other: "International",
};

/** URLs use hyphens (healthcare-dental); the API uses underscores (healthcare_dental). */
export const toUrlValue = (value: string) => value.replaceAll("_", "-");
export const fromUrlValue = (value: string) => value.replaceAll("-", "_");
