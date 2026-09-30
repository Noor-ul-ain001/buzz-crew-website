import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/admin";

const PAGES = [
  "/admin/content/testimonials",
  "/admin/content/testimonials/new",
  "/admin/content/team",
  "/admin/content/team/new",
  "/admin/content/logos",
];

test.setTimeout(180_000);

test("content screens have no detectable accessibility violations", async ({ page }) => {
  await page.goto("/admin/login");
  await signIn(page, "e2e-editor@example.com");
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
  for (const path of PAGES) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
