import { expect, openCase, test } from "./fixtures";

// These specs exercise validation, so they run in strict mode (the app default never blocks).
test.use({ strict: true });

test("Dropbox + evidence: connect, add with a file, edit, delete, suggestions, no-evidence rule", async ({ page }) => {
  await openCase(page, "sc-letter-in-progress", "/documents");

  // Files need Dropbox.
  await expect(page.getByText("Not connected")).toBeVisible();
  await page.getByRole("button", { name: /^add evidence$/i }).click();
  await expect(page.getByLabel("Choose files")).toBeDisabled();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Connect Dropbox" }).click();
  await expect(page.getByText("Connected", { exact: true })).toBeVisible();
  await expect(page.getByText("alex.rivera@dropbox.example")).toBeVisible();

  // Add (title required), with a file.
  await page.getByRole("button", { name: /^add evidence$/i }).click();
  const dialog = page.getByRole("dialog", { name: "Add evidence" });
  await dialog.getByRole("button", { name: "Add evidence" }).click();
  await expect(dialog.getByText("Give this evidence a short title.")).toBeVisible();
  await dialog.getByLabel(/^title/i).fill("Signed contract");
  await dialog.getByLabel("Type").selectOption("contract");
  await dialog.locator("#evidence-files").setInputFiles({ name: "contract.pdf", mimeType: "application/pdf", buffer: Buffer.from("x".repeat(2048)) });
  await expect(dialog.getByText(/contract\.pdf/)).toBeVisible();
  await dialog.getByRole("button", { name: "Add evidence" }).click();

  const item = page.getByRole("list", { name: "Evidence items" }).getByRole("listitem").filter({ hasText: "Signed contract" });
  await expect(item).toContainText("Contract / agreement");
  await expect(item).toContainText("contract.pdf");
  await expect(page.getByRole("heading", { name: /your evidence · 1/i })).toBeVisible();

  // Can't claim "no evidence" now.
  await expect(page.getByRole("checkbox", { name: /don't have any evidence/i })).toBeDisabled();

  // Edit.
  await page.getByRole("button", { name: "Edit Signed contract" }).click();
  const edit = page.getByRole("dialog", { name: "Edit evidence" });
  await edit.getByLabel(/^title/i).fill("Signed contract (final)");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Signed contract (final)")).toBeVisible();

  // A suggestion prefills the form.
  await page.getByRole("button", { name: "Repair estimate or invoice" }).or(page.getByRole("button", { name: /Proof of payment/ })).first().click();
  await expect(page.getByRole("dialog", { name: "Add evidence" }).getByLabel(/^title/i)).not.toHaveValue("");
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  // Delete (confirm).
  await page.getByRole("button", { name: "Delete Signed contract (final)" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Nothing logged yet.")).toBeVisible();

  // Disconnect.
  await page.getByRole("button", { name: "Disconnect" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByText("Not connected")).toBeVisible();
});

test("evidence nudge appears once Dropbox is connected but no file is attached", async ({ page }) => {
  await openCase(page, "sc-letter-in-progress", "/documents");
  await page.getByRole("button", { name: /^add evidence$/i }).click();
  await page.getByRole("dialog").getByLabel(/^title/i).fill("Texts");
  await page.getByRole("dialog").getByRole("button", { name: "Add evidence" }).click();
  await page.getByRole("button", { name: "Connect Dropbox" }).click();

  await openCase(page, "sc-letter-in-progress");
  await expect(page.getByRole("region", { name: "Case status" })).toContainText("Upload your evidence while we work on your case");
});

test("downloads a generated document", async ({ page }) => {
  await openCase(page, "sc-ready-to-send", "/documents");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download Signed demand letter" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("SC-20655-signed-demand-letter.txt");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  expect(text).toContain("Delgado Landscaping");
  expect(text).toContain("Alex Rivera");
});
