import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/admin";

test("editors see content only and are refused confidential pages", async ({ page }) => {
  await page.goto("/admin/login");
  await signIn(page, "e2e-editor@example.com");
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });

  const nav = page.getByRole("navigation", { name: "Admin" });
  await expect(nav.getByRole("link", { name: "Content" })).toBeVisible();
  for (const hidden of ["Leads", "Subscribers", "Team"]) {
    await expect(nav.getByRole("link", { name: hidden })).toHaveCount(0);
  }

  for (const path of ["/admin/leads", "/admin/subscribers", "/admin/users"]) {
    const response = await page.goto(path);
    await expect(page.getByRole("heading", { name: "You don't have access to this page" })).toBeVisible();
    const html = (await response?.text()) ?? "";
    // Names from the (mock) lead data must never reach an editor's browser.
    for (const leadName of ["Bilal Ahmed", "Fatima Noor", "Chai Khana Co."]) expect(html).not.toContain(leadName);
  }

  const api = await page.request.get("/api/v1/leads");
  expect(api.status()).toBe(403);
});
