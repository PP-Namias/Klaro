import { expect, test } from "@playwright/test";

test.describe("Cal booking modal", () => {
  test("opens and closes", async ({ page }) => {
    await page.goto("/scan");
    await page.getByRole("button", { name: /book a doctor/i }).click();
    await expect(
      page.getByRole("dialog", { name: /book a doctor/i }),
    ).toBeVisible();
    await page.getByLabel("Close booking modal").click();
    await expect(
      page.getByRole("dialog", { name: /book a doctor/i }),
    ).toHaveCount(0);
  });

  test("keeps focus trapped inside the modal", async ({ page }) => {
    await page.goto("/scan");
    await page.getByRole("button", { name: /book a doctor/i }).click();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("dialog", { name: /book a doctor/i }),
    ).toContainText(/open in new tab/i);
  });

  test("shows fallback after the load timeout", async ({ page }) => {
    await page.goto("/scan");
    await page.getByRole("button", { name: /book a doctor/i }).click();
    await page.waitForTimeout(2100);
    await expect(
      page.getByRole("button", { name: /i completed booking \(manual\)/i }),
    ).toBeVisible();
  });

  test("handles booking detection", async ({ page }) => {
    await page.goto("/scan");
    await page.getByRole("button", { name: /book a doctor/i }).click();
    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "booking.created" },
          origin: "https://cal.com",
        }),
      );
    });
    await expect(
      page.getByRole("dialog", { name: /book a doctor/i }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => sessionStorage.getItem("SCAN_CAL_BOOKING")),
      )
      .not.toBeNull();
  });
});
