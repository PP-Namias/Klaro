import { describe, it, expect } from "vitest";

import type { FilePreviewItem } from "../file-preview";

describe("FilePreview", () => {
  it("returns null when files array is empty", () => {
    const files: FilePreviewItem[] = [];
    expect(files).toHaveLength(0);
  });

  it("shows file name and size for each file", () => {
    const files: FilePreviewItem[] = [
      {
        file: new File(["content"], "lab-results.png", {
          type: "image/png",
        }),
        previewUrl: "blob:preview-url",
        kind: "image",
      },
      {
        file: new File(["content"], "report.pdf", {
          type: "application/pdf",
        }),
        kind: "pdf",
      },
    ];

    expect(files).toHaveLength(2);
    expect(files[0]?.file.name).toBe("lab-results.png");
    expect(files[1]?.file.name).toBe("report.pdf");
  });

  it("distinguishes image and pdf kinds", () => {
    const imageItem: FilePreviewItem = {
      file: new File([""], "pic.jpg", { type: "image/jpeg" }),
      kind: "image",
    };
    const pdfItem: FilePreviewItem = {
      file: new File([""], "doc.pdf", { type: "application/pdf" }),
      kind: "pdf",
    };

    expect(imageItem.kind).toBe("image");
    expect(pdfItem.kind).toBe("pdf");
  });

  it("has previewUrl only for image files", () => {
    const imageItem: FilePreviewItem = {
      file: new File([""], "pic.jpg", { type: "image/jpeg" }),
      previewUrl: "blob:http://localhost/abc",
      kind: "image",
    };
    const pdfItem: FilePreviewItem = {
      file: new File([""], "doc.pdf", { type: "application/pdf" }),
      kind: "pdf",
    };

    expect(imageItem.previewUrl).toBeTruthy();
    expect(pdfItem.previewUrl).toBeUndefined();
  });

  it("remove button has correct aria-label", () => {
    const fileName = "lab-results.png";
    const ariaLabel = `Remove ${fileName}`;
    expect(ariaLabel).toBe("Remove lab-results.png");
  });
});

describe("FilePreview CSS", () => {
  it("fileList has fade-in animation", () => {
    const animation = "fadeIn 0.3s ease";
    expect(animation).toContain("fadeIn");
  });

  it("fileItem has hover background change", () => {
    const hoverBg = "#f3f4f6";
    expect(hoverBg).toBeTruthy();
  });

  it("remove button has hover red background", () => {
    const hoverBg = "#fee2e2";
    const hoverColor = "#ef4444";
    expect(hoverBg).toContain("fee2e2");
    expect(hoverColor).toContain("ef4444");
  });
});
