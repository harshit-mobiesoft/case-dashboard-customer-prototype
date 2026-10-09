import { expect, test } from "./fixtures";

test.describe("My cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("shows every group of cases", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "My cases" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /open cases · 4/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /draft cases · 2/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /closed cases · 1/i })).toBeVisible();
    await expect(page.getByText("Prototype", { exact: true })).toBeVisible();
  });

  test("puts cases waiting on you first and uses the production status wording", async ({ page }) => {
    const first = page.locator("#open-heading").locator("xpath=ancestor::section").getByRole("link").first();
    await expect(first).toContainText(/Pending|Awaiting Signature|Court Filing/);
    for (const badge of ["Pending", "Awaiting Signature", "Mailed", "Court Filing", "Closed"]) {
      await expect(page.getByText(badge, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText("Phase 2").first()).toBeVisible();
  });

  test("search + service + view filters narrow the list and can be cleared", async ({ page }) => {
    const cards = page.getByRole("link", { name: /open case against/i });
    await page.getByRole("searchbox", { name: "Search cases" }).fill("doordash");
    await expect(cards).toHaveCount(1);

    await page.getByRole("searchbox", { name: "Search cases" }).fill("nothing-matches-this");
    await expect(page.getByText("No cases match your filters")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(cards).toHaveCount(5);

    await page.getByLabel("Service", { exact: true }).selectOption("activation_hero");
    await expect(cards).toHaveCount(5);
    await page.getByLabel("Service", { exact: true }).selectOption("all");
    await page.getByLabel("Show").selectOption("closed");
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /open cases/i })).toHaveCount(0);
  });

  test("a draft can be cancelled (after confirming) and survives a reload", async ({ page }) => {
    await page.getByRole("button", { name: "Cancel Small Claims Hero draft" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Keep it" }).click();
    await expect(page.getByRole("heading", { name: /draft cases · 2/i })).toBeVisible();

    await page.getByRole("button", { name: "Cancel Small Claims Hero draft" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Yes, cancel it" }).click();
    await expect(page.getByRole("heading", { name: /draft cases · 1/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: /draft cases · 1/i })).toBeVisible();
  });

  test("'+ Small Claims' / '+ Activation Hero' start a fresh intake", async ({ page }) => {
    await page.getByRole("link", { name: "Small Claims", exact: true }).click();
    await expect(page).toHaveURL(/\/smallclaimshero\?new=1$/);
    await expect(page.getByRole("heading", { level: 1, name: "Your information" })).toBeVisible();
  });

  test("'Resume' reopens a draft at the step it stopped on", async ({ page }) => {
    await page.getByRole("link", { name: "Resume" }).first().click();
    await expect(page).toHaveURL(/resume=draft-/);
    await expect(page.getByRole("heading", { level: 1, name: /Defendant information|Review your claim/ })).toBeVisible();
  });

  test("opens a case and the account menu reaches settings", async ({ page }) => {
    await page.getByRole("link", { name: /open case against doordash/i }).click();
    await expect(page).toHaveURL(/ah-awaiting-signature$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("vs. DoorDash, Inc.");

    await page.getByRole("button", { name: /account menu for alex rivera/i }).click();
    await page.getByRole("menuitem", { name: "Account settings" }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings$/);

    await page.getByRole("button", { name: /account menu for alex rivera/i }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  });
});
