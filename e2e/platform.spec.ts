import { test as plain } from "@playwright/test";
import { SESSION_KEY, demo, expect, openCase, statusBar, test } from "./fixtures";

test("progress survives a reload, and Reset demo data restores the seed", async ({ page }) => {
  const d = demo(page);
  await openCase(page, "sc-ready-to-send");
  await page.getByRole("button", { name: "Send letter to defendant" }).click();
  await expect(statusBar(page)).toContainText("Letter mailed");

  await page.reload();
  await expect(statusBar(page)).toContainText("Letter mailed");

  await d.reset();
  await expect(statusBar(page)).toContainText("send your signed letter to the defendant");
});

test("a failed action shows an error toast and leaves the case untouched; retry works", async ({ page }) => {
  const d = demo(page);
  await openCase(page, "sc-ready-to-send");
  await d.click(/Show an error on the next action/);

  await page.getByRole("button", { name: "Send letter to defendant" }).click();
  await expect(page.getByText("Couldn't send the letter", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: /something went wrong/i }).first()).toBeVisible();
  await expect(statusBar(page)).toContainText("send your signed letter");

  await page.getByRole("button", { name: "Send letter to defendant" }).click();
  await expect(statusBar(page)).toContainText("Letter mailed");
});

test("demo panel lists every scenario, can jump between them, and closes with Escape", async ({ page }) => {
  const d = demo(page);
  await page.goto("/dashboard");
  await d.open();
  await expect(d.panel.getByRole("link")).toHaveCount(24);
  await d.panel.getByRole("link", { name: /Court filing: step needs changes/ }).first().click();
  await expect(page).toHaveURL(/ah-court-needs-changes$/);

  await d.open();
  // Simulation buttons only appear when they apply to the case you're on.
  await expect(d.panel.getByRole("button", { name: /Skip ahead 21 days/ })).toHaveCount(0);
  await expect(d.panel.getByRole("button", { name: /Approve|Draft the letter|Apply the requested/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(d.panel).toBeHidden();
});

test("response window shows urgent styling in the last days", async ({ page }) => {
  await openCase(page, "ah-window-urgent");
  const card = page.getByRole("region", { name: "Response window" });
  await expect(card).toHaveAttribute("data-urgent", "true");
  await expect(card).toContainText("2");
  await card.getByRole("link", { name: "Mark outcome early" }).click();
  await expect(page).toHaveURL(/outcome$/);
});

test("reminder toggle persists", async ({ page }) => {
  await openCase(page, "ah-window-urgent");
  const toggle = page.getByRole("switch", { name: /remind me when the response window closes/i });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await page.reload();
  await expect(page.getByRole("switch", { name: /remind me/i })).toBeChecked();
});

test("unknown case ids fail gracefully", async ({ page }) => {
  await openCase(page, "does-not-exist");
  await expect(page.getByText("We couldn't find that case")).toBeVisible();
  await page.getByRole("link", { name: "Back to my cases" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

// Plain test: the browser itself logs "Failed to load resource: 404" for a real 404 response.
plain("unknown routes return a real 404 page", async ({ page }) => {
  const res = await page.goto("/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("settings: validation, save, and persistence", async ({ page }) => {
  await page.goto("/dashboard/settings");
  const save = page.getByRole("button", { name: "Save changes" });
  await expect(save).toBeDisabled();

  await page.getByLabel(/^phone/i).fill("123");
  await page.getByLabel(/^zip/i).fill("abc");
  await save.click();
  await expect(page.getByText("Enter a 10-digit US phone number.")).toBeVisible();
  await expect(page.getByText("Enter a 5-digit ZIP code.")).toBeVisible();

  await page.getByLabel(/^phone/i).fill("(916) 555-0100");
  await page.getByLabel(/^zip/i).fill("95815");
  await page.getByLabel(/first name/i).fill("Alexandra");
  await save.click();
  await expect(page.getByText("Account updated", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(/first name/i)).toHaveValue("Alexandra");
  await expect(page.getByLabel(/^phone/i)).toHaveValue("(916) 555-0100");
  await expect(page.getByRole("button", { name: /account menu for alexandra rivera/i })).toBeVisible();

  // The new name is what must be typed to sign.
  await openCase(page, "sc-awaiting-signature", "/review");
  await page.getByRole("button", { name: "Sign now" }).click();
  await expect(page.getByRole("dialog")).toContainText("Must match: Alexandra Rivera");
});

test("cross-tab: a change in one tab shows up in another", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript((key) => window.localStorage.setItem(key, "1"), SESSION_KEY);
  const a = await context.newPage();
  const b = await context.newPage();
  await openCase(a, "sc-ready-to-send");
  await openCase(b, "sc-ready-to-send");

  await a.getByRole("button", { name: "Send letter to defendant" }).click();
  await expect(statusBar(a)).toContainText("Letter mailed");
  await expect(statusBar(b)).toContainText("Letter mailed");
  await context.close();
});
