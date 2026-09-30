import { expect, test } from "@playwright/test";

// Needs the API with the agency's projects loaded (`uv run python -m app.cli seed-case-studies`).
test.setTimeout(120_000);

const cards = (page: import("@playwright/test").Page) => page.getByRole("list").filter({ has: page.getByRole("article") }).getByRole("article");

test("filters are shareable and Back restores them", async ({ page, browser }) => {
  await page.goto("/work");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 45_000 });

  await page.getByRole("navigation", { name: "Filter by industry" }).getByRole("link", { name: /Media & news/ }).click();
  await expect(page).toHaveURL(/industry=media-news/, { timeout: 30_000 });
  await expect(page.getByRole("status").filter({ hasText: "match these filters" })).toContainText("3 case studies");

  await page.getByRole("navigation", { name: "Filter by industry" }).getByRole("link", { name: /Retail/ }).click();
  await expect(page).toHaveURL(/industry=retail/, { timeout: 30_000 });
  const filteredTitles = await cards(page).getByRole("heading").allTextContents();
  expect(filteredTitles).toEqual([expect.stringContaining("Mercantile Pakistan")]);

  // The same address in a fresh browser shows the same results.
  const other = await browser.newContext();
  const fresh = await other.newPage();
  await fresh.goto(page.url());
  expect(await cards(fresh).getByRole("heading").allTextContents()).toEqual(filteredTitles);
  await other.close();

  // Filters replace history entries, so Back leaves /work and returns to where we were.
  await page.goto("/work?industry=media-news");
  await page.goto("/");
  await page.goBack();
  await expect(page).toHaveURL(/\/work\?industry=media-news/, { timeout: 30_000 });
});

test("a case study page leads with results and offers a similar project", async ({ page }) => {
  await page.goto("/work/islamabad-now");
  await expect(page.getByRole("heading", { level: 1, name: "A verified city news brand with 156K followers" })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText("156K").first()).toBeVisible();

  await page.getByRole("button", { name: "Start a similar project" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Start a project" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByRole("checkbox", { name: "Social Media" })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "SEO" })).not.toBeChecked();
});

test("share copies the link on desktop", async ({ browser }) => {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"], hasTouch: false });
  const page = await context.newPage();
  await page.goto("/work/islamabad-now");
  await page.getByRole("button", { name: "Copy link" }).click({ timeout: 45_000 });
  await expect(page.getByText("Link copied to your clipboard.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("/work/islamabad-now");
  await context.close();
});

test("unknown case studies are a 404", async ({ request }) => {
  expect((await request.get("/work/this-does-not-exist")).status()).toBe(404);
});
