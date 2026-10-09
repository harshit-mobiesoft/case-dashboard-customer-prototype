import { expect, openCase, statusBar, test } from "./fixtures";

// These specs exercise validation, so they run in strict mode (the app default never blocks).
test.use({ strict: true });

test("Activation Hero: get organized → questionnaire → our team takes over", async ({ page }) => {
  await openCase(page, "ah-get-organized");

  // Evidence-first: the questionnaire is locked behind getting organized.
  await expect(statusBar(page)).toContainText("get organized");
  await expect(page.getByRole("region", { name: "Recommended next step" })).toHaveCount(0);
  await page.goto("/dashboard/cases/ah-get-organized/questionnaire");
  await expect(page.getByText("Get organized first")).toBeVisible();

  await page.getByRole("link", { name: "Get organized" }).click();
  await expect(page).toHaveURL(/documents$/);
  await page.getByRole("checkbox", { name: /don't have any evidence/i }).check();
  await expect(page.getByText("You're organized — next, answer a few quick questions.")).toBeVisible();

  await page.getByRole("link", { name: /start questionnaire/i }).click();
  await expect(page.getByRole("heading", { name: "A few quick questions" })).toBeVisible();
  const submit = page.getByRole("button", { name: "Submit answers" });
  await expect(submit).toBeDisabled();

  await page.getByRole("group", { name: /passenger\/customer claim/i }).getByText("No", { exact: true }).click();
  await page.getByRole("group", { name: /reputation/i }).getByText("Yes", { exact: true }).click();
  await page.getByRole("group", { name: /organizing other workers/i }).getByText("Skip", { exact: true }).click();
  await expect(page.getByText("2 answered · 2 to go")).toBeVisible();
  await expect(page.getByText(/you skipped 1 question/i)).toBeVisible();
  await submit.click();

  await expect(page).toHaveURL(/ah-get-organized$/);
  await expect(statusBar(page)).toContainText("Our team is preparing your demand letter");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("RideNow");
  await expect(page.getByText("Wrongful Deactivation").first()).toBeVisible();
  await expect(page.getByText("Claim type selected by our team")).toBeVisible();
});
