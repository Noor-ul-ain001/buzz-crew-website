import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/admin";

// Creating a publishable case study needs a cover image, which needs Cloudinary; this test
// reuses the seeded draft (whose cover is a local image) for the publish steps.
test.setTimeout(180_000);

test("draft, preview, publishing checks, publish and unpublish", async ({ page, browser, request }) => {
  await page.goto("/admin/login?next=/admin/content/case-studies");
  await signIn(page, "e2e-editor@example.com");
  await expect(page.getByRole("heading", { name: "Case studies", level: 1 })).toBeVisible({ timeout: 45_000 });

  await page.getByRole("link", { name: "Edit Sample Draft (demo)" }).click();
  await expect(page.getByRole("heading", { name: "Edit case study" })).toBeVisible({ timeout: 45_000 });
  const editUrl = page.url();

  // Preview works while signed in, with the banner.
  await page.getByRole("link", { name: "Preview" }).click();
  await expect(page.getByText(/Preview of a draft/)).toBeVisible({ timeout: 45_000 });
  const previewUrl = page.url();

  // Signed out, the preview address sends people to sign in.
  const anonymous = await browser.newContext();
  const outsider = await anonymous.newPage();
  await outsider.goto(previewUrl);
  await expect(outsider).toHaveURL(/\/admin\/login\?next=/);
  await anonymous.close();

  // Publishing with no results shows the exact message.
  await page.goto(editUrl);
  await page.getByLabel(/^Summary/).fill("A sample draft used by the end-to-end test.");
  for (const [label, text] of [
    ["The challenge", "Before: nothing."],
    ["Our strategy", "A plan."],
    ["How we did it", "The work."],
  ]) {
    await page.getByRole("textbox", { name: new RegExp(`^${label}`) }).fill(text);
  }
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Add at least one result before publishing")).toBeVisible({ timeout: 20_000 });

  // Add a result and publish: the page is live.
  await page.getByRole("button", { name: "Add a result" }).click();
  await page.getByLabel("Value").fill("+50%");
  await page.getByLabel("What was measured").fill("enquiries");
  await page.getByLabel("Period").fill("in 2 months");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/admin\/content\/case-studies$/, { timeout: 30_000 });
  await expect.poll(async () => (await request.get("/work/sample-draft-case-study")).status(), { timeout: 20_000 }).toBe(200);

  // Unpublish: gone from the site.
  await page.getByRole("link", { name: "Edit Sample Draft (demo)" }).click();
  await page.getByRole("button", { name: "Unpublish" }).click();
  await expect(page).toHaveURL(/\/admin\/content\/case-studies$/, { timeout: 30_000 });
  await expect.poll(async () => (await request.get("/work/sample-draft-case-study")).status(), { timeout: 20_000 }).toBe(404);
});
