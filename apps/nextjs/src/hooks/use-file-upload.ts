/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

"use client";

import { useCallback, useRef, useState } from "react";

import type { Language } from "@klaro/validators/language";
import { LANGUAGE_TO_DIALECT } from "@klaro/validators/language";

import type { UploadStage } from "~/components/upload-progress";
import { fileToBase64, validateFiles } from "~/lib/file-validation";
import { useTRPCClient } from "~/trpc/react";

export interface UploadFileItem {
  id: string;
  file: File;
  stage: "pending" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  error?: string;
  requestId?: string;
}

interface UseFileUploadOptions {
  language?: Language;
  onSuccess?: (requestId: string) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  queue: UploadFileItem[];
  upload: (files: File[]) => Promise<void>;
  retry: (fileId: string) => Promise<void>;
  retryFile: (fileId: string) => Promise<void>;
  cancelFile: (fileId: string) => void;
  cancelAll: () => void;
  stage: UploadStage;
  progress: number;
  error: string | null;
  requestId: string | null;
  isUploading: boolean;
  reset: () => void;
}

let fileIdCounter = 0;

export function useFileUpload({
  language = "fil",
  onSuccess,
  onError,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [queue, setQueue] = useState<UploadFileItem[]>([]);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const cancelledRef = useRef<Set<string>>(new Set());

  const trpcClient = useTRPCClient();

  const processFile = useCallback(
    async (item: UploadFileItem): Promise<void> => {
      if (cancelledRef.current.has(item.id)) return;

      try {
        setQueue((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, stage: "uploading", progress: 10 } : f,
          ),
        );

        const base64 = await fileToBase64(item.file);

        if (cancelledRef.current.has(item.id)) return;

        setQueue((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, stage: "processing", progress: 60 } : f,
          ),
        );

        const result = await trpcClient.documents.scanGuestImage.mutate({
          base64Image: base64,
          fileName: item.file.name,
          language: LANGUAGE_TO_DIALECT[language] as
            | "English"
            | "Filipino"
            | "Bisaya"
            | "Ilocano",
        });
        if (cancelledRef.current.has(item.id)) return;
        if (result.status === "error") {
          setQueue((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    stage: "error",
                    progress: 0,
                    error: result.error || "Scan failed",
                  }
                : f,
            ),
          );
          throw new Error(result.error || "Scan failed");
        }
        setQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  stage: "complete",
                  progress: 100,
                  requestId: result.requestId,
                }
              : f,
          ),
        );
        setRequestId(result.requestId);
        onSuccess?.(result.requestId);
      } catch (err) {
        if (cancelledRef.current.has(item.id)) return;
        setQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  stage: "error",
                  progress: 0,
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : f,
          ),
        );
      }
    },
    [trpcClient, language, onSuccess],
  );

  const upload = useCallback(
    async (files: File[]) => {
      const { valid } = await validateFiles(files);

      if (valid.length === 0) {
        setError("No valid files selected.");
        setStage("error");
        onError?.("No valid files selected.");
        return;
      }

      const newItems: UploadFileItem[] = valid.map((file) => ({
        id: `file-${++fileIdCounter}`,
        file,
        stage: "pending" as const,
        progress: 0,
      }));

      setQueue((prev) => [...prev, ...newItems]);
      setStage("uploading");
      setProgress(10);
      setError(null);

      // Process files sequentially
      for (const item of newItems) {
        if (cancelledRef.current.has(item.id)) continue;
        await processFile(item);
      }

      // Check overall status
      const allComplete = queue
        .concat(newItems)
        .every((f) => f.stage === "complete" || cancelledRef.current.has(f.id));
      const anyError = queue.concat(newItems).some((f) => f.stage === "error");

      if (anyError) {
        setStage("error");
        setError("Some files failed to upload.");
      } else if (allComplete) {
        setStage("complete");
        setProgress(100);
      }
    },
    [processFile, onError, queue],
  );

  const retryFile = useCallback(
    async (fileId: string) => {
      const item = queue.find((f) => f.id === fileId);
      if (!item) return;

      cancelledRef.current.delete(fileId);

      setQueue((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, stage: "pending" as const, progress: 0, error: undefined }
            : f,
        ),
      );

      setStage("uploading");
      setError(null);

      await processFile(item);
    },
    [queue, processFile],
  );

  const cancelFile = useCallback((fileId: string) => {
    cancelledRef.current.add(fileId);
    setQueue((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, stage: "pending" as const, progress: 0 } : f,
      ),
    );
  }, []);

  const cancelAll = useCallback(() => {
    queue.forEach((f) => cancelledRef.current.add(f.id));
    setQueue([]);
    setStage("idle");
    setProgress(0);
  }, [queue]);

  const reset = useCallback(() => {
    cancelledRef.current.clear();
    setQueue([]);
    setStage("idle");
    setProgress(0);
    setError(null);
    setRequestId(null);
  }, []);

  const isUploading = queue.some(
    (f) =>
      f.stage === "pending" ||
      f.stage === "uploading" ||
      f.stage === "processing",
  );

  return {
    queue,
    upload,
    retry: retryFile,
    retryFile,
    cancelFile,
    cancelAll,
    stage,
    progress,
    error,
    requestId,
    isUploading,
    reset,
  };
}

export type { UseFileUploadOptions, UseFileUploadReturn };
