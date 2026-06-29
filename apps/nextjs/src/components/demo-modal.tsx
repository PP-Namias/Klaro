"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";

import styles from "./demo-modal.module.css";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function DemoModal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: DemoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={contentRef}
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.badge}>
                  <Sparkles size={14} />
                  <span>Demo</span>
                </div>
                <div>
                  <h2 className={styles.title}>{title}</h2>
                  <p className={styles.description}>{description}</p>
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close demo"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.content}>{children}</div>

            <div className={styles.footer}>
              <p className={styles.footerText}>
                Ito ay isang demo lamang. Mag-upload ng sarili mong document
                para makita ang tunay na resulta.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
