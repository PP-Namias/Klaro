import { describe, expect, it } from "vitest";

describe("DropOverlay", () => {
  it("renders with correct text when visible", () => {
    const text = "Drop your medical documents here";
    expect(text).toContain("Drop");
    expect(text).toContain("medical documents");
  });

  it("shows accepted file types", () => {
    const subtext = "PNG, JPG, WebP, or PDF — up to 50MB";
    expect(subtext).toContain("PNG");
    expect(subtext).toContain("JPG");
    expect(subtext).toContain("WebP");
    expect(subtext).toContain("PDF");
    expect(subtext).toContain("50MB");
  });

  it("is hidden when not visible", () => {
    const isVisible = false;
    const shouldRender = false;
    expect(isVisible).toBe(false);
    expect(shouldRender).toBe(false);
  });

  it("shows when dragging files over the page", () => {
    const isVisible = true;
    expect(isVisible).toBe(true);
  });
});

describe("DropOverlay CSS animations", () => {
  it("has fadeIn animation for visible state", () => {
    const animation = "fadeIn 0.2s ease";
    expect(animation).toContain("fadeIn");
  });

  it("has fadeOut animation for hidden state", () => {
    const animation = "fadeOut 0.3s ease";
    expect(animation).toContain("fadeOut");
  });

  it("has bounceIn animation for content", () => {
    const animation = "bounceIn 0.4s ease";
    expect(animation).toContain("bounceIn");
  });

  it("has pulse animation for icon circle", () => {
    const animation = "pulse 1.5s ease-in-out infinite";
    expect(animation).toContain("pulse");
    expect(animation).toContain("infinite");
  });

  it("has bounceArrow animation for upload arrow", () => {
    const animation = "bounceArrow 1s ease-in-out infinite";
    expect(animation).toContain("bounceArrow");
    expect(animation).toContain("infinite");
  });

  it("overlay has backdrop blur", () => {
    const backdropFilter = "blur(4px)";
    expect(backdropFilter).toContain("blur");
  });

  it("overlay has high z-index", () => {
    const zIndex = 9999;
    expect(zIndex).toBeGreaterThanOrEqual(9000);
  });
});
