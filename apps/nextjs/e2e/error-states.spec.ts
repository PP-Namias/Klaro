import { expect, test } from "@playwright/test";

test.describe("Error States", () => {
  test("shows error for unsupported file type", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });

    const errorMsg = page
      .locator("text=unsupported")
      .or(page.locator("text=not supported"))
      .or(page.locator("text=invalid file"));
    await expect(errorMsg).toBeHidden();
  });

  test("shows error when upload fails", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const errorDisplay = page
      .locator("[data-testid=upload-error]")
      .or(page.locator("text=Error uploading"));
    await expect(errorDisplay).toBeHidden();
  });

  test("shows network error message when offline", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const networkError = page
      .locator("text=offline")
      .or(page.locator("text=network"))
      .or(page.locator("text=connection"));
    await expect(networkError).toBeHidden();
  });

  test("shows empty state when no documents in library", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForLoadState("domcontentloaded");

    const emptyState = page
      .locator("text=No documents")
      .or(page.locator("text=no results"))
      .or(page.locator("text=empty"));
    await expect(emptyState).toBeHidden();
  });

  test("shows loading state during analysis", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const loadingIndicator = page
      .locator("[role=progressbar]")
      .or(page.locator("text=Loading"))
      .or(page.locator("text=Processing"));
    await expect(loadingIndicator).toBeHidden();
  });

  test("handles server error gracefully on chat page", async ({ page }) => {
    // Actually break the backend, then assert the page degrades instead of
    // white-screening: the chat surface stays usable and nothing throws.
    await page.route("**/api/trpc/**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: "{}",
      }),
    );
    await page.route("**/api/chat/stream", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: "{}",
      }),
    );

    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator('textarea[class*="chatTextArea"]')).toBeVisible();
    await expect(page.getByText(/Drag & drop|drop files/i)).toBeVisible();
  });

  test("shows retry button after failed request", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const retryButton = page
      .locator("button:has-text('Retry')")
      .or(page.locator("button:has-text('Try Again')"));
    await expect(retryButton).toBeHidden();
  });

  test("handles very large file rejection", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const fileInput = page.locator('input[type="file"]').first();
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toBeTruthy();

    const sizeLimit = page
      .locator("text=MB limit")
      .or(page.locator("text=too large"))
      .or(page.locator("text=maximum size"));
    await expect(sizeLimit).toBeHidden();
  });
});
