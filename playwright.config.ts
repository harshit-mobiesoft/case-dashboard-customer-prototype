import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Normal setup: `pnpm exec playwright install chromium`. If you already have a compatible
// Chromium on disk (e.g. from another Playwright version), point PW_CHROMIUM_PATH at it.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath },
    // Deterministic: no mid-animation screenshots / contrast scans. (The app honours this.)
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Production build: exercises exactly what ships. Latency off so tests are fast and deterministic.
    command: `pnpm build && pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // Separate dist dir: tests must never touch the `.next` that `pnpm dev` is using.
    env: { NEXT_PUBLIC_MOCK_LATENCY_MS: "0", NEXT_DIST_DIR: ".next-e2e" },
  },
});
