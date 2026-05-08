/** @vitest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
