import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/admin";

// Needs the API with REVALIDATE_SECRET and WEB_URL pointing at this web server, so that
// publishing refreshes the home page at once (specs/004-content-publishing/quickstart.md).
// `next dev` compiles each admin page on first visit, which can take a while.
test.setTimeout(120_000);

test("an editor drafts, publishes and unpublishes a testimonial", async ({ page, request }) => {
  const stamp = Date.now();
  const name = `E2E Client ${stamp}`;
  const quote = `Working with the crew doubled our enquiries in three months (${stamp}).`;
  const homeHtml = async () => (await request.get("/")).text();

  await page.goto("/admin/login?next=/admin/content/testimonials/new");
  await signIn(page, "e2e-editor@example.com");
  await expect(page.getByRole("heading", { name: "New testimonial" })).toBeVisible({ timeout: 45_000 });

  await page.getByLabel(/^Name/).fill(name);
  await page.getByLabel(/^Role/).fill("Founder");
  await page.getByLabel(/^Company/).fill("E2E Bakery");
  await page.getByLabel(/^Country/).selectOption("UAE");
  await page.getByLabel(/^Quote/).fill(quote);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/admin\/content\/testimonials$/, { timeout: 20_000 });
  expect(await homeHtml()).not.toContain(quote);

  await page.getByRole("link", { name: `Edit ${name}` }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/admin\/content\/testimonials$/, { timeout: 20_000 });
  await expect.poll(homeHtml, { timeout: 15_000 }).toContain(quote);

  await page.getByRole("link", { name: `Edit ${name}` }).click();
  await page.getByRole("button", { name: "Unpublish" }).click();
  await expect(page).toHaveURL(/\/admin\/content\/testimonials$/, { timeout: 20_000 });
  await expect.poll(homeHtml, { timeout: 15_000 }).not.toContain(quote);
});

test("publishing without the required fields shows errors beside them", async ({ page }) => {
  await page.goto("/admin/login?next=/admin/content/testimonials/new");
  await signIn(page, "e2e-editor@example.com");
  await expect(page.getByRole("heading", { name: "New testimonial" })).toBeVisible({ timeout: 45_000 });
  await page.getByLabel(/^Name/).fill("Only a name");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Quote must be at least 20 characters.")).toBeVisible();
  await expect(page.getByText("Choose a country.")).toBeVisible();
});
