/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mutateMock = vi.fn();

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    documents: {
      scanGuestImage: {
        mutationOptions: () => ({})
      }
    }
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: mutateMock, mutateAsync: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { UploadForm } from "../upload-form";

describe("UploadForm", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mutateMock.mockClear();
  });

  it("shows the upload trigger and prepares a file for scanning", () => {
    render(<UploadForm />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    expect(screen.getByText("test.png")).toBeTruthy();
    expect(screen.getByRole("button", { name: /scan with ai/i })).toBeTruthy();
  });

  it("shows an error when file type is not supported", () => {
    render(<UploadForm />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = new File(["dummy content"], "test.txt", { type: "text/plain" });
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    expect(
      screen.getByText(/file type not supported\. please use png, jpg, pdf, webp, tiff, bmp, or gif\./i),
    ).toBeTruthy();
    expect(screen.getByText(/state:/i)).toBeTruthy();
    expect(screen.getByText("error")).toBeTruthy();
  });

  it("shows an error when file exceeds the max size", () => {
    render(<UploadForm />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const largeFile = new File(["small"], "huge.pdf", { type: "application/pdf" });
    Object.defineProperty(largeFile, "size", { value: 50 * 1024 * 1024 + 1 });

    fireEvent.change(input as HTMLInputElement, { target: { files: [largeFile] } });

    expect(screen.getByText(/file size must be under 50 mb\./i)).toBeTruthy();
    expect(screen.getByText(/state:/i)).toBeTruthy();
    expect(screen.getByText("error")).toBeTruthy();
  });
});
