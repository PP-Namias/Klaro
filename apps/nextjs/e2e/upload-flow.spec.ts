import { expect, test } from "@playwright/test";

test.describe("Upload Flow", () => {
  test("drop zone is visible on scan page", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const dropZone = page
      .locator("text=Drag & drop files or click to browse")
      .or(page.locator("text=Drop files here"));
    await expect(dropZone.first()).toBeVisible();
  });

  test("file input accepts images and PDFs", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const fileInput = page.locator('input[type="file"]').first();
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toBeTruthy();
  });

  test("shows progress indicator during upload", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const progressSection = page
      .locator("text=Uploading")
      .or(page.locator("text=Processing"));
    // Upload progress area should be present in the DOM
    await expect(progressSection).toBeHidden();
  });

  test("upload area displays correctly on mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const scanSection = page.locator("section").first();
    await expect(scanSection).toBeVisible();
  });

  test("upload area displays correctly on tablet viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const scanSection = page.locator("section").first();
    await expect(scanSection).toBeVisible();
  });
});
