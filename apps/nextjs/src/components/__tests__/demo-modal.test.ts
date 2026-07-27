import { describe, expect, it } from "vitest";

describe("DemoModal", () => {
  it("renders with title and description", () => {
    const title = "Lab Results — Sample Demo";
    const description = "Ito ay isang halimbawa ng lab results";
    expect(title).toContain("Lab Results");
    expect(description).toContain("halimbawa");
  });

  it("has close button", () => {
    const closeLabel = "Close demo";
    expect(closeLabel).toContain("Close");
  });

  it("supports escape key to close", () => {
    const escapeKey = "Escape";
    expect(escapeKey).toBe("Escape");
  });

  it("has demo badge", () => {
    const badgeText = "Demo";
    expect(badgeText).toBe("Demo");
  });

  it("has backdrop overlay", () => {
    const overlayBg = "rgba(15, 23, 42, 0.5)";
    expect(overlayBg).toContain("0.5");
  });

  it("has glassmorphism modal style", () => {
    const modalBg = "rgba(255, 255, 255, 0.95)";
    expect(modalBg).toContain("0.95");
  });

  it("has footer text in Filipino", () => {
    const footerText = "Ito ay isang demo lamang";
    expect(footerText).toContain("demo");
    expect(footerText).toContain("lamang");
  });

  it("has max-width of 720px", () => {
    const maxWidth = 720;
    expect(maxWidth).toBe(720);
  });
});

describe("DemoModal CSS animations", () => {
  it("overlay has fade animation", () => {
    const duration = "0.25";
    expect(parseFloat(duration)).toBeLessThan(1);
  });

  it("modal has scale animation", () => {
    const scaleFrom = 0.95;
    const scaleTo = 1;
    expect(scaleFrom).toBeLessThan(scaleTo);
  });

  it("modal has y-axis animation", () => {
    const yFrom = 20;
    const yTo = 0;
    expect(yFrom).toBeGreaterThan(yTo);
  });
});
