import { describe, expect, it } from "vitest";
import { parseWorkFilters, workHref } from "@/lib/content/work-filters";

describe("work filters", () => {
  it("maps hyphenated URL values to API values", () => {
    expect(parseWorkFilters({ industry: "healthcare-dental", service: "ai-automation", page: "2" })).toEqual({
      industry: "healthcare_dental",
      service: "ai_automation",
      page: 2,
    });
  });

  it("drops unknown values silently", () => {
    expect(parseWorkFilters({ industry: "space-travel", service: "magic", page: "-4" })).toEqual({
      industry: null,
      service: null,
      page: 1,
    });
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseWorkFilters({ industry: ["education", "other"] }).industry).toBe("education");
  });

  it("builds shareable addresses", () => {
    expect(workHref({})).toBe("/work");
    expect(workHref({ industry: "food_beverages", service: "branding", page: 1 })).toBe("/work?industry=food-beverages&service=branding");
    expect(workHref({ service: "ui_ux_design", page: 3 })).toBe("/work?service=ui-ux-design&page=3");
  });
});
