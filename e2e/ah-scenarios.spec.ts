import { demo, expect, openCase, statusBar, test } from "./fixtures";

// Every Activation Hero stage on the dashboard, opened straight from the seed.
const STAGES: { id: string; defendant: RegExp; bar: RegExp; cta?: string; badge: string; phase3?: "Locked" | "Active" | "Complete" | "Not needed" }[] = [
  { id: "ah-get-organized", defendant: /RideNow/, bar: /get organized/i, cta: "Get organized", badge: "Pending" },
  { id: "ah-questionnaire-ready", defendant: /Lyft/, bar: /complete your questionnaire/i, cta: "Start questionnaire", badge: "Pending" },
  { id: "ah-evidence-nudge", defendant: /Instacart|Maplebear/, bar: /upload your evidence/i, cta: "Upload evidence", badge: "Pending Review" },
  { id: "ah-letter-in-progress", defendant: /Grubhub/, bar: /preparing your demand letter/i, badge: "Pending Review" },
  { id: "ah-revision-requested", defendant: /Shipt/, bar: /reviewing your letter/i, badge: "Needs Revision" },
  { id: "ah-awaiting-signature", defendant: /DoorDash/, bar: /review and sign your letter/i, cta: "Review and sign", badge: "Awaiting Signature" },
  { id: "ah-ready-to-send", defendant: /TaskRabbit/, bar: /send your signed letter/i, badge: "Signed" },
  { id: "ah-waiting-window", defendant: /Amazon/, bar: /waiting on the response window/i, badge: "Mailed" },
  { id: "ah-window-urgent", defendant: /Uber Eats/, bar: /waiting on the response window/i, badge: "Mailed" },
  { id: "ah-outcome-needed", defendant: /DashGo/, bar: /response window has closed/i, cta: "Mark outcome", badge: "Mailed" },
  { id: "ah-court-just-started", defendant: /Uber Technologies/, bar: /start your next court filing step/i, badge: "Court Filing", phase3: "Active" },
  { id: "ah-court-needs-changes", defendant: /Lyft/, bar: /needs changes/i, badge: "Court Filing", phase3: "Active" },
  { id: "ah-court-in-review", defendant: /Grubhub/, bar: /reviewing what you submitted/i, badge: "Court Filing", phase3: "Active" },
  { id: "ah-court-ready-to-close", defendant: /Maplebear|Instacart/, bar: /close out your case/i, badge: "Court Filing", phase3: "Complete" },
  { id: "ah-closed-settled", defendant: /Shipt/, bar: /case closed/i, badge: "Closed", phase3: "Not needed" },
  { id: "ah-closed-court", defendant: /DoorDash/, bar: /case closed/i, badge: "Closed", phase3: "Complete" },
];

test.describe("Activation Hero scenarios", () => {
  for (const s of STAGES) {
    test(`${s.id}: shows the right bar${s.cta ? " and CTA" : ""}`, async ({ page }) => {
      await openCase(page, s.id);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(s.defendant);
      await expect(statusBar(page)).toContainText(s.bar);
      if (s.cta) await expect(statusBar(page).getByRole("link", { name: new RegExp(s.cta) })).toBeVisible();
      if (s.phase3) await expect(page.locator('[data-phase="3"]')).toContainText(s.phase3);
    });
  }

  test("the dashboard stays short (AH + Small Claims mix); every AH stage is one click away in the demo panel", async ({ page }) => {
    const d = demo(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /open case against/i })).toHaveCount(9);

    await d.open();
    for (const s of STAGES) {
      await expect(d.panel.locator(`a[href="/dashboard/cases/${s.id}"]`)).toHaveCount(1);
    }
    await d.panel.getByRole("link", { name: "Mark the outcome" }).click();
    await expect(page).toHaveURL(/ah-outcome-needed$/);
  });

  test("walk one case through every AH step: questionnaire → letter → sign → mail → outcome → court", async ({ page }) => {
    const d = demo(page);
    await openCase(page, "ah-questionnaire-ready");
    await statusBar(page).getByRole("link", { name: /start questionnaire/i }).click();
    await page.getByRole("group", { name: /passenger\/customer claim/i }).getByText("Yes", { exact: true }).click();
    await page.getByRole("button", { name: "Submit answers" }).click();
    await expect(statusBar(page)).toContainText("preparing your demand letter");
    await expect(page.getByText("Wrongful Deactivation").first()).toBeVisible();

    await d.click(/Draft the letter/);
    await statusBar(page).getByRole("link", { name: /review and sign/i }).click();
    await page.getByRole("button", { name: "Sign now" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Sign letter" }).click();
    await page.getByRole("link", { name: "Back to my case" }).click();

    await page.getByRole("button", { name: "Send letter to defendant" }).click();
    await expect(statusBar(page)).toContainText("Letter mailed");
    await d.click(/Skip ahead 21 days/);
    await statusBar(page).getByRole("link", { name: "Mark outcome" }).click();
    await page.getByRole("button", { name: /^no response/i }).click();
    await page.getByRole("button", { name: "Proceed to court filing" }).click();
    await expect(statusBar(page)).toContainText("start your next court filing step");
    await expect(page.getByRole("form", { name: "File your Statement of Claim online" })).toBeVisible();
  });

  test("evidence nudge clears after attaching a file to a logged item", async ({ page }) => {
    await openCase(page, "ah-evidence-nudge", "/documents");
    await page.getByRole("button", { name: "Edit Deactivation email" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit evidence" });
    await dialog.locator("#evidence-files").setInputFiles({ name: "email.png", mimeType: "image/png", buffer: Buffer.from("x") });
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("email.png")).toBeVisible();
    await openCase(page, "ah-evidence-nudge");
    await expect(statusBar(page)).toContainText("preparing your demand letter");
  });

  test("the 'Prototype shortcut' bar appears only when the case is waiting on our team or the calendar", async ({ page }) => {
    const bar = page.getByRole("region", { name: "Prototype shortcut" });
    for (const [id, button] of [
      ["ah-letter-in-progress", /Draft the letter/],
      ["ah-revision-requested", /Apply the requested changes/],
      ["ah-court-in-review", /Approve the submitted step/],
      ["ah-waiting-window", /Skip ahead 21 days/],
      ["ah-window-urgent", /Skip ahead 21 days/],
    ] as const) {
      await openCase(page, id);
      await expect(bar).toBeVisible();
      await expect(bar.getByRole("button", { name: button })).toBeVisible();
    }
    for (const id of ["ah-awaiting-signature", "ah-ready-to-send", "ah-outcome-needed", "ah-court-needs-changes", "ah-court-ready-to-close", "ah-closed-court", "ah-get-organized"]) {
      await openCase(page, id);
      await expect(statusBar(page)).toBeVisible();
      await expect(bar).toHaveCount(0);
    }
  });

  test("a viewer can walk the whole journey without ever opening Demo controls", async ({ page }) => {
    const bar = page.getByRole("region", { name: "Prototype shortcut" });
    await openCase(page, "ah-letter-in-progress");
    await bar.getByRole("button", { name: /Draft the letter/ }).click();           // team step
    await statusBar(page).getByRole("link", { name: /review and sign/i }).click();  // customer step
    await page.getByRole("button", { name: "Sign now" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Sign letter" }).click();
    await page.getByRole("link", { name: "Back to my case" }).click();
    await page.getByRole("button", { name: "Send letter to defendant" }).click();
    await bar.getByRole("button", { name: /Skip ahead 21 days/ }).click();         // calendar step
    await statusBar(page).getByRole("link", { name: "Mark outcome" }).click();
    await page.getByRole("button", { name: /^no response/i }).click();
    await page.getByRole("button", { name: "Proceed to court filing" }).click();
    const form = page.getByRole("form", { name: "File your Statement of Claim online" });
    await form.getByLabel(/court confirmation number/i).fill("SC-1");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: /submit for review/i }).click();
    await bar.getByRole("button", { name: /Approve the submitted step/ }).click(); // team step again
    await expect(page.getByRole("form", { name: "Pay the court filing fee" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Demo controls" })).toBeVisible();
  });
});
