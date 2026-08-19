import { expect, test } from "@playwright/test";

const STREAM_PAYLOAD = [
  `data: ${JSON.stringify({ event: "token", token: "Analyzing" })}\n\n`,
  `data: ${JSON.stringify({ event: "token", token: " the" })}\n\n`,
  `data: ${JSON.stringify({ event: "token", token: " patient" })}\n\n`,
  `data: ${JSON.stringify({ event: "token", token: " record." })}\n\n`,
  `data: ${JSON.stringify({
    event: "complete",
    answer: "Analyzing the patient record.",
  })}\n\n`,
].join("");

test.describe("Chat Interface E2E", () => {
  test("optimistically renders user input and streams assistant response", async ({
    page,
  }) => {
    await page.route("**/api/chat/stream", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: STREAM_PAYLOAD,
      });
    });

    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator("textarea.chatTextArea");
    await chatInput.fill("What does the record say?");
    await chatInput.press("Enter");

    await expect(page.locator(".userChatBubble")).toHaveText(
      "What does the record say?",
    );

    await expect(page.locator(".typingIndicator")).toHaveCount(1);

    await expect(
      page
        .locator(".claraChatBubble")
        .filter({ hasText: "Analyzing the patient record." }),
    ).toBeVisible();

    await expect(page.locator(".typingIndicator")).toHaveCount(0);
  });

  test("shows the fallback bubble when the stream request fails", async ({
    page,
  }) => {
    await page.route("**/api/chat/stream", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Sidecar request failed" }),
      }),
    );

    await page.goto("/scan");
    await page.waitForLoadState("networkidle");

    const chatInput = page.locator("textarea.chatTextArea");
    await chatInput.fill("What does the record say?");
    await chatInput.press("Enter");

    await expect(page.locator(".userChatBubble")).toHaveText(
      "What does the record say?",
    );

    await expect(
      page
        .locator(".claraChatBubble")
        .filter({ hasText: "Please upload a document first" }),
    ).toBeVisible();

    await expect(page.locator(".typingIndicator")).toHaveCount(0);
  });
});
