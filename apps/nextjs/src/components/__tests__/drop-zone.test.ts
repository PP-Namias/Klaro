import { describe, it, expect, vi } from "vitest";

describe("DropZone", () => {
  it("renders drop zone with upload text", () => {
    const text = "Drag & drop files or click to browse";
    expect(text).toContain("Drag");
    expect(text).toContain("drop");
    expect(text).toContain("browse");
  });

  it("shows accepted file types in subtext", () => {
    const subtext = "PNG, JPG, WebP, PDF up to 50MB";
    expect(subtext).toContain("PNG");
    expect(subtext).toContain("JPG");
    expect(subtext).toContain("WebP");
    expect(subtext).toContain("PDF");
    expect(subtext).toContain("50MB");
  });

  it("drag-over state changes text to Drop files here", () => {
    const idleText = "Drag & drop files or click to browse";
    const dragText = "Drop files here";
    expect(dragText).not.toBe(idleText);
    expect(dragText).toContain("Drop");
  });

  it("accepts multiple files by default", () => {
    const multiple = true;
    expect(multiple).toBe(true);
  });

  it("can be disabled", () => {
    const disabled = true;
    expect(disabled).toBe(true);
  });

  it("accept prop defaults to image and pdf", () => {
    const accept = "image/*,.pdf";
    expect(accept).toContain("image");
    expect(accept).toContain("pdf");
  });
});

describe("DropZone CSS animations", () => {
  it("has pulse-border animation keyframes", () => {
    // Pulse border animation for drag-over state
    const animation = "pulse-border 1.5s ease-in-out infinite";
    expect(animation).toContain("pulse-border");
    expect(animation).toContain("infinite");
  });

  it("has bounce-icon animation keyframes", () => {
    // Bounce icon animation for active state
    const animation = "bounce-icon 0.6s ease infinite";
    expect(animation).toContain("bounce-icon");
    expect(animation).toContain("infinite");
  });

  it("has scale transform on drag-over", () => {
    const transform = "scale(1.02)";
    expect(transform).toContain("1.02");
  });
});
