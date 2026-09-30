import { expect, test } from "@playwright/test";

// Needs: web on :3000 and the API on :8000 with EMAIL_PROVIDER=fake.
test("a visitor submits an inquiry from the home page on a phone", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start a project" }).first().click();

  const dialog = page.getByRole("dialog", { name: "Start a project" });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel(/^Name/).fill("Playwright Visitor");
  await dialog.getByLabel(/^Email/).fill("visitor@example.com");
  await dialog.getByLabel(/^Country/).selectOption("UAE");
  await dialog.getByLabel(/^Monthly budget/).selectOption("Not sure yet");
  await dialog.getByText("Digital Marketing", { exact: true }).click();
  await dialog.getByLabel(/^Tell us about your project/).fill("We are launching a new clinic in Dubai.");

  const send = dialog.getByRole("button", { name: "Send inquiry" });
  await expect(send).toBeEnabled({ timeout: 15_000 });
  await send.click();

  // Generous timeout: the first request in `next dev` compiles the proxy route.
  await expect(dialog.getByRole("heading", { name: /within 24 hours/ })).toBeFocused({ timeout: 15_000 });
});

test("invalid input shows inline errors and sends nothing", async ({ page }) => {
  await page.goto("/contact");
  let posted = false;
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/leads") && request.method() === "POST") posted = true;
  });

  await page.getByLabel(/^Tell us about your project/).fill("short");
  await page.getByRole("button", { name: "Send inquiry" }).click({ trial: false }).catch(() => {});
  await page.getByLabel(/^Name/).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText("Please enter your name.")).toBeVisible();
  expect(posted).toBe(false);
});
