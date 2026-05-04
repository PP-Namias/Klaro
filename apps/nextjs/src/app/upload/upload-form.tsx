"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@klaro/ui/button";

import styles from "./page.module.css";

type SelectedFile = {
  file: File;
  previewUrl?: string;
  kind: "image" | "pdf";
};

const maxFileSize = 10 * 1024 * 1024;
const acceptedTypes = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
]);

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
    const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;

    setError(null);
    setSelected({ file, previewUrl, kind });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    selectFile(files[0]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
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
          ) : (
            <div className={styles.upload__previewPlaceholder}>
              PDF preview will render here.
            </div>
          )}
          <div className={styles.upload__previewActions}>
            <Button type="button" variant="outline" onClick={clearSelection}>
              Remove file
            </Button>
            <Button type="button" disabled className={styles.upload__submit}>
              Upload and analyze
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
