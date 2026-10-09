import { expect, test } from "./fixtures";

test.describe("home page & sign-in", () => {
  test.use({ signedIn: false, strict: true });

  test("shows the sign-in form with the demo email pre-filled, then opens the dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveValue("alex.rivera@example.com");
    // Signed-out header carries the production tagline, not an account menu.
    await expect(page.getByRole("banner")).toContainText("Track & manage your claims for Activation Hero & Small Claims Hero");
    await expect(page.getByRole("button", { name: /account menu/i })).toHaveCount(0);

    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1, name: "My cases" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "My Claims" })).toBeVisible();

    // The session survives a reload.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "My cases" })).toBeVisible();
  });

  test("an unknown email is refused with the production wording and stays on the page", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill("someone@else.com");
    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "No account found" })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  });

  test("the email is editable (and case-insensitive)", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill("  ALEX.RIVERA@EXAMPLE.COM ");
    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("dashboard pages need a session and bring you back to where you were headed", async ({ page }) => {
    await page.goto("/dashboard/cases/sc-awaiting-signature/review");
    await expect(page).toHaveURL(/\/\?next=%2Fdashboard%2Fcases%2Fsc-awaiting-signature%2Freview$/);
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();

    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard\/cases\/sc-awaiting-signature\/review$/);
    await expect(page.getByRole("heading", { name: "Your demand letter", exact: true })).toBeVisible();
  });

  test("never redirects to another site after sign-in", async ({ page }) => {
    for (const next of ["//evil.example", "https://evil.example", "/\\evil.example"]) {
      await page.goto(`/?next=${encodeURIComponent(next)}`);
      await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
      await expect(page).toHaveURL(/localhost:\d+\/dashboard$/);
      await page.evaluate(() => window.localStorage.removeItem("cdcp:session:v1"));
    }
  });

  test("signing out returns to the home page and re-protects the dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await page.getByRole("button", { name: /account menu for alex rivera/i }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/\?next=%2Fdashboard$/);
  });

  test("no 'already signed in' banner — the sign-in card is all there is", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("You're already signed in.")).toHaveCount(0);
  });

  test("the home page is just the header and the sign-in card — no marketing sections or footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Complete Path to Getting Paid" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "FAQ" })).toHaveCount(0);
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Legal" })).toHaveCount(0);

    await page.locator('a[href="/activationhero"]').first().click();
    await expect(page).toHaveURL(/\/activationhero$/);
    await expect(page.getByRole("banner")).toContainText("Activation Hero | Case Dashboard");
  });

  test("there is no footer on any page; legal pages are still reachable directly and from checkout", async ({ page }) => {
    for (const url of ["/", "/signup", "/dashboard", "/smallclaimshero?new=1", "/terms"]) {
      await page.goto(url);
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Legal" })).toHaveCount(0);
    }
    for (const [path, title] of [
      ["/terms", "Terms of Service"],
      ["/privacy", "Privacy Policy"],
      ["/delivery", /Delivery/],
      ["/refunds", /Refund/],
      ["/support", "Customer Support"],
      ["/legal-disclaimer", /Disclaimer/],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    }
  });
});

test.describe("home page — default (non-blocking) mode", () => {
  test.use({ signedIn: false });

  test("any email — even an empty one — opens the demo dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill("someone@else.com");
    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.evaluate(() => window.localStorage.removeItem("cdcp:session:v1"));
    await page.goto("/");
    await page.getByLabel("Email address").fill("");
    await page.getByRole("button", { name: "Sign in to my dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
