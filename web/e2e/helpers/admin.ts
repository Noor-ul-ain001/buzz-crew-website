import type { Page } from "@playwright/test";

// Accounts from `uv run python scripts/seed_e2e_users.py` (development database only).
export const PASSWORD = "correct horse battery staple";

export async function signIn(page: Page, email: string) {
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}
