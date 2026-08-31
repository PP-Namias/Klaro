/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFileUpload } from "~/hooks/use-file-upload";

/**
 * These tests drive the real hook. Before this suite the upload flow could
 * never reach a terminal stage: upload() derived completion from the `queue`
 * state captured in its own closure, which never included the files it had
 * just processed, so `stage` stayed on "uploading" forever and both
 * UploadComplete and UploadError were unreachable.
 */

const scanMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
  useTRPCClient: () => ({
    documents: { scanGuestImage: { mutate: scanMutate } },
  }),
}));

vi.mock("~/lib/file-validation", async () => {
  const actual = await vi.importActual<typeof import("~/lib/file-validation")>(
    "~/lib/file-validation",
  );
  return {
    ...actual,
    // Bypass magic-byte sniffing; these tests are about queue state machinery.
    validateFiles: (files: File[]) =>
      Promise.resolve({ valid: files, invalid: [] }),
    fileToBase64: () => Promise.resolve("ZmFrZS1iYXNlNjQ="),
  };
});

function makeFile(name = "lab.png") {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });
}

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts idle with no progress and no error", () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.stage).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.queue).toEqual([]);
  });

  it("reaches stage 'complete' with progress 100 after a successful upload", async () => {
    scanMutate.mockResolvedValue({ status: "completed", requestId: "req-1" });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.upload([makeFile()]);
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("complete");
    });
    expect(result.current.progress).toBe(100);
    expect(result.current.requestId).toBe("req-1");
    expect(result.current.isUploading).toBe(false);
  });

  it("reaches stage 'error' and sets error when the scan returns an error", async () => {
    scanMutate.mockResolvedValue({
      status: "error",
      error: "Document unreadable",
    });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.upload([makeFile()]);
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("error");
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.queue[0]?.stage).toBe("error");
  });

  it("reaches stage 'error' when the mutation itself rejects", async () => {
    scanMutate.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.upload([makeFile()]);
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("error");
    });
    expect(result.current.queue[0]?.error).toContain("network down");
  });

  it("completes every file in a multi-file queue", async () => {
    scanMutate
      .mockResolvedValueOnce({ status: "completed", requestId: "req-a" })
      .mockResolvedValueOnce({ status: "completed", requestId: "req-b" })
      .mockResolvedValueOnce({ status: "completed", requestId: "req-c" });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.upload([
        makeFile("a.png"),
        makeFile("b.png"),
        makeFile("c.png"),
      ]);
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("complete");
    });
    expect(result.current.queue).toHaveLength(3);
    expect(result.current.queue.map((f) => f.requestId)).toEqual([
      "req-a",
      "req-b",
      "req-c",
    ]);
  });

  it("keeps the returned analysis on the queue item so /scan can render it", async () => {
    const analysis = {
      requestId: "req-1",
      status: "completed",
      language: "English",
      plainLanguageSummary: "Your blood sugar is higher than normal.",
      urgency: "MODERATE",
      recommendations: ["Follow up with your doctor"],
      confidence: 0.91,
      timestamp: new Date().toISOString(),
    };
    scanMutate.mockResolvedValue(analysis);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFileUpload({ onSuccess }));

    await act(async () => {
      await result.current.upload([makeFile()]);
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("complete");
    });

    // The analysis is carried in React state so the page can render it, and is
    // handed to onSuccess alongside the request id.
    expect(result.current.queue[0]?.result).toMatchObject({
      plainLanguageSummary: "Your blood sugar is higher than normal.",
      urgency: "MODERATE",
      confidence: 0.91,
    });
    expect(onSuccess).toHaveBeenCalledWith("req-1", analysis);
  });

  it("reports an error stage when no file survives validation", async () => {
    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.upload([]);
    });

    expect(result.current.stage).toBe("error");
    expect(result.current.error).toBe("No valid files selected.");
    expect(scanMutate).not.toHaveBeenCalled();
  });

  it("resets back to a clean idle state", async () => {
    scanMutate.mockResolvedValue({ status: "completed", requestId: "req-1" });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.upload([makeFile()]);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.stage).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.queue).toEqual([]);
    expect(result.current.requestId).toBeNull();
  });
});
