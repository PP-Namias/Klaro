"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@klaro/ui/button";
import { Input } from "@klaro/ui/input";
import { toast } from "@klaro/ui/toast";

import { useTRPC } from "~/trpc/react";
import styles from "./page.module.css";

interface SelectedFile {
  file: File;
  previewUrl?: string;
  kind: "image" | "pdf";
}

const maxFileSize = 10 * 1024 * 1024;
const acceptedTypes = new Set(["image/png", "image/jpeg", "application/pdf"]);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part after the comma
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const trpc = useTRPC();

  // Use the public guest scan endpoint
  const scanGuestImage = useMutation(
    trpc.documents.scanGuestImage.mutationOptions({
      onSuccess: (result) => {
        setIsProcessing(false);
        if (result.status === "error") {
          setUploadStatus(result.error || "Scan failed");
          toast.error(result.error || "Scan failed");
        } else {
          // Save result to sessionStorage for results page
          sessionStorage.setItem("scanResult", JSON.stringify(result));
          toast.success("Document scanned successfully!");
          // Navigate to results page
          router.push(`/scan?id=${result.requestId}`);
        }
      },
      onError: (err) => {
        setIsProcessing(false);
        const message = "Could not scan the document. Please try again.";
        setUploadStatus(message);
        toast.error(message);
      },
    }),
  );

  useEffect(() => {
    return () => {
      if (selected?.previewUrl) {
        URL.revokeObjectURL(selected.previewUrl);
      }
    };
  }, [selected]);

  const clearSelection = () => {
    if (selected?.previewUrl) {
      URL.revokeObjectURL(selected.previewUrl);
    }
    setSelected(null);
    setError(null);
    setUploadStatus(null);
  };

  const selectFile = (file: File) => {
    if (!acceptedTypes.has(file.type)) {
      setError("Only PDF, PNG, or JPG files are allowed.");
      setSelected(null);
      return;
    }

    if (file.size > maxFileSize) {
      setError("File size must be under 10 MB.");
      setSelected(null);
      return;
    }

    const kind = file.type === "application/pdf" ? "pdf" : "image";
    const previewUrl = URL.createObjectURL(file);

    setError(null);
    setSelected({ file, previewUrl, kind });
    setUploadStatus(null);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file) selectFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!selected || selected.kind !== "image") {
      setError("Please select an image file to scan.");
      return;
    }

    setIsProcessing(true);
    setUploadStatus("Processing image...");

    try {
      const base64 = await fileToBase64(selected.file);
      scanGuestImage.mutate({
        base64Image: base64,
        fileName: selected.file.name,
        language: "English",
      });
    } catch (err) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "Failed to read file";
      setError(msg);
      setUploadStatus(msg);
    }
  };
    const file = files[0];
    if (file) selectFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleSubmit = () => {
    if (!selected) return;
    uploadDocument.mutate({
      fileName: selected.file.name,
      fileSize: selected.file.size,
      mimeType: selected.file.type,
    });
  };

  return (
    <div className={styles.upload__form}>
      <div
        className={
          isDragging ? styles.upload__dropzoneActive : styles.upload__dropzone
        }
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleUploadClick();
          }
        }}
      >
        <div className={styles.upload__dropzoneInner}>
          <span className={styles.upload__dropzoneLabel}>Drop target</span>
          <h2 className={styles.upload__dropzoneTitle}>
            Drop a PNG or JPG image here.
          </h2>
          <p className={styles.upload__dropzoneCopy}>
            We will show a preview before you submit the file for scanning with AI.
          </p>
          <div className={styles.upload__dropzoneTags}>
            <span className={styles.upload__dropzoneTag}>PNG</span>
            <span className={styles.upload__dropzoneTag}>JPG</span>
            <span className={styles.upload__dropzoneTag}>Max 10 MB</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className={styles.upload__dropzoneButton}
            onClick={handleUploadClick}
            disabled={isProcessing}
          >
            Select file
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className={styles.upload__fileInput}
          onChange={(event) => handleFiles(event.target.files)}
          disabled={isProcessing}
        />
      </div>

      {error ? <p className={styles.upload__error}>{error}</p> : null}
      {uploadStatus ? (
        <p className={styles.upload__status}>{uploadStatus}</p>
      ) : null}

      {selected && selected.kind === "image" ? (
        <div className={styles.upload__preview}>
          <div className={styles.upload__previewMeta}>
            <div>
              <p className={styles.upload__previewName}>{selected.file.name}</p>
              <p className={styles.upload__previewSize}>
                {formatBytes(selected.file.size)}
              </p>
            </div>
            <span className={styles.upload__previewBadge}>
              {selected.kind.toUpperCase()}
            </span>
          </div>
          {selected.previewUrl ? (
            <img
              src={selected.previewUrl}
              alt="Selected medical document"
              className={styles.upload__previewImage}
            />
          ) : null}
          <div className={styles.upload__previewActions}>
            <Button
              type="button"
              variant="outline"
              onClick={clearSelection}
              disabled={isProcessing}
            >
              Remove file
            </Button>
            <Button
              type="button"
              className={styles.upload__submit}
              disabled={!selected || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? "Scanning..." : "Scan with AI"}
            </Button>
          </div>
        </div>
      ) : (
        <p className={styles.upload__hint}>
          Add an image file to see the preview and submit for analysis.
        </p>
      )}
    </div>
  );
}
