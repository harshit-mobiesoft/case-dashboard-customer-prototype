import { demo, expect, openCase, statusBar, test } from "./fixtures";

test.describe("outcome", () => {
  test("settled while the window is open closes the case without a warning", async ({ page }) => {
    await openCase(page, "ah-waiting-window", "/outcome");
    await expect(page.getByText(/14 days remaining in the response window/)).toBeVisible();

    await page.getByRole("button", { name: /we already settled/i }).click();
    await expect(page.getByRole("button", { name: "Close my case" })).toBeDisabled();
    await page.getByText("Partial payment", { exact: true }).click();
    await page.getByRole("button", { name: "Close my case" }).click();

    await expect(page.getByRole("heading", { name: "Case closed" })).toBeVisible();
    await page.getByRole("link", { name: "Back to my cases" }).click();
    await expect(page.getByRole("heading", { name: /closed cases · 2/i })).toBeVisible();

    // Court filing was skipped for a settled case.
    await openCase(page, "ah-waiting-window");
    await expect(page.locator('[data-phase="3"]')).toContainText("Not needed");
    await expect(page.locator('[data-phase="3"]')).toContainText("settled before court filing");
  });

  test("proceeding early asks for confirmation; 'Wait' keeps the case as is", async ({ page }) => {
    await openCase(page, "sc-waiting-window", "/outcome");
    await page.getByRole("button", { name: /responded, but unsatisfactorily/i }).click();
    await page.getByRole("checkbox", { name: "Offer too low" }).check();
    await page.getByLabel(/amount received/i).fill("not money");
    await page.getByRole("button", { name: "Proceed to court filing" }).click();
    await expect(page.getByText(/enter an amount like/i)).toBeVisible();

    await page.getByLabel(/amount received/i).fill("$100");
    await page.getByRole("button", { name: "Proceed to court filing" }).click();
    const warn = page.getByRole("dialog", { name: /before the window closes/i });
    await expect(warn).toContainText("14 days remaining");
    await warn.getByRole("button", { name: "Wait" }).click();
    await expect(warn).toBeHidden();

    await page.getByRole("button", { name: "Proceed to court filing" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Proceed anyway" }).click();
    await expect(page).toHaveURL(/sc-waiting-window$/);
    await expect(statusBar(page)).toContainText("start your next court filing step");
  });

  test("once the window has closed there is no early warning", async ({ page }) => {
    await openCase(page, "ah-outcome-needed", "/outcome");
    await expect(page.getByText(/response window closed on/i)).toBeVisible();
    await page.getByRole("button", { name: /^no response/i }).click();
    await page.getByRole("button", { name: "Proceed to court filing" }).click();
    await expect(page).toHaveURL(/ah-outcome-needed$/);
  });

  test("the outcome page is locked until mailing", async ({ page }) => {
    await openCase(page, "sc-awaiting-signature", "/outcome");
    await expect(page.getByText("Not available yet")).toBeVisible();
  });
});

test.describe("court filing", () => {
  test("a rejected step shows our team's note and can be resubmitted", async ({ page }) => {
    const d = demo(page);
    await openCase(page, "sc-court-needs-changes");
    await expect(statusBar(page)).toContainText("a court filing step needs changes");
    await expect(page.getByText(/receipt number doesn't match/i)).toBeVisible();

    const form = page.getByRole("form", { name: "Pay the court filing fee" });
    await expect(form.getByLabel(/amount paid/i)).toHaveValue("75.00");
    await form.getByLabel(/receipt number/i).fill("");
    await form.getByRole("button", { name: "Resubmit for review" }).click();
    await expect(form.getByText(/receipt number is required/i)).toBeVisible();

    await form.getByLabel(/receipt number/i).fill("R-12345");
    await form.getByRole("button", { name: "Resubmit for review" }).click();
    await expect(statusBar(page)).toContainText("Our team is reviewing what you submitted");

    await d.click(/Approve the submitted step/);
    await expect(statusBar(page)).toContainText("continue your court filing steps");
    await expect(page.getByRole("form", { name: "Serve the defendant by certified mail" })).toBeVisible();
  });

  test("our team can send a submitted step back", async ({ page }) => {
    const d = demo(page);
    await openCase(page, "sc-court-in-review");
    await expect(statusBar(page)).toContainText("Our team is reviewing what you submitted");
    await d.click(/Reject the submitted step/);
    await expect(statusBar(page)).toContainText("a court filing step needs changes");
    await expect(page.getByRole("form", { name: "Serve the defendant by certified mail" })).toBeVisible();
  });

  test("all steps approved → close the case", async ({ page }) => {
    await openCase(page, "sc-court-ready-to-close");
    await expect(statusBar(page)).toContainText("close out your case");
    await page.getByRole("button", { name: "Close case" }).click();
    await expect(page.getByRole("region", { name: "Case closed" })).toBeVisible();
  });
});
