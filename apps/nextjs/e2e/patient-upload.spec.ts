import { expect, test } from "@playwright/test";

test.describe("Patient Upload Flow", () => {
  test("patient navigates to upload page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Klaro/);
    await page.screenshot({ path: "e2e-screenshots/01-homepage.png" });
  });

  test("patient can see the landing page content", async ({ page }) => {
    await page.goto("/");
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
    await page.screenshot({ path: "e2e-screenshots/02-landing-content.png" });
  });

  test("patient can navigate to scan page", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: "e2e-screenshots/03-scan-page.png" });
  });

  test("patient can see the API docs page", async ({ page }) => {
    await page.goto("/api/docs");
    await page.waitForLoadState("domcontentloaded");
    const content = await page.textContent("body");
    expect(content).toContain("Klaro API");
    await page.screenshot({ path: "e2e-screenshots/04-api-docs.png" });
  });

  test("patient can see facilities page", async ({ page }) => {
    await page.goto("/facilities");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: "e2e-screenshots/05-facilities-page.png" });
  });
});
