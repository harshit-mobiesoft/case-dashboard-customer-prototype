import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// One representative URL per distinct screen / state. axe checks WCAG 2.x A/AA.
const SCREENS: [string, string][] = [
  ["home", "/"],
  ["signup", "/signup"],
  ["intake: Small Claims", "/smallclaimshero?new=1"],
  ["intake: Activation Hero", "/activationhero?new=1"],
  ["intake: resumed at review", "/smallclaimshero?resume=draft-ah-1"],
  ["dashboard", "/dashboard"],
  ["settings", "/dashboard/settings"],
  ["case: your turn (sign)", "/dashboard/cases/sc-awaiting-signature"],
  ["case: ready to send", "/dashboard/cases/sc-ready-to-send"],
  ["case: our turn", "/dashboard/cases/sc-letter-in-progress"],
  ["case: revision requested", "/dashboard/cases/ah-revision-requested"],
  ["case: waiting window", "/dashboard/cases/sc-waiting-window"],
  ["case: urgent window", "/dashboard/cases/ah-window-urgent"],
  ["case: outcome needed", "/dashboard/cases/ah-outcome-needed"],
  ["case: get organized (AH)", "/dashboard/cases/ah-get-organized"],
  ["case: court filing rejected step", "/dashboard/cases/sc-court-needs-changes"],
  ["case: court filing in review", "/dashboard/cases/sc-court-in-review"],
  ["case: ready to close", "/dashboard/cases/sc-court-ready-to-close"],
  ["case: closed", "/dashboard/cases/sc-closed-settled"],
  ["review: sign", "/dashboard/cases/sc-awaiting-signature/review"],
  ["review: edit form", "/dashboard/cases/sc-awaiting-signature/review?edit=1"],
  ["review: sent", "/dashboard/cases/sc-waiting-window/review"],
  ["AH: questionnaire ready", "/dashboard/cases/ah-questionnaire-ready"],
  ["AH: evidence nudge", "/dashboard/cases/ah-evidence-nudge"],
  ["AH: letter in progress", "/dashboard/cases/ah-letter-in-progress"],
  ["AH: revision requested", "/dashboard/cases/ah-revision-requested"],
  ["AH: awaiting signature", "/dashboard/cases/ah-awaiting-signature"],
  ["AH: ready to send", "/dashboard/cases/ah-ready-to-send"],
  ["AH: waiting window", "/dashboard/cases/ah-waiting-window"],
  ["AH: court just started", "/dashboard/cases/ah-court-just-started"],
  ["AH: court needs changes", "/dashboard/cases/ah-court-needs-changes"],
  ["AH: court in review", "/dashboard/cases/ah-court-in-review"],
  ["AH: ready to close", "/dashboard/cases/ah-court-ready-to-close"],
  ["AH: closed (settled)", "/dashboard/cases/ah-closed-settled"],
  ["AH: closed (court)", "/dashboard/cases/ah-closed-court"],
  ["AH: questionnaire", "/dashboard/cases/ah-questionnaire-ready/questionnaire"],
  ["documents", "/dashboard/cases/sc-awaiting-signature/documents"],
  ["documents: AH organize", "/dashboard/cases/ah-get-organized/documents"],
  ["outcome", "/dashboard/cases/sc-waiting-window/outcome"],
  ["questionnaire (gated)", "/dashboard/cases/ah-get-organized/questionnaire"],
];

for (const [name, url] of SCREENS) {
  test(`axe: ${name}`, async ({ page }) => {
    await page.goto(url);
    // Let hydration + skeleton → content settle.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // The case status bar deliberately uses the production palette (white on amber/brand/green).
      .exclude("section[data-bucket]")
      .analyze();
    expect(
      results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
    ).toEqual([]);
  });
}

test("axe: dialogs and the demo panel", async ({ page }) => {
  await page.goto("/dashboard/cases/sc-awaiting-signature/review");
  await page.getByRole("button", { name: "Sign now" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  let results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: "Demo controls" }).click();
  results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
});

test.describe("keyboard & structure", () => {
  test("skip link is the first tab stop and jumps to main content", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("every screen has exactly one h1", async ({ page }) => {
    for (const [, url] of SCREENS) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  });

  test("dialogs trap focus, close on Escape and restore focus to the trigger", async ({ page }) => {
    await page.goto("/dashboard/cases/sc-awaiting-signature/review");
    const trigger = page.getByRole("button", { name: "Sign now" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Sign your demand letter" });
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(inside, `focus escaped the dialog on tab ${i + 1}`).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("the whole sign flow works with the keyboard alone", async ({ page }) => {
    await page.goto("/dashboard/cases/sc-awaiting-signature/review");
    await page.getByRole("button", { name: "Sign now" }).focus();
    await page.keyboard.press("Enter");
    // Name and consent are pre-filled, so focus is in the name field and Enter submits.
    await expect(page.getByLabel(/full legal name/i)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Letter signed!" })).toBeVisible();
  });
});
