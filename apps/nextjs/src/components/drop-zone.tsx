"use client";

import { useRef, useState } from "react";
import { FileImage, Upload } from "lucide-react";

import styles from "./drop-zone.module.css";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

export function DropZone({
  onFilesSelected,
  accept = "image/*,.pdf",
  multiple = true,
  disabled = false,
  className,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [_dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragCounter((c) => c + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragCounter((c) => {
      const next = c - 1;
      if (next === 0) setIsDragOver(false);
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = "";
  };

  return (
    <div
      className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ""} ${disabled ? styles.dropZoneDisabled : ""} ${className ?? ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className={styles.hiddenInput}
        tabIndex={-1}
      />
      <div className={styles.dropZoneContent}>
        <div
          className={`${styles.iconWrapper} ${isDragOver ? styles.iconWrapperActive : ""}`}
        >
          {isDragOver ? (
            <FileImage size={32} strokeWidth={1.5} />
          ) : (
            <Upload size={32} strokeWidth={1.5} />
          )}
        </div>
        <p className={styles.dropText}>
          {isDragOver
            ? "Drop files here"
            : "Drag & drop files or click to browse"}
        </p>
        <p className={styles.dropSubtext}>PNG, JPG, WebP, PDF up to 50MB</p>
      </div>
    </div>
  );
}

export { formatBytes };
export type { DropZoneProps };
