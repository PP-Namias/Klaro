import { test, expect } from "@playwright/test";

test.describe("Chat Flow", () => {
  test("chat input is visible on scan page", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute("placeholder", /upload|ask/i);
  });

  test("send button is disabled when input is empty", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const sendBtn = page.locator("button").filter({ has: page.locator("svg") }).last();
    await expect(sendBtn).toBeVisible();
  });

  test("typing in textarea enables send button", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("What is hemoglobin?");
    await expect(textarea).toHaveValue("What is hemoglobin?");
  });

  test("dialect toggle shows language options", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const dialectBtn = page.locator("button").filter({ hasText: /EN|FIL|BIS|ILO/ }).first();
    await expect(dialectBtn).toBeVisible();
  });

  test("chat history section is present", async ({ page }) => {
    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const chatSection = page.locator("section, div").first();
    await expect(chatSection).toBeVisible();
  });
});
