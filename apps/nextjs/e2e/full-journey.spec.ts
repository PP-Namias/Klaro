import { test, expect } from "@playwright/test";

test.describe("Full Patient Journey", () => {
  test("patient views the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Klaro/);
    await page.screenshot({ path: "e2e-screenshots/16-journey-home.png" });
  });

  test("patient navigates to scan page", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e-screenshots/17-journey-scan.png" });
  });

  test("patient views facilities", async ({ page }) => {
    await page.goto("/facilities");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e-screenshots/18-journey-facilities.png" });
  });

  test("patient accesses API documentation", async ({ page }) => {
    await page.goto("/api/docs");
    await page.waitForLoadState("networkidle");
    const content = await page.textContent("body");
    expect(content).toContain("Klaro");
    await page.screenshot({ path: "e2e-screenshots/19-journey-docs.png" });
  });

  test("patient views documents page", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e-screenshots/20-journey-documents.png" });
  });

  test("patient can access auth flow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e-screenshots/21-journey-auth.png" });
  });

  test("patient completes journey overview", async ({ page }) => {
    await page.goto("/");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    await page.screenshot({ path: "e2e-screenshots/22-journey-complete.png" });
  });
});
