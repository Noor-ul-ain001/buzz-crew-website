import { z } from "zod";

export const COUNTRIES = ["Pakistan", "UAE", "UK", "Other"] as const;

// The agency's services, exactly as the brochure (ABOUT BUZZ CREW.pdf) lists them.
export const SERVICES = [
  "Digital Marketing",
  "Creative & Graphic Design",
  "Web / Software Development",
  "UI/UX Design",
  "Video & Content Production",
  "Public Relations",
  "Branding",
  "Copywriting",
  "AI & Automation",
  "IoT & Smart Digital Solutions",
] as const;

export const BUDGETS = [
  "Under PKR 50k",
  "PKR 50k–150k",
  "PKR 150k+",
  "Not sure yet",
] as const;

export const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(100, "Please keep your name under 100 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .pipe(z.email("Please enter a valid email address, e.g. name@company.com.")),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || PHONE_PATTERN.test(value),
      "Please enter a valid phone number, e.g. +92 300 1234567.",
    ),
  businessName: z
    .string()
    .trim()
    .max(150, "Please keep the business name under 150 characters."),
  // Mirrors the API's rules (research R8): country, at least one service and a budget
  // choice are required; "Not sure yet" keeps the budget question easy.
  country: z.union([z.enum(COUNTRIES), z.literal("")]).refine((value) => value !== "", {
    message: "Please choose your country.",
  }),
  services: z
    .array(z.enum(SERVICES))
    .min(1, "Please choose at least one service."),
  budget: z.union([z.enum(BUDGETS), z.literal("")]).refine((value) => value !== "", {
    message: "Please choose a budget, or “Not sure yet”.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (at least 10 characters).")
    .max(2000, "Please keep your message under 2,000 characters."),
});

export type InquiryFormValues = z.input<typeof inquirySchema>;
export type InquiryData = z.output<typeof inquirySchema>;

export const EMPTY_INQUIRY: InquiryFormValues = {
  name: "",
  email: "",
  phone: "",
  businessName: "",
  country: "",
  services: [],
  budget: "",
  message: "",
};
