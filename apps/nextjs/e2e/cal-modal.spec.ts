import { expect, test } from "@playwright/test";

const bookingTrigger = (page: import("@playwright/test").Page) =>
  page.locator("aside").getByRole("button", { name: /book a doctor/i });

const bookingDialog = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: /book a doctor/i });

test.describe("Cal booking modal", () => {
  test("opens and closes from the sidebar trigger", async ({ page }) => {
    await page.goto("/scan");
    await bookingTrigger(page).click();
    await expect(bookingDialog(page)).toBeVisible();
    await page.getByLabel("Close booking modal").click();
    await expect(bookingDialog(page)).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe("");
  });

  test("keeps focus trapped inside the modal", async ({ page }) => {
    await page.goto("/scan");
    await bookingTrigger(page).click();
    await page.keyboard.press("Tab");
    await expect(bookingDialog(page)).toContainText(/new tab/i);
  });

  test("shows loading skeleton while the iframe loads", async ({ page }) => {
    await page.route("https://cal.com/**", (route) => route.abort());
    await page.goto("/scan");
    await bookingTrigger(page).click();
    await expect(page.locator("div.h-1\\.5.bg-zinc-400")).toHaveCount(3);
  });

  test("handles booking detection from cal.com postMessage", async ({
    page,
  }) => {
    await page.goto("/scan");
    await bookingTrigger(page).click();
    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "booking.created" },
          origin: "https://cal.com",
        }),
      );
    });
    await expect(bookingDialog(page)).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => sessionStorage.getItem("SCAN_CAL_BOOKING")),
      )
      .not.toBeNull();
  });

  test("deep links via #booking=open and clears the hash on close", async ({
    page,
  }) => {
    await page.goto("/scan#booking=open");
    await expect(bookingDialog(page)).toBeVisible();
    await page.getByLabel("Close booking modal").click();
    await expect(bookingDialog(page)).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe("");
  });
});