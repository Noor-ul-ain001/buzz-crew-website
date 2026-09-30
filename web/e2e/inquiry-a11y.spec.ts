import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the inquiry modal has no WCAG A/AA violations and traps focus", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Start a project" }).first();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Start a project" });
  await expect(dialog).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include("dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  // Focus stays inside the dialog while tabbing.
  for (let i = 0; i < 25; i += 1) {
    await page.keyboard.press("Tab");
    const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(inside).toBe(true);
  }

  // Escape closes the dialog and returns focus to the trigger.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the contact page form has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("/contact");
  const results = await new AxeBuilder({ page })
    .include("form")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
