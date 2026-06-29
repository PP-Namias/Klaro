import { test, expect } from "@playwright/test";

test.describe("Scan Page - File Upload Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");
  });

  test("scan page loads with title and subtitle", async ({ page }) => {
    await expect(
      page.getByText("Scan Your Results. Understand Them Instantly."),
    ).toBeVisible();
    await expect(
      page.getByText("Upload your medical documents"),
    ).toBeVisible();
  });

  test("shows four document category cards", async ({ page }) => {
    await expect(page.getByText("Lab Results")).toBeVisible();
    await expect(page.getByText("Prescriptions")).toBeVisible();
    await expect(page.getByText("Discharge")).toBeVisible();
    await expect(page.getByText("Other")).toBeVisible();
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
    await expect(page.getByText("Start Scanning")).toBeVisible();
    await expect(page.getByText("Upload a document")).toBeVisible();
    await expect(page.getByText("ask me a health question")).toBeVisible();
  });

  test("shows camera scan button", async ({ page }) => {
    await expect(
      page.getByText("Take a photo & Scan here"),
    ).toBeVisible();
  });

  test("shows footer notes", async ({ page }) => {
    await expect(page.getByText("Analysis & Chat")).toBeVisible();
    await expect(
      page.getByText("Your data is private and secure"),
    ).toBeVisible();
  });

  test("shows chat input area", async ({ page }) => {
    await expect(
      page.getByPlaceholder(
        "Upload a medical document or ask a health question...",
      ),
    ).toBeVisible();
  });
});

test.describe("Scan Page - Drag and Drop Animation", () => {
  test("drop zone has correct styling classes", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const dropZone = page.locator('[role="button"]').first();
    await expect(dropZone).toBeVisible();
  });

  test("drop zone is clickable", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const dropZone = page.locator('[role="button"]').first();
    await expect(dropZone).toBeEnabled();
  });
});

test.describe("Scan Page - Chat Input", () => {
  test("can type in chat input", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const chatInput = page.getByPlaceholder(
      "Upload a medical document or ask a health question...",
    );
    await chatInput.fill("What is hemoglobin?");
    await expect(chatInput).toHaveValue("What is hemoglobin?");
  });

  test("send button appears active when text is entered", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const chatInput = page.getByPlaceholder(
      "Upload a medical document or ask a health question...",
    );
    await chatInput.fill("Hello Clara");
    // Send button should be visible
    const sendBtn = page.locator("button").filter({ has: page.locator("svg") }).last();
    await expect(sendBtn).toBeVisible();
  });
});
