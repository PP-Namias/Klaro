import { expect, test } from "@playwright/test";

test.describe("Analysis Results Display", () => {
  test("scan page loads with analysis section", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("page shows document demo cards", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const demoCard = page
      .locator("text=Lab Results")
      .or(page.locator("text=Prescriptions"));
    await expect(demoCard.first()).toBeVisible();
  });

  test("displays chat interface alongside results", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("page has accessible structure", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const main = page.locator("main, section, [role='main']").first();
    await expect(main).toBeVisible();
  });
});
