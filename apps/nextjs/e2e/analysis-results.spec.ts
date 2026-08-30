import { expect, test } from "@playwright/test";

test.describe("Analysis Results Display", () => {
  test("scan page loads with analysis section", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("page shows document demo cards", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    // Assert on structure, not copy: the page renders in the visitor's
    // language, so matching English text only passed under one locale.
    const demoCards = page.locator('[class*="scanCard"]');
    await expect(demoCards.first()).toBeVisible();
    expect(await demoCards.count()).toBeGreaterThanOrEqual(4);
  });

  test("displays chat interface alongside results", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("page has accessible structure", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const main = page.locator("main, section, [role='main']").first();
    await expect(main).toBeVisible();
  });
});
