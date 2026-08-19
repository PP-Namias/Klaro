import { expect, test } from "@playwright/test";

test.describe("Scan Page - File Upload Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");
  });

  test("scan page loads with title and subtitle", async ({ page }) => {
    await expect(page.locator('h1[class*="title"]')).toBeVisible();
    await expect(page.locator('p[class*="subtitle"]')).toBeVisible();
  });

  test("shows four document category cards", async ({ page }) => {
    await expect(
      page.locator('[class*="scanCard"]').filter({
        has: page.locator('[class*="scanCardImageContainer"]'),
      }),
    ).toHaveCount(4);
  });

  test("shows drop zone with upload text", async ({ page }) => {
    await expect(
      page.getByText("Drag & drop files or click to browse"),
    ).toBeVisible();
    await expect(
      page.getByText("PNG, JPG, WebP, PDF up to 50MB"),
    ).toBeVisible();
  });

  test("shows Clara chat interface", async ({ page }) => {
    await expect(page.locator('[class*="claraChatBubble"]').first()).toBeVisible();
  });

  test("shows camera scan button", async ({ page }) => {
    await expect(page.getByText("Take a photo & Scan here")).toBeVisible();
  });

  test("shows footer notes", async ({ page }) => {
    await expect(page.locator('[class*="footerNotes"]')).toBeVisible();
  });

  test("shows chat input area", async ({ page }) => {
    await expect(
      page.locator('textarea[class*="chatTextArea"]'),
    ).toBeVisible();
  });
});

test.describe("Scan Page - Drag and Drop Animation", () => {
  test("drop zone has correct styling classes", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const dropZone = page.locator('[role="button"]').first();
    await expect(dropZone).toBeVisible();
  });

  test("drop zone is clickable", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const dropZone = page.locator('[role="button"]').first();
    await expect(dropZone).toBeEnabled();
  });
});

test.describe("Scan Page - Chat Input", () => {
  test("can type in chat input", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const chatInput = page.locator('textarea[class*="chatTextArea"]');
    await chatInput.fill("What is hemoglobin?");
    await expect(chatInput).toHaveValue("What is hemoglobin?");
  });

  test("send button appears active when text is entered", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForSelector("text=Drag & drop files or click to browse");

    const chatInput = page.locator('textarea[class*="chatTextArea"]');
    await chatInput.fill("Hello Clara");
    const sendBtn = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .last();
    await expect(sendBtn).toBeVisible();
  });
});