"use client";

import React, { useEffect, useState } from "react";
import { FileImage, Upload } from "lucide-react";

import styles from "./drop-overlay.module.css";

interface DropOverlayProps {
  isVisible: boolean;
}

export function DropOverlay({ isVisible }: DropOverlayProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.overlayVisible : styles.overlayHidden}`}
    >
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <div className={styles.iconCircle}>
            <FileImage size={48} strokeWidth={1.5} />
          </div>
          <div className={styles.uploadArrow}>
            <Upload size={20} strokeWidth={2} />
          </div>
        </div>
        <p className={styles.text}>Drop your medical documents here</p>
        <p className={styles.subtext}>PNG, JPG, WebP, or PDF — up to 50MB</p>
      </div>
    </div>
  );
}
