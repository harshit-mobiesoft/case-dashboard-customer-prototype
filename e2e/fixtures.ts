import { expect, test as base, type Page } from "@playwright/test";

/**
 * Every test fails if the app logs a console error or throws — a quiet way to catch
 * hydration mismatches, React key warnings and unhandled rejections.
 */
export const SESSION_KEY = "cdcp:session:v1";

export const test = base.extend<{ consoleErrors: string[]; signedIn: boolean; strict: boolean }>({
  // Default: nothing blocks. Specs that exercise validation opt in with test.use({ strict: true }).
  strict: [false, { option: true }],
  // Most specs exercise the signed-in dashboard; auth specs opt out with test.use({ signedIn: false }).
  signedIn: [true, { option: true }],
  context: async ({ context, signedIn, strict }, use) => {
    if (strict) await context.addInitScript(() => window.sessionStorage.setItem("cdcp:strict", "1"));
    if (signedIn) await context.addInitScript((key) => window.localStorage.setItem(key, "1"), SESSION_KEY);
    await use(context);
  },
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(err.message));
      await use(errors);
      expect(errors, "console / page errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const caseUrl = (id: string, sub = "") => `/dashboard/cases/${id}${sub}`;

export async function openCase(page: Page, id: string, sub = "") {
  await page.goto(caseUrl(id, sub));
}

/** Presenter tools (the floating "Demo controls" panel). */
export function demo(page: Page) {
  const panel = page.getByRole("region", { name: "Demo controls" });
  return {
    panel,
    async open() {
      if (!(await panel.isVisible())) await page.getByRole("button", { name: "Demo controls" }).click();
      await expect(panel).toBeVisible();
    },
    async close() {
      if (await panel.isVisible()) await page.getByRole("button", { name: "Close demo controls" }).click();
    },
    async click(name: RegExp | string) {
      // Simulation buttons live inline on the case page ("Prototype shortcut"), not in the panel.
      const inline = page.getByRole("region", { name: "Prototype shortcut" }).getByRole("button", { name });
      if (await inline.isVisible()) {
        await inline.click();
        return;
      }
      await this.open();
      const button = panel.getByRole("button", { name });
      // Rarely-used tools live under "More".
      if (!(await button.isVisible())) await panel.getByText("More", { exact: true }).click();
      await button.click();
      await this.close();
    },
    async reset() {
      await this.open();
      await panel.getByRole("button", { name: "Reset demo data" }).click();
      await page.getByRole("dialog", { name: "Reset demo data?" }).getByRole("button", { name: "Reset" }).click();
      await this.close();
    },
  };
}

export const statusBar = (page: Page) => page.getByRole("region", { name: "Case status" });
