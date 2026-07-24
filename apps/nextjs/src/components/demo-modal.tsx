"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Sparkles, X } from "lucide-react";

import { useLanguage } from "~/providers/language-provider";
import styles from "./demo-modal.module.css";

export type DemoLanguage = "en" | "tl";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  language?: DemoLanguage;
  onLanguageChange?: (lang: DemoLanguage) => void;
}

export function DemoModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  language = "tl",
  onLanguageChange,
}: DemoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

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

  const toggleLanguage = () => {
    onLanguageChange?.(language === "tl" ? "en" : "tl");
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
                  <span>{t("demo.badge")}</span>
                </div>
                <div>
                  <h2 className={styles.title}>{title}</h2>
                  <p className={styles.description}>{description}</p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  className={styles.langToggle}
                  onClick={toggleLanguage}
                  aria-label={`Switch to ${language === "tl" ? "English" : "Tagalog"}`}
                  title={
                    language === "tl"
                      ? "Switch to English"
                      : "Mag-switch sa Tagalog"
                  }
                >
                  <Globe size={14} />
                  <span>{language === "tl" ? "EN" : "TL"}</span>
                </button>
                <button
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="Close demo"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className={styles.content}>{children}</div>

            <div className={styles.footer}>
              <p className={styles.footerText}>
                {language === "tl"
                  ? t("demo.footerTagalog")
                  : t("demo.footerEnglish")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
