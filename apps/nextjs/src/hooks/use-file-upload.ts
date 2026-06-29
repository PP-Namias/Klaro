"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import {
  validateFiles,
  fileToBase64,
} from "~/lib/file-validation";
import type { UploadStage } from "~/components/upload-progress";

interface UseFileUploadOptions {
  onSuccess?: (requestId: string) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  upload: (files: File[]) => Promise<void>;
  stage: UploadStage;
  progress: number;
  error: string | null;
  requestId: string | null;
  isUploading: boolean;
  reset: () => void;
}

export function useFileUpload({
  onSuccess,
  onError,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const trpc = useTRPC();

  const scanGuestImage = useMutation(
    trpc.documents.scanGuestImage.mutationOptions({
      onSuccess: (result) => {
        if (result.status === "error") {
          setStage("error");
          const message = result.error || "Scan failed. Please try again.";
          setError(message);
          onError?.(message);
          return;
        }
        setStage("complete");
        setProgress(100);
        setRequestId(result.requestId);
        onSuccess?.(result.requestId);
      },
      onError: (err) => {
        setStage("error");
        const message = err.message || "Upload failed. Please try again.";
        setError(message);
        onError?.(message);
      },
    }),
  );

  const upload = useCallback(
    async (files: File[]) => {
      const { valid, invalid } = validateFiles(files);

      if (invalid.length > 0 && invalid[0]) {
        const errorMsg = invalid[0].error ?? "Invalid file";
        setError(errorMsg);
        setStage("error");
        onError?.(errorMsg);
        return;
      }

      if (valid.length === 0) {
        setError("No valid files selected.");
        setStage("error");
        return;
      }

      setStage("validating");
      setProgress(10);
      setError(null);
      setRequestId(null);

      try {
        const file = valid[0];
        if (!file) {
          setError("No valid files selected.");
          setStage("error");
          return;
        }

        setStage("uploading");
        setProgress(30);

        const base64 = await fileToBase64(file);
        setProgress(60);

        setStage("processing");
        setProgress(80);

        scanGuestImage.mutate({
          base64Image: base64,
          fileName: file.name,
        });
      } catch (err) {
        setStage("error");
        const message = err instanceof Error ? err.message : "Upload failed.";
        setError(message);
        onError?.(message);
      }
    },
    [scanGuestImage, onError],
  );

  const reset = useCallback(() => {
    setStage("idle");
    setProgress(0);
    setError(null);
    setRequestId(null);
  }, []);

  return {
    upload,
    stage,
    progress,
    error,
    requestId,
    isUploading: stage !== "idle" && stage !== "complete" && stage !== "error",
    reset,
  };
}

export type { UseFileUploadOptions, UseFileUploadReturn };
