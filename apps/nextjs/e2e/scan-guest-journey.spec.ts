import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// The app is ESM, so __dirname does not exist here.
const here = dirname(fileURLToPath(import.meta.url));

/**
 * Browser-level coverage of /scan for an anonymous visitor: the upload,
 * camera and Clara paths a real user actually takes.
 */

const LAB_REPORT = join(here, "fixtures", "lab-report.jpg");
const NOT_AN_IMAGE = join(here, "fixtures", "not-an-image.txt");

const DROP_ZONE_TEXT = "Drag & drop files or click to browse";

test.beforeEach(async ({ page }) => {
  await page.goto("/scan");
  await page.getByText(DROP_ZONE_TEXT).waitFor();
});

test.describe("page shell", () => {
  test("renders the scanner without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.reload();
    await page.getByText(DROP_ZONE_TEXT).waitFor();

    expect(errors).toEqual([]);
  });

  test("does not leak raw i18n keys into the UI", async ({ page }) => {
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    // Untranslated keys render literally, e.g. "chat.quick.lab".
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+\b/);
  });

  test("offers both a camera and a file entry point", async ({ page }) => {
    await expect(page.getByText("Take a photo & Scan here")).toBeVisible();
    await expect(page.getByText(DROP_ZONE_TEXT)).toBeVisible();
  });
});

test.describe("file upload", () => {
  test("accepts a lab report and reaches a terminal state", async ({
    page,
  }) => {
    await page.setInputFiles('input[type="file"]', LAB_REPORT);

    // Either the scan completes or it surfaces an explicit error — what must
    // not happen is sitting on a spinner forever, which is what the bundled
    // tesseract worker used to cause.
    await expect(
      page
        .locator("body")
        .filter({ hasText: /complete|analiz|result|summary|error|failed/i }),
    ).toBeVisible({ timeout: 120_000 });
  });

  test("shows a preview once a file is chosen", async ({ page }) => {
    await page.setInputFiles('input[type="file"]', LAB_REPORT);
    await expect(page.locator("img, canvas, video").first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("refuses a file that is not a supported document", async ({ page }) => {
    const dialogs: string[] = [];
    page.on("dialog", async (d) => {
      dialogs.push(d.message());
      await d.dismiss();
    });

    await page.setInputFiles('input[type="file"]', NOT_AN_IMAGE);
    await page.waitForTimeout(2_000);

    const body = await page.locator("body").innerText();
    const rejected =
      dialogs.length > 0 || /not supported|invalid|only|allowed/i.test(body);
    expect(rejected).toBe(true);
  });
});

test.describe("camera", () => {
  test("opens the camera and streams", async ({ page, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "fake media stream flags are Chromium-only",
    );

    await page.getByText("Take a photo & Scan here").click();

    const video = page.locator("video");
    await expect(video).toBeVisible({ timeout: 20_000 });

    // A black 1x1 element would still be "visible"; require real dimensions.
    await expect
      .poll(
        async () =>
          video.first().evaluate((el: HTMLVideoElement) => el.videoWidth),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);
  });

  test("requires a secure context for getUserMedia", async ({ page }) => {
    // getUserMedia is unavailable on plain HTTP outside localhost, so any
    // non-localhost deployment has to be served over HTTPS.
    const secure = await page.evaluate(() => window.isSecureContext);
    expect(secure).toBe(true);
  });
});

test.describe("Clara", () => {
  test("answers a guest question", async ({ page }) => {
    const input = page.locator('textarea[class*="chatTextArea"]');
    await input.fill("What is hemoglobin?");
    await input.press("Enter");

    await expect(
      page.locator('[class*="claraChatBubble"], [class*="message"]').last(),
    ).toContainText(/./, { timeout: 90_000 });
  });

  test("keeps the conversation after a follow-up", async ({ page }) => {
    const input = page.locator('textarea[class*="chatTextArea"]');

    await input.fill("What is hemoglobin?");
    await input.press("Enter");
    await page.waitForTimeout(5_000);

    await input.fill("And what about cholesterol?");
    await input.press("Enter");
    await page.waitForTimeout(5_000);

    const body = await page.locator("body").innerText();
    expect(body).toContain("hemoglobin");
    expect(body.toLowerCase()).toContain("cholesterol");
  });
});
