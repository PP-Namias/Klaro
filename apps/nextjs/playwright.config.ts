import { defineConfig, devices } from "@playwright/test";

/**
 * E2E target. Defaults to the Docker stack on :3100 (see docker-compose.yml).
 * Point it anywhere with E2E_BASE_URL, e.g. a `pnpm dev` server on :3000.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

/**
 * Only spawn a dev server when explicitly asked. Against Docker — the default —
 * the stack is already running and starting a second server would fight it.
 */
const useDevServer = process.env.E2E_START_DEV_SERVER === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["html", { open: "never" }], ["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    // getUserMedia and clipboard need explicit grants in headless Chromium.
    permissions: ["camera"],
    launchOptions: {
      args: [
        // Feed the camera a synthetic stream so capture is testable in CI.
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
  ...(useDevServer
    ? {
        webServer: {
          command: "pnpm dev",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      }
    : {}),
});
