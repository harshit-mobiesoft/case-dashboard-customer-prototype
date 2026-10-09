import { demo, expect, openCase, statusBar, test } from "./fixtures";

async function requestEdit(page: import("@playwright/test").Page, reasons: string[], details: string) {
  const form = page.getByRole("form", { name: "Request an edit" });
  const submit = form.getByRole("button", { name: "Submit edit request" });
  await expect(submit).toBeDisabled();
  for (const reason of reasons) await form.getByRole("button", { name: reason, exact: true }).click();
  await expect(submit).toBeDisabled(); // reason alone isn't enough
  await form.getByLabel(/tell us more/i).fill(details);
  await expect(submit).toBeEnabled();
  await submit.click();
}

test("request an edit → team revises → sign the new version", async ({ page }) => {
  const d = demo(page);
  await openCase(page, "sc-awaiting-signature", "/review");

  await page.getByRole("button", { name: "Request an edit" }).click();
  const form = page.getByRole("form", { name: "Request an edit" });
  await form.getByLabel(/tell us more/i).fill("short");
  await expect(form.getByText("5 / 10 min characters")).toBeVisible();
  await form.getByLabel(/tell us more/i).fill("");
  await requestEdit(page, ["Wrong amount", "Incorrect dates"], "It should be $2,450 and the date is July 26");

  await expect(page.getByRole("heading", { name: "Edit request submitted" })).toBeVisible();
  await page.getByRole("link", { name: "Back to my case" }).click();

  await expect(statusBar(page)).toContainText("Our team is reviewing your letter");
  const requested = page.getByRole("region", { name: "Your requested changes" });
  await expect(requested).toContainText("Wrong amount");
  await expect(requested).toContainText("It should be $2,450");

  await d.click(/Apply the requested changes/);
  await expect(statusBar(page)).toContainText("review and sign your letter");

  await page.getByRole("link", { name: "Review and sign" }).click();
  await expect(page.getByText("Revision 1 applied")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Version history" })).toBeVisible();
  await expect(page.getByText("Version 2 — Revised based on your feedback")).toBeVisible();

  await page.getByRole("button", { name: "Sign now" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/full legal name/i).fill("Alex Rivera");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Sign letter" }).click();
  await expect(page.getByRole("heading", { name: "Letter signed!" })).toBeVisible();
});

test("'Need changes?' on a signed letter opens the form and clears the signature", async ({ page }) => {
  await openCase(page, "sc-ready-to-send");
  await page.getByRole("link", { name: "Need changes? Request an edit" }).click();
  await expect(page).toHaveURL(/review\?edit=1$/);
  await expect(page.getByRole("form", { name: "Request an edit" })).toBeVisible();
  await requestEdit(page, ["Other"], "Add my apartment number please");

  await page.getByRole("link", { name: "Back to my case" }).click();
  await expect(statusBar(page)).toContainText("Our team is reviewing your letter");
  await expect(page.getByRole("button", { name: /send letter/i })).toHaveCount(0);
});

test("the review page explains itself when no letter exists yet, and is read-only after mailing", async ({ page }) => {
  await openCase(page, "sc-letter-in-progress", "/review");
  await expect(page.getByText("Your letter isn't ready yet")).toBeVisible();

  await openCase(page, "sc-waiting-window", "/review");
  await expect(page.getByRole("heading", { name: "Letter sent to defendant" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign now" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Request an edit" })).toHaveCount(0);
});
