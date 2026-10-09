import { expect, openCase, statusBar, test } from "./fixtures";

// Default mode: a viewer can always move on — no form, dialog or gate stops the walkthrough.
test.describe("nothing blocks the way forward", () => {
  test("the questionnaire submits with zero answers, even before 'getting organized'", async ({ page }) => {
    await openCase(page, "ah-get-organized");
    await page.getByRole("link", { name: /start questionnaire/i }).first().click();
    await expect(page.getByRole("button", { name: "Submit answers" })).toBeEnabled();
    await page.getByRole("button", { name: "Submit answers" }).click();
    await expect(statusBar(page)).toContainText("Our team is preparing your demand letter");
  });

  test("signing works with everything cleared; an edit request works with nothing filled in", async ({ page }) => {
    await openCase(page, "ah-awaiting-signature", "/review");
    await page.getByRole("button", { name: "Request an edit" }).click();
    await expect(page.getByRole("button", { name: "Submit edit request" })).toBeEnabled();
    await page.getByRole("button", { name: "Submit edit request" }).click();
    await expect(page.getByRole("heading", { name: "Edit request submitted" })).toBeVisible();

    await openCase(page, "ah-ready-to-send");
    await page.getByRole("link", { name: "Need changes? Request an edit" }).click();
    await page.getByRole("button", { name: "Submit edit request" }).click();
    await expect(page.getByRole("heading", { name: "Edit request submitted" })).toBeVisible();

    await openCase(page, "sc-awaiting-signature", "/review");
    await page.getByRole("button", { name: "Sign now" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/full legal name/i).fill("");
    await dialog.getByRole("checkbox").uncheck();
    await dialog.getByRole("button", { name: "Sign letter" }).click();
    await expect(page.getByRole("heading", { name: "Letter signed!" })).toBeVisible();
  });

  test("outcome: proceed with nothing selected and no 'are you sure?' step; settle with no choice", async ({ page }) => {
    await openCase(page, "ah-waiting-window", "/outcome");
    await page.getByRole("button", { name: /responded, but unsatisfactorily/i }).click();
    await page.getByLabel(/amount received/i).fill("not money");
    await page.getByRole("button", { name: "Proceed to court filing" }).click();
    await expect(page).toHaveURL(/ah-waiting-window$/);
    await expect(statusBar(page)).toContainText("start your next court filing step");

    await openCase(page, "ah-window-urgent", "/outcome");
    await page.getByRole("button", { name: /we already settled/i }).click();
    await page.getByRole("button", { name: "Close my case" }).click();
    await expect(page.getByRole("heading", { name: "Case closed" })).toBeVisible();
  });

  test("a court step submits with an empty form", async ({ page }) => {
    await openCase(page, "ah-court-just-started");
    const form = page.getByRole("form", { name: "File your Statement of Claim online" });
    await form.getByRole("button", { name: /submit for review/i }).click();
    await expect(statusBar(page)).toContainText("Our team is reviewing what you submitted");
  });

  test("evidence can be added without a title; settings save with an empty name", async ({ page }) => {
    await openCase(page, "ah-letter-in-progress", "/documents");
    await page.getByRole("button", { name: /^add evidence$/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Add evidence" }).click();
    await expect(page.getByText("Untitled evidence")).toBeVisible();

    await page.goto("/dashboard/settings");
    await page.getByLabel(/first name/i).fill("");
    await page.getByLabel(/^zip/i).fill("1");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Account updated", { exact: true })).toBeVisible();
  });

  test("the documents page and timeline never gate the questionnaire behind 'get organized'", async ({ page }) => {
    await openCase(page, "ah-get-organized", "/documents");
    await expect(page.getByRole("link", { name: /start questionnaire/i })).toBeVisible();
    await openCase(page, "ah-get-organized");
    await expect(page.getByRole("link", { name: "Start questionnaire →" })).toBeVisible();
  });

  test.describe("signed out", () => {
    test.use({ signedIn: false });
    test("signup works with an empty email", async ({ page }) => {
      await page.goto("/signup");
      await page.getByRole("button", { name: "Send account setup link" }).click();
      await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    });
  });
});
