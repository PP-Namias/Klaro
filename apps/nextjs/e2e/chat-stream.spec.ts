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
    await page.waitForLoadState("domcontentloaded");

    const chatInput = page.locator('textarea[class*="chatTextArea"]');
    await chatInput.fill("What does the record say?");
    await chatInput.press("Enter");

    await expect(page.locator('[class*="userChatBubble"]')).toHaveText(
      "What does the record say?",
    );

    await expect(page.locator('[class*="typingIndicator"]')).toHaveCount(1);

    await expect(
      page
        .locator('[class*="claraChatBubble"]')
        .filter({ hasText: "Analyzing the patient record." }),
    ).toBeVisible();

    await expect(page.locator('[class*="typingIndicator"]')).toHaveCount(0);
  });

  test("still answers when the stream fails, via the guest fallback", async ({
    page,
  }) => {
    // Only the streaming route is broken. use-chat now retries over the public
    // sendGuestMessage procedure, so a guest gets a real answer instead of the
    // dead-end "upload a document first" message this used to produce.
    await page.route("**/api/chat/stream", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Sidecar request failed" }),
      }),
    );

    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const chatInput = page.locator('textarea[class*="chatTextArea"]');
    await chatInput.fill("What does the record say?");
    await chatInput.press("Enter");

    await expect(page.locator('[class*="userChatBubble"]')).toHaveText(
      "What does the record say?",
    );

    const reply = page.locator('[class*="claraChatBubble"]').last();
    await expect(reply).toBeVisible({ timeout: 60_000 });
    await expect(reply).not.toHaveText(/upload a document first/i);
  });

  test("shows a recoverable message when the fallback also fails", async ({
    page,
  }) => {
    await page.route("**/api/chat/stream", (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    );
    await page.route("**/api/trpc/chat.sendGuestMessage**", (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    );

    await page.goto("/scan");
    await page.waitForLoadState("domcontentloaded");

    const chatInput = page.locator('textarea[class*="chatTextArea"]');
    await chatInput.fill("What does the record say?");
    await chatInput.press("Enter");

    // With both paths down the user must still be told to try again, never
    // left staring at a typing indicator.
    await expect(
      page
        .locator('[class*="claraChatBubble"]')
        .filter({ hasText: /try asking again|upload a document first/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[class*="typingIndicator"]')).toHaveCount(0);
  });
});
