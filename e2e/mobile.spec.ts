import { demo, expect, openCase, statusBar, test } from "./fixtures";

const noHorizontalScroll = async (page: import("@playwright/test").Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(0);
};

test("every screen fits a phone without horizontal scrolling", async ({ page }) => {
  for (const url of [
    "/dashboard",
    "/dashboard/settings",
    "/dashboard/cases/sc-awaiting-signature",
    "/dashboard/cases/sc-court-needs-changes",
    "/dashboard/cases/sc-waiting-window",
    "/dashboard/cases/sc-awaiting-signature/review",
    "/dashboard/cases/sc-awaiting-signature/documents",
    "/dashboard/cases/sc-waiting-window/outcome",
    "/dashboard/cases/ah-get-organized/documents",
    "/",
    "/smallclaimshero",
    "/activationhero",
    "/signup",
    "/terms",
  ]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
  }
});

test("a customer can sign and send from a phone", async ({ page }) => {
  await openCase(page, "sc-awaiting-signature");
  await statusBar(page).getByRole("link", { name: /review and sign/i }).click();
  await page.getByRole("button", { name: "Sign now" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/full legal name/i).fill("Alex Rivera");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Sign letter" }).click();
  await page.getByRole("link", { name: "Back to my case" }).click();
  await page.getByRole("button", { name: "Send letter to defendant" }).first().click();
  await expect(statusBar(page)).toContainText("Letter mailed");
});

test("the demo panel is usable on a phone and doesn't overflow", async ({ page }) => {
  const d = demo(page);
  await page.goto("/dashboard");
  await d.open();
  const box = await d.panel.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  await d.panel.getByRole("link", { name: /Get organized/ }).first().click();
  await expect(page).toHaveURL(/ah-get-organized$/);
});
