"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

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

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const trpc = useTRPC();
  const uploadDocument = useMutation(
    trpc.documents.upload.mutationOptions({
      onSuccess: (result) => {
        setUploadStatus("Document queued for analysis.");
        toast.success("Document queued for analysis.");
        if (result?.analysisId) {
          toast.message(`Analysis created: ${result.analysisId}`);
        }
      },
      onError: (err) => {
        const message =
          err.data?.code === "UNAUTHORIZED"
            ? "Sign in to upload documents."
            : "Could not upload the document.";
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
    setPdfPage(1);
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
    setPdfPage(1);
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
            Drop a PDF or image here.
          </h2>
          <p className={styles.upload__dropzoneCopy}>
            We will show a preview before you submit the file for analysis.
          </p>
          <div className={styles.upload__dropzoneTags}>
            <span className={styles.upload__dropzoneTag}>PNG</span>
            <span className={styles.upload__dropzoneTag}>JPG</span>
            <span className={styles.upload__dropzoneTag}>PDF</span>
            <span className={styles.upload__dropzoneTag}>Max 10 MB</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className={styles.upload__dropzoneButton}
            onClick={handleUploadClick}
          >
            Select file
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          className={styles.upload__fileInput}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {error ? <p className={styles.upload__error}>{error}</p> : null}
      {uploadStatus ? (
        <p className={styles.upload__status}>{uploadStatus}</p>
      ) : null}

      {selected ? (
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
          {selected.kind === "image" && selected.previewUrl ? (
            <img
              src={selected.previewUrl}
              alt="Selected document preview"
              className={styles.upload__previewImage}
            />
          ) : selected.previewUrl ? (
            <div className={styles.upload__pdfPanel}>
              <div className={styles.upload__pdfControls}>
                <label
                  className={styles.upload__pdfLabel}
                  htmlFor="upload-pdf-page"
                >
                  Page to analyze
                </label>
                <Input
                  id="upload-pdf-page"
                  type="number"
                  min={1}
                  value={pdfPage}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setPdfPage(
                      Number.isFinite(nextValue) && nextValue > 0
                        ? nextValue
                        : 1,
                    );
                  }}
                  className={styles.upload__pdfInput}
                />
              </div>
              <embed
                src={`${selected.previewUrl}#page=${pdfPage}`}
                type="application/pdf"
                className={styles.upload__pdfPreview}
              />
            </div>
          ) : null}
          <div className={styles.upload__previewActions}>
            <Button type="button" variant="outline" onClick={clearSelection}>
              Remove file
            </Button>
            <Button
              type="button"
              className={styles.upload__submit}
              disabled={!selected || uploadDocument.isPending}
              onClick={handleSubmit}
            >
              {uploadDocument.isPending ? "Queueing..." : "Upload and analyze"}
            </Button>
          </div>
        </div>
      ) : (
        <p className={styles.upload__hint}>
          Add a file to see the preview and validation summary.
        </p>
      )}
    </div>
  );
}
