import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/admin";

// Needs: web on :3000, API on :8000 (SESSION_COOKIE_SECURE=false for http) and the seeded
// accounts from `uv run python scripts/seed_e2e_users.py` (specs/003-admin-auth-roles/quickstart.md).
test("signed-out visitors are sent to sign-in and returned to the page they wanted", async ({ page }) => {
  await page.goto("/admin/content/posts");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fcontent%2Fposts/);

  await signIn(page, "e2e-admin@example.com");
  await expect(page).toHaveURL(/\/admin\/content\/posts$/, { timeout: 15_000 });
  await expect(page.getByText("E2E Admin")).toBeVisible();
});

test("a wrong password shows one general message", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel(/^Email/).fill("e2e-admin@example.com");
  await page.getByLabel(/^Password/).fill("not the right password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The email or password is incorrect." })).toBeVisible();
});

test("signing out ends the session", async ({ page }) => {
  await page.goto("/admin/login");
  await signIn(page, "e2e-admin@example.com");
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });

  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/admin\/login\?reason=signed_out/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("an external next link is ignored", async ({ page }) => {
  await page.goto("/admin/login?next=https://evil.example");
  await signIn(page, "e2e-admin@example.com");
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
});
