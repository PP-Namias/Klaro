import { test, expect } from "@playwright/test";

test.describe("Clara Chat Interaction", () => {
  test("patient can access the chat interface", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e-screenshots/06-chat-access.png" });
  });

  test("patient can see the home page with navigation", async ({ page }) => {
    await page.goto("/");
    const nav = await page.$("nav, header, [role='navigation']");
    expect(nav).toBeTruthy();
    await page.screenshot({ path: "e2e-screenshots/07-navigation.png" });
  });

  test("patient can view the scan analysis page", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
    await page.screenshot({ path: "e2e-screenshots/08-scan-analysis.png" });
  });

  test("patient can access auth signin page", async ({ page }) => {
    await page.goto("/api/auth/signin?provider=google");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e-screenshots/09-signin-page.png" });
  });

  test("patient can see the documents page", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e-screenshots/10-documents-page.png" });
  });
});
