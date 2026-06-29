"use client";

import React from "react";
import Image from "next/image";
import { FileText, X } from "lucide-react";

import styles from "./file-preview.module.css";

interface FilePreviewItem {
  file: File;
  previewUrl?: string;
  kind: "image" | "pdf";
}

interface FilePreviewProps {
  files: FilePreviewItem[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

export function FilePreview({ files, onRemove, disabled = false }: FilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className={styles.fileList}>
      {files.map((item, index) => (
        <div key={`${item.file.name}-${index}`} className={styles.fileItem}>
          <div className={styles.fileThumb}>
            {item.kind === "image" && item.previewUrl ? (
              <Image
                src={item.previewUrl}
                alt={item.file.name}
                fill
                style={{ objectFit: "cover", borderRadius: 8 }}
              />
            ) : (
              <FileText size={20} strokeWidth={1.5} />
            )}
          </div>
          <div className={styles.fileInfo}>
            <span className={styles.fileName}>{item.file.name}</span>
            <span className={styles.fileSize}>{formatBytes(item.file.size)}</span>
          </div>
          {!disabled && (
            <button
              className={styles.removeBtn}
              onClick={() => onRemove(index)}
              type="button"
              aria-label={`Remove ${item.file.name}`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export type { FilePreviewProps, FilePreviewItem };
