import { demo, expect, openCase, statusBar, test } from "./fixtures";

test("full journey: letter → sign → mail → wait → outcome → court filing → close", async ({ page }) => {
  const d = demo(page);
  await openCase(page, "sc-letter-in-progress");

  // 1. Our team prepares the letter.
  await expect(statusBar(page)).toContainText("Our team is preparing your demand letter");
  await expect(statusBar(page)).toHaveAttribute("data-bucket", "waiting_on_us");
  await d.click(/Draft the letter/);
  await expect(statusBar(page)).toContainText("Waiting on you — review and sign your letter");
  await expect(statusBar(page)).toHaveAttribute("data-bucket", "waiting_on_client");

  // 2. Review & sign — validation first, then a real signature.
  await statusBar(page).getByRole("link", { name: /review and sign/i }).click();
  await expect(page.getByRole("heading", { name: "Your demand letter", exact: true })).toBeVisible();
  await expect(page.getByText("Brightside Remodeling LLC").first()).toBeVisible();
  await page.getByRole("button", { name: "Sign now" }).click();

  const dialog = page.getByRole("dialog", { name: "Sign your demand letter" });
  // Pre-filled and pre-agreed; changing either still blocks signing.
  await expect(dialog.getByLabel(/full legal name/i)).toHaveValue("Alex Rivera");
  await expect(dialog.getByRole("checkbox")).toBeChecked();
  await dialog.getByLabel(/full legal name/i).fill("");
  await dialog.getByRole("checkbox").uncheck();
  await dialog.getByRole("button", { name: "Sign letter" }).click();
  await expect(dialog.getByRole("alert")).toHaveCount(2);
  await dialog.getByLabel(/full legal name/i).fill("Alex Riviera");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Sign letter" }).click();
  await expect(dialog).toContainText("Type your full legal name exactly");

  await dialog.getByLabel(/full legal name/i).fill("alex rivera");
  await dialog.getByRole("button", { name: "Sign letter" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Letter signed!" })).toBeVisible();
  await expect(page.getByText("Electronically signed on")).toBeVisible();

  // 3. Send it.
  await page.getByRole("link", { name: "Back to my case" }).click();
  await expect(statusBar(page)).toContainText("send your signed letter to the defendant");
  await page.getByRole("button", { name: "Send letter to defendant" }).click();
  await expect(statusBar(page)).toContainText("Letter mailed — waiting on the response window");
  await expect(page.getByRole("region", { name: "Response window" })).toContainText("21");
  await expect(page.getByText("Letter sent", { exact: true })).toBeVisible();

  // 4. The window runs out.
  await d.click(/Skip ahead 21 days/);
  await expect(statusBar(page)).toContainText("the response window has closed");
  await statusBar(page).getByRole("link", { name: "Mark outcome" }).click();

  // 5. No response → court filing.
  await page.getByRole("button", { name: /^no response/i }).click();
  await page.getByRole("button", { name: "Proceed to court filing" }).click();
  await expect(page).toHaveURL(/sc-letter-in-progress$/);
  await expect(statusBar(page)).toContainText("start your next court filing step");

  // 6. Five court steps, each approved by our team.
  const fill = {
    "File your Statement of Claim online": async () => {
      await page.getByLabel(/court confirmation number/i).fill("SC-2026-1");
      await page.getByRole("checkbox", { name: /i filed the statement of claim/i }).check();
    },
    "Pay the court filing fee": async () => {
      await page.getByLabel(/amount paid/i).fill("75");
      await page.getByLabel(/receipt number/i).fill("R-1");
    },
    "Serve the defendant by certified mail": async () => {
      await page.getByLabel(/tracking number/i).fill("9407 0000 1111");
      await page.getByLabel(/date mailed/i).fill("2026-10-12");
    },
    "Enter your court date": async () => {
      await page.getByLabel(/hearing date/i).fill("2026-11-20");
      await page.getByLabel(/hearing time/i).fill("09:30");
    },
    "Prepare for your hearing": async () => {
      await page.getByRole("checkbox", { name: /gathered my evidence/i }).check();
    },
  } as const;

  for (const title of Object.keys(fill) as (keyof typeof fill)[]) {
    const form = page.getByRole("form", { name: title });
    await expect(form).toBeVisible();
    await fill[title]();
    await form.getByRole("button", { name: /submit for review/i }).click();
    await expect(statusBar(page)).toContainText("Our team is reviewing what you submitted");
    await d.click(/Approve the submitted step/);
  }

  // 7. Close the case.
  await expect(statusBar(page)).toContainText("close out your case");
  await expect(page.getByRole("region", { name: "All tasks complete" })).toBeVisible();
  await page.getByRole("button", { name: "Close case" }).click();
  await expect(statusBar(page)).toContainText("Case closed");
  await expect(page.getByRole("region", { name: "Case closed" })).toBeVisible();

  // Documents are all there.
  await page.getByRole("link", { name: "View documents →" }).click();
  for (const name of ["Intake summary", "Signed demand letter", "First class mail", "Case summary"]) {
    await expect(page.getByRole("button", { name: `Download ${name}` })).toBeVisible();
  }
});
