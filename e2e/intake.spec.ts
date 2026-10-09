import type { Page } from "@playwright/test";
import { SESSION_KEY, demo, expect, statusBar, test } from "./fixtures";

const heading = (page: Page, name: string | RegExp) => page.getByRole("heading", { level: 1, name });

async function fillClaim(page: Page, opts: { category: string; mailing: "First class mail" | "Certified mail"; ah?: boolean }) {
  await heading(page, "Your claim").waitFor();
  await page.getByRole(opts.ah ? "checkbox" : "radio", { name: new RegExp(opts.category) }).click();
  await page.getByLabel(opts.ah ? /date of deactivation/i : /date of incident/i).fill("2026-08-01");
  await page.getByLabel(opts.ah ? /estimated lost earnings/i : /amount claimed/i).fill("1850");
  await page.getByLabel(opts.ah ? "Describe your deactivation" : "Describe your claim", { exact: true }).fill("They kept my deposit and did no work.");
  await page.getByRole("radio", { name: /No, not right now/ }).click();
  await page.getByRole("radio", { name: new RegExp(opts.mailing) }).click();
  await page.getByRole("button", { name: "Review my claim" }).click();
}

async function pay(page: Page, card: "ok" | "declined" = "ok") {
  await heading(page, "Payment").waitFor();
  await page.getByRole("button", { name: card === "ok" ? "4242 4242 4242 4242" : "4000 0000 0000 0002" }).click();
  await page.getByLabel("Expiry").fill("1230");
  await page.getByLabel("CVC").fill("123");
  await page.getByRole("checkbox", { name: /I agree to the/ }).check();
}

async function smallClaimsThroughDefendant(page: Page) {
  await page.goto("/smallclaimshero?new=1&validate=1");
  await heading(page, "Your information").waitFor();
  await page.getByRole("button", { name: "Continue" }).click();
  await heading(page, "Defendant information").waitFor();
  await page.getByRole("combobox", { name: /legal name of the business/i }).fill("brightside");
  await page.getByRole("option", { name: /Brightside Remodeling/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await heading(page, "Filing court").waitFor();
  await page.getByRole("radio", { name: /Same county for both addresses/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("intake — default mode: autofilled and non-blocking", () => {
  test("Small Claims: just keep pressing Continue — every field is already filled in", async ({ page }) => {
    await page.goto("/smallclaimshero?new=1");
    await expect(page.getByLabel("Full legal name")).toHaveValue("Alex Rivera");
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Defendant information").waitFor();
    await expect(page.getByText("Address on file")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Filing court").waitFor();
    await expect(page.getByText("Selected: Sacramento County, CA")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Your claim").waitFor();
    await expect(page.getByLabel(/amount claimed/i)).toHaveValue("1850");
    await page.getByRole("button", { name: "Review my claim" }).click();

    await heading(page, "Review your claim").waitFor();
    await page.getByRole("button", { name: /continue to payment/i }).click();
    await heading(page, "Upgrade to certified mail?").waitFor();
    await page.getByRole("button", { name: "Add certified mail" }).click();

    await heading(page, "Payment").waitFor();
    await expect(page.getByLabel("Card number")).toHaveValue("4242 4242 4242 4242");
    await page.getByRole("button", { name: /pay \$89\.00/i }).click();
    await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
    await page.getByRole("link", { name: "Go to my case" }).click();
    await expect(page).toHaveURL(/case-sc-20932$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("vs. Brightside Remodeling LLC");
  });

  test("Activation Hero: autofilled, no filing-court step, pay and land on the case", async ({ page }) => {
    await page.goto("/activationhero?new=1");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("combobox", { name: "Platform" })).toHaveValue("Uber Technologies, Inc.");
    await page.getByRole("button", { name: "Continue" }).click();
    await heading(page, "Your claim").waitFor();
    await page.getByRole("button", { name: "Review my claim" }).click();
    await heading(page, "Review your claim").waitFor();
    await page.getByRole("button", { name: /continue to payment/i }).click();
    await heading(page, "Payment").waitFor();
    await page.getByRole("button", { name: /pay \$89\.00/i }).click();
    await page.getByRole("link", { name: "Go to my case" }).click();
    await expect(page).toHaveURL(/case-ah-30418$/);
  });

  test("nothing blocks: a cleared field still lets you continue", async ({ page }) => {
    await page.goto("/smallclaimshero?new=1");
    await page.getByLabel("Full legal name").fill("");
    await page.getByRole("button", { name: "Continue" }).click();
    await heading(page, "Defendant information").waitFor();
    await expect(page.getByText("Full legal name is required.")).toHaveCount(0);
  });
});

test.describe("intake — Small Claims Hero (signed in)", () => {
  test("full flow with first class: upgrade offer → pay → case on the dashboard", async ({ page }) => {
    await smallClaimsThroughDefendant(page);
    await fillClaim(page, { category: "Broken contract", mailing: "First class mail" });

    await heading(page, "Review your claim").waitFor();
    await expect(page.getByRole("region", { name: "Order preview" })).toContainText("$69.00");
    await page.getByRole("button", { name: /continue to payment/i }).click();

    await heading(page, "Upgrade to certified mail?").waitFor();
    await page.getByRole("button", { name: "Keep first class" }).click();

    await pay(page);
    await page.getByRole("button", { name: /pay \$69\.00/i }).click();
    await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
    await expect(page.getByText("#SC-20932")).toBeVisible();

    await page.getByRole("link", { name: "Go to my case" }).click();
    await expect(page).toHaveURL(/case-sc-20932$/);
    await expect(heading(page, "vs. Brightside Remodeling LLC")).toBeVisible();
    await expect(statusBar(page)).toContainText("Our team is preparing your demand letter");
    await expect(page.getByText("Case created")).toBeVisible();

    await page.getByRole("link", { name: "My cases", exact: true }).first().click();
    await expect(page.getByRole("link", { name: /open case against brightside remodeling llc/i }).first()).toContainText("Pending Review");
  });

  test("certified mail skips the upgrade offer; a coupon lowers the total", async ({ page }) => {
    await smallClaimsThroughDefendant(page);
    await fillClaim(page, { category: "Money owed", mailing: "Certified mail" });
    await heading(page, "Review your claim").waitFor();
    await expect(page.getByRole("region", { name: "Order preview" })).toContainText("$89.00");
    await page.getByRole("button", { name: /continue to payment/i }).click();

    await pay(page);
    await page.getByLabel("Coupon code").fill("bogus");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("That coupon code isn't valid.")).toBeVisible();
    await page.getByLabel("Coupon code").fill("hero10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/HERO10 applied/)).toBeVisible();
    await page.getByRole("button", { name: /pay \$80\.10/i }).click();
    await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  });

  test("a declined card shows an error, creates nothing, and the test card then succeeds", async ({ page }) => {
    await smallClaimsThroughDefendant(page);
    await fillClaim(page, { category: "Other", mailing: "Certified mail" });
    await page.getByRole("button", { name: /continue to payment/i }).click();

    await pay(page, "declined");
    await page.getByRole("button", { name: /pay \$89\.00/i }).click();
    await expect(page.getByText(/card was declined/i)).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /open cases · 8/i })).toBeVisible();
  });

  test("validation: every step blocks until fixed and explains why", async ({ page }) => {
    await page.goto("/smallclaimshero?new=1&validate=1");
    await page.getByLabel("Full legal name").fill("");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Full legal name is required.")).toBeVisible();
    await expect(page.getByText("Some required fields need your attention.")).toBeVisible();
    await page.getByLabel("Full legal name").fill("Alex Rivera");
    await expect(page.getByText("Full legal name is required.")).toHaveCount(0);
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Defendant information").waitFor();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Business legal name is required.")).toBeVisible();
    await page.getByRole("radio", { name: /Individual/ }).click();
    await expect(page.getByText("Business legal name is required.")).toHaveCount(0);
    await page.getByLabel(/full legal name of the person/i).fill("John Smith");
    await page.getByLabel("Street address").fill("5 Elm St");
    await page.getByLabel("City").fill("Reno");
    await page.getByLabel("State").selectOption("NV");
    await page.getByLabel("ZIP code").fill("89501");
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Filing court").waitFor();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Please select a filing county before continuing.")).toBeVisible();
    // Search another courthouse.
    await page.getByRole("textbox", { name: /search by county/i }).fill("clark");
    await page.getByRole("button", { name: "Clark County, NV" }).click();
    await expect(page.getByText("Selected: Clark County, NV")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Your claim").waitFor();
    await page.getByRole("button", { name: "Review my claim" }).click();
    for (const msg of ["Please select a claim category.", "Date of incident is required.", "Claim amount is required.", "Claim description is required.", "Please select whether you have evidence to upload.", "Please select a mailing method."]) {
      await expect(page.getByText(msg)).toBeVisible();
    }
    await page.getByLabel(/amount claimed/i).fill("30000");
    await page.getByRole("button", { name: "Review my claim" }).click();
    await expect(page.getByText(/exceeds the maximum for small claims/)).toBeVisible();

    const words = Array.from({ length: 101 }, (_, i) => `word${i}`).join(" ");
    await page.getByLabel("Describe your claim", { exact: true }).fill(words);
    await expect(page.getByText("101 / 100 words")).toBeVisible();
    await expect(page.getByText(/1 word over the limit/)).toBeVisible();
  });

  test("the review step edits earlier answers, and the stepper walks back through completed steps", async ({ page }) => {
    await smallClaimsThroughDefendant(page);
    await fillClaim(page, { category: "Property damage", mailing: "Certified mail" });
    await heading(page, "Review your claim").waitFor();

    await page.getByRole("button", { name: "Edit Your information" }).click();
    await heading(page, "Your information").waitFor();
    await page.getByLabel("Full legal name").fill("Alexandra Rivera");
    await page.getByRole("button", { name: "Continue" }).click();
    await heading(page, "Defendant information").waitFor();

    const nav = page.getByRole("navigation", { name: "Application progress" });
    // Steps ahead of the current one aren't clickable.
    await expect(nav.getByRole("button", { name: /Your claim/ })).toBeDisabled();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Review my claim" }).click();
    await expect(page.getByText("Alexandra Rivera")).toBeVisible();

    await nav.getByRole("button", { name: /Defendant information/ }).click();
    await heading(page, "Defendant information").waitFor();
  });

  test("a failed save offers Retry, and works after retrying", async ({ page }) => {
    const d = demo(page);
    await page.goto("/smallclaimshero?new=1&validate=1");
    await heading(page, "Your information").waitFor();
    await d.click(/Show an error on the next action/);
    await page.getByRole("button", { name: "Continue" }).click();
    const alert = page.getByRole("alert").filter({ hasText: /something went wrong/i });
    await expect(alert).toBeVisible();
    await alert.getByRole("button", { name: "Retry" }).click();
    await heading(page, "Defendant information").waitFor();
  });

  test("progress is saved: the draft shows on the dashboard and Resume restores answers", async ({ page }) => {
    await page.goto("/smallclaimshero?new=1&validate=1");
    await heading(page, "Your information").waitFor();
    await page.getByLabel("Full legal name").fill("Alexandra Resumed");
    await page.getByRole("button", { name: "Continue" }).click();
    await heading(page, "Defendant information").waitFor();

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /draft cases · 3/i })).toBeVisible();
    await page.getByRole("link", { name: "Resume" }).first().click();
    await heading(page, "Defendant information").waitFor();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Full legal name")).toHaveValue("Alexandra Resumed");
  });
});

test.describe("intake — Activation Hero (signed in)", () => {
  test("detects the county (no Filing court step), multi-select categories, then lands on 'get organized'", async ({ page }) => {
    await page.goto("/activationhero?new=1&validate=1");
    await expect(page.getByRole("banner")).toContainText("Activation Hero | Case Dashboard");
    await expect(page.getByRole("navigation", { name: "Application progress" }).getByRole("listitem")).toHaveCount(5);
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Which platform deactivated you?").waitFor();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Please select the platform that deactivated you.")).toBeVisible();
    await page.getByRole("combobox", { name: "Platform" }).fill("uber");
    await page.getByRole("option", { name: /^Uber Technologies, Inc\.$/ }).click();
    await page.getByRole("checkbox", { name: /same as my contact information/i }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Your claim").waitFor();
    await page.getByRole("checkbox", { name: /Retaliation/ }).click();
    await page.getByRole("checkbox", { name: /No reason given/ }).click();
    await page.getByLabel(/date of deactivation/i).fill("2026-08-01");
    await page.getByLabel(/estimated lost earnings/i).fill("4000");
    await page.getByLabel("Describe your deactivation", { exact: true }).fill("Deactivated after I reported an unsafe passenger.");
    await page.getByRole("radio", { name: /No, not right now/ }).click();
    await page.getByRole("radio", { name: /Certified mail/ }).click();
    await page.getByRole("button", { name: "Review my claim" }).click();

    await heading(page, "Review your claim").waitFor();
    await expect(page.getByText("Uber Technologies, Inc.")).toBeVisible();
    await expect(page.getByText("Retaliation, No reason given")).toBeVisible();
    await expect(page.getByText("Sacramento County, CA")).toBeVisible();
    await page.getByRole("button", { name: /continue to payment/i }).click();

    await pay(page);
    await page.getByRole("button", { name: /pay \$89\.00/i }).click();
    await page.getByRole("link", { name: "Go to my case" }).click();
    await expect(page).toHaveURL(/case-ah-30418$/);
    // They said "no evidence", so they count as organized and the questionnaire is next.
    await expect(statusBar(page)).toContainText("complete your questionnaire");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Uber");
  });

  test("an unrecognised ZIP falls back to searching for the county", async ({ page }) => {
    await page.goto("/activationhero?new=1&validate=1");
    await page.getByLabel("State").selectOption("MT");
    await page.getByLabel("ZIP code").fill("59001");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("combobox", { name: "Platform" }).fill("lyft");
    await page.getByRole("option", { name: /Lyft/ }).click();
    await page.getByLabel("Account email").fill("alex.rivera@example.com");
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Help us locate your county courthouse").waitFor();
    await expect(page.getByText(/couldn't automatically detect your courthouse/i)).toBeVisible();
    const search = page.getByRole("textbox", { name: /search by county/i });
    await search.fill("");
    await search.fill("sacra");
    await page.getByRole("button", { name: "Sacramento County, CA" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await heading(page, "Your claim").waitFor();
  });

  test("the dashboard's AH draft resumes at Review and can be paid", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Resume" }).last().click();
    await heading(page, "Review your claim").waitFor();
    await expect(page.getByText("DoorDash, Inc.")).toBeVisible();
    await page.getByRole("button", { name: /continue to payment/i }).click();
    await pay(page);
    await page.getByRole("button", { name: /pay \$89\.00/i }).click();
    await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  });
});

test.describe("intake — signed out", () => {
  test.use({ signedIn: false });

  test("default mode is autofilled even without an account", async ({ page }) => {
    await page.goto("/smallclaimshero?new=1");
    await expect(page.getByLabel("Full legal name")).toHaveValue("Alex Rivera");
  });

  test("starts blank, then after paying sets up an account and lands on the new case", async ({ page }) => {
    await page.goto("/smallclaimshero?validate=1");
    await heading(page, "Your information").waitFor();
    await expect(page.getByLabel("Full legal name")).toHaveValue("");

    await page.getByLabel("Full legal name").fill("Jane Smith");
    await page.getByLabel(/best email/i).fill("jane@gmial.com");
    await page.getByLabel(/best phone/i).fill("(555) 555-0100");
    await page.getByLabel("Street address").fill("123 Main St");
    await page.getByLabel("City").fill("Sacramento");
    await page.getByLabel("State").selectOption("CA");
    await page.getByLabel("ZIP code").fill("95814");
    await page.getByLabel("City").click(); // blur the email
    await page.getByLabel(/best email/i).click();
    await page.getByLabel(/best phone/i).click();
    await expect(page.getByText("jane@gmail.com")).toBeVisible();
    await page.getByRole("button", { name: "Yes, use it" }).click();
    await expect(page.getByLabel(/best email/i)).toHaveValue("jane@gmail.com");
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Defendant information").waitFor();
    await page.getByRole("radio", { name: /Individual/ }).click();
    await page.getByLabel(/full legal name of the person/i).fill("John Smith");
    await page.getByLabel("Street address").fill("5 Elm St");
    await page.getByLabel("City").fill("Sacramento");
    await page.getByLabel("State").selectOption("CA");
    await page.getByLabel("ZIP code").fill("95820");
    await page.getByRole("button", { name: "Continue" }).click();

    await heading(page, "Filing court").waitFor();
    await page.getByRole("radio", { name: /Same county for both addresses/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await fillClaim(page, { category: "Consumer dispute", mailing: "Certified mail" });
    await page.getByRole("button", { name: /continue to payment/i }).click();
    await pay(page);
    await page.getByRole("button", { name: /pay \$89\.00/i }).click();

    await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
    await page.getByRole("link", { name: "Set up my account" }).click();
    await expect(page).toHaveURL(/\/signup\?email=jane%40gmail\.com&paid=1/);
    await expect(page.getByText("Payment confirmed")).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveValue("jane@gmail.com");
    await expect(page.getByLabel("Email address")).toHaveJSProperty("readOnly", true);

    await page.getByRole("button", { name: "Send account setup link" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await page.getByRole("button", { name: "Open my magic link" }).click();
    await expect(page).toHaveURL(/case-sc-20932$/);
    await expect(statusBar(page)).toContainText("Our team is preparing your demand letter");
    expect(await page.evaluate((k) => window.localStorage.getItem(k), SESSION_KEY)).toBe("1");
  });

  test("the signup page validates and links back to sign-in", async ({ page }) => {
    await page.goto("/signup?validate=1");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Send account setup link" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Enter a valid email address." })).toBeVisible();
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
