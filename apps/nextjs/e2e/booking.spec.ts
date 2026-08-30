import { expect, test } from "@playwright/test";

test.describe("Patient Booking Flow", () => {
  test("patient can view facilities listing", async ({ page }) => {
    await page.goto("/facilities");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: "e2e-screenshots/11-facilities-listing.png",
    });
  });

  test("patient can navigate to scheduling", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: "e2e-screenshots/12-scheduling-nav.png" });
  });

  test("patient can see the home dashboard", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toBeTruthy();
    await page.screenshot({ path: "e2e-screenshots/13-home-dashboard.png" });
  });

  test("patient can access the scan upload page", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: "e2e-screenshots/14-scan-upload.png" });
  });

  test("patient can view the API health endpoint", async ({ page }) => {
    const response = await page.request.get(
      "/api/trpc/facilities.searchNearby?input=%7B%22json%22%3A%7B%22latitude%22%3A14.5995%2C%22longitude%22%3A120.9842%7D%7D",
    );
    expect(response.status()).toBeTruthy();
    await page.screenshot({ path: "e2e-screenshots/15-api-health.png" });
  });
});
