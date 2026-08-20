"use client";

/* eslint-disable @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-empty-function */
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bot, Focus, Lock, Paperclip, Trash2 } from "lucide-react";

import { LANGUAGE_TO_DIALECT } from "@klaro/validators/language";

import type { DemoLanguage } from "~/components/demo-modal";
import type { FilePreviewItem } from "~/components/file-preview";
import type { DemoType } from "~/data/demo-index";
import type { Dialect } from "~/hooks/use-chat";
import {
  CameraCapture,
  ChatHistory,
  ChatInput,
  ClearConversationDialog,
  DialectToggle,
} from "~/components/chat";
import { DemoModal } from "~/components/demo-modal";
import { DemoDischarge } from "~/components/demo/discharge";
import { DemoLabResults } from "~/components/demo/lab-results";
import { DemoOtherDoc } from "~/components/demo/other-doc";
import { DemoPrescription } from "~/components/demo/prescription";
import { DropOverlay } from "~/components/drop-overlay";
import { DropZone } from "~/components/drop-zone";
import { FilePreview } from "~/components/file-preview";
import { UploadComplete } from "~/components/upload-complete";
import { UploadError } from "~/components/upload-error";
import { UploadProgress } from "~/components/upload-progress";
import {
  dischargeDemo,
  getDemoDescription,
  getDemoTitle,
  labResultsDemo,
  prescriptionDemo,
  xrayReportDemo,
} from "~/data/demo-index";
import { useChat } from "~/hooks/use-chat";
import { useFileUpload } from "~/hooks/use-file-upload";
import {
  createPreviewUrl,
  getFileKind,
  validateFiles,
} from "~/lib/file-validation";
import { useLanguage } from "~/providers/language-provider";
import styles from "../../app/scan/page.module.css";

interface ScannerUIProps {
  initialAnalysisId?: string;
}

export function ScannerUI({ initialAnalysisId }: ScannerUIProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [_dragCounter, setDragCounter] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FilePreviewItem[]>([]);
  const [uploadedRequestId, setUploadedRequestId] = useState<string | null>(
    null,
  );
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeDemoType, setActiveDemoType] = useState<DemoType>("lab");
  const [demoLanguage, setDemoLanguage] = useState<DemoLanguage>("tl");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const { t, language } = useLanguage();

  const sectionRef = useRef<HTMLElement>(null);

  const fileUpload = useFileUpload({
    language,
    onSuccess: (requestId) => {
      setUploadedRequestId(requestId);
    },
  });

  const [chatDialect, setChatDialect] = useState<Dialect>(
    LANGUAGE_TO_DIALECT[language] as Dialect,
  );

  const chat = useChat({
    analysisId: initialAnalysisId || uploadedRequestId || undefined,
    dialect: chatDialect,
  });

  useEffect(() => {
    if (chat.messages.length === 0 && !isCameraOpen && !chat.isTyping) return;
    const timer = globalThis.setTimeout(() => {
      globalThis.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "auto",
      });
    }, 50);
    return () => globalThis.clearTimeout(timer);
  }, [chat.messages, isCameraOpen, chat.isTyping]);

  const openCamera = useCallback(() => {
    setIsCameraOpen(true);
  }, []);

  const handleCameraCapture = useCallback((imageData: string) => {
    setCapturedImage(imageData);
    setIsCameraOpen(false);
  }, []);

  const openDemo = useCallback((type: DemoType) => {
    setActiveDemoType(type);
    setDemoModalOpen(true);
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const { valid, invalid } = await validateFiles(files);

    if (invalid.length > 0) {
      alert(invalid.map((i) => i.error).join("\n"));
    }

    const newItems: FilePreviewItem[] = valid.map((file) => ({
      file,
      previewUrl: createPreviewUrl(file),
      kind: getFileKind(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const item = prev[index];
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const readFileAsDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleGlobalDrop = useCallback(
    async (files: File[]) => {
      const { valid, invalid } = await validateFiles(files);

      if (invalid.length > 0) {
        alert(invalid.map((i) => i.error).join("\n"));
      }
      if (valid.length === 0) return;

      const imageFiles = valid.filter((f) => f.type.startsWith("image/"));
      const otherFiles = valid.filter((f) => !f.type.startsWith("image/"));
      const firstImage = imageFiles[0];

      if (firstImage) {
        try {
          const dataUrl = await readFileAsDataUrl(firstImage);
          setCapturedImage(dataUrl);
          otherFiles.push(...imageFiles.slice(1));
        } catch {
          otherFiles.push(...imageFiles);
        }
      }

      if (otherFiles.length > 0) {
        const newItems: FilePreviewItem[] = otherFiles.map((file) => ({
          file,
          previewUrl: createPreviewUrl(file),
          kind: getFileKind(file),
        }));
        setSelectedFiles((prev) => [...prev, ...newItems]);
      }
    },
    [readFileAsDataUrl],
  );

  const handleUploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    const files = selectedFiles.map((item) => item.file);
    await fileUpload.upload(files);
  }, [selectedFiles, fileUpload]);

  const handleSend = (content: string, image?: string) => {
    void chat.sendMessage(content, image);
  };

  const handleClearConversation = async () => {
    await chat.clearMessages();
    setClearDialogOpen(false);
  };

  // Global drag handlers for DropOverlay
  useEffect(() => {
    const dragCarriesFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const handleDragEnter = (e: DragEvent) => {
      if (!dragCarriesFiles(e)) return;
      e.preventDefault();
      setDragCounter((c) => c + 1);
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      if (!dragCarriesFiles(e)) return;
      e.preventDefault();
      setDragCounter((c) => {
        const next = c - 1;
        if (next === 0) setIsDragging(false);
        return next;
      });
    };
    const handleDragOver = (e: DragEvent) => {
      if (!dragCarriesFiles(e)) return;
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setDragCounter(0);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) {
        void handleGlobalDrop(files);
      }
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [handleGlobalDrop]);

  let scannerPreview: ReactNode = null;
  if (capturedImage) {
    scannerPreview = (
      <Image
        src={capturedImage}
        alt="Captured scan"
        fill
        style={{ objectFit: "cover" }}
      />
    );
  }

  const hasUploadQueue = selectedFiles.length > 0;
  const uploadComplete = fileUpload.stage === "complete";
  const _hasAnalysisId = !!initialAnalysisId || !!uploadedRequestId;

  return (
    <>
      <DropOverlay isVisible={isDragging} />

      <section
        ref={sectionRef}
        className={styles.scannerContainer}
        aria-label="Scan document workspace"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1 className={styles.title}>{t("scan.title")}</h1>
          <p className={styles.subtitle}>
            {t("scan.subtitle")}
            <br />
            {t("scan.askClara")}
          </p>
        </motion.div>

        <motion.div
          className={styles.cardGrid}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          <div
            className={styles.scanCard}
            onClick={() => openDemo("lab")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDemo("lab");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>{t("card.labResults")}</h3>
            <p className={styles.scanCardDesc}>{t("card.labResults.desc")}</p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/1.png"
                alt="Lab Results"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "#6366f1",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {t("card.demo")}
            </span>
          </div>

          <div
            className={styles.scanCard}
            onClick={() => openDemo("prescription")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDemo("prescription");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>{t("card.prescriptions")}</h3>
            <p className={styles.scanCardDesc}>
              {t("card.prescriptions.desc")}
            </p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/2.png"
                alt="Prescriptions"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "#6366f1",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {t("card.demo")}
            </span>
          </div>

          <div
            className={styles.scanCard}
            onClick={() => openDemo("discharge")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDemo("discharge");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>
              {t("card.discharge")}
              <br />
              {t("card.dischargeSummaries")}
            </h3>
            <p className={styles.scanCardDesc}>{t("card.discharge.desc")}</p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/3.png"
                alt="Discharge Summaries"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "#6366f1",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {t("card.demo")}
            </span>
          </div>

          <div
            className={styles.scanCard}
            onClick={() => openDemo("other")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDemo("other");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>
              {t("card.otherDocuments")}
              <br />
              {t("card.otherDocumentsLabel")}
            </h3>
            <p className={styles.scanCardDesc}>
              {t("card.otherDocuments.desc")}
            </p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/4.png"
                alt="Other Documents"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "#6366f1",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {t("card.demo")}
            </span>
          </div>
        </motion.div>

        <motion.div
          className={styles.workspaceWrapper}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        >
          <div className={styles.claraChatWrapper}>
            <div className={styles.claraChatAvatar}>
              <Image
                src="/clara.png"
                alt="Clara"
                fill
                style={{ objectFit: "cover", borderRadius: "50%" }}
              />
              <div className={styles.chatClaraStatus} />
            </div>
            <div className={styles.claraChatBubble}>
              {uploadComplete && uploadedRequestId ? (
                <span>{t("clara.greeting.scanned")}</span>
              ) : capturedImage ? (
                <span>{t("clara.greeting.ready")}</span>
              ) : (
                <>{t("clara.greeting.welcome")}</>
              )}
            </div>
          </div>

          <div className={styles.scannerWorkspace} style={{ marginTop: 0 }}>
            <div className={styles.scannerBox}>
              <svg
                className={`${styles.scannerBracket} ${styles.bracketTopLeft}`}
                viewBox="0 0 40 40"
              >
                <path
                  d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                className={`${styles.scannerBracket} ${styles.bracketTopRight}`}
                viewBox="0 0 40 40"
              >
                <path
                  d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                className={`${styles.scannerBracket} ${styles.bracketBottomLeft}`}
                viewBox="0 0 40 40"
              >
                <path
                  d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                className={`${styles.scannerBracket} ${styles.bracketBottomRight}`}
                viewBox="0 0 40 40"
              >
                <path
                  d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {scannerPreview}

              {!capturedImage && (
                <button className={styles.primaryBtn} onClick={openCamera}>
                  <Focus size={18} color="#ffffff" /> Take a photo & Scan here
                </button>
              )}
            </div>

            {/* DropZone for file upload */}
            {!uploadComplete && !fileUpload.isUploading && (
              <div style={{ width: "100%", marginTop: 16 }}>
                <DropZone
                  onFilesSelected={handleFilesSelected}
                  multiple={true}
                />
              </div>
            )}

            {/* Selected files preview + upload button */}
            {hasUploadQueue && !uploadComplete && (
              <div
                style={{
                  width: "100%",
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <FilePreview
                  files={selectedFiles}
                  onRemove={handleRemoveFile}
                  disabled={fileUpload.isUploading}
                />
                <button
                  className={styles.primaryBtn}
                  onClick={handleUploadFiles}
                  disabled={fileUpload.isUploading}
                  style={{ marginTop: 12, width: "100%", maxWidth: 320 }}
                >
                  <Paperclip size={18} />
                  {fileUpload.isUploading
                    ? "Uploading..."
                    : `Scan ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}`}
                </button>
              </div>
            )}

            {/* Upload progress */}
            <UploadProgress
              stage={fileUpload.stage}
              progress={fileUpload.progress}
              error={fileUpload.error ?? undefined}
            />

            {/* Upload complete */}
            {uploadComplete && uploadedRequestId && (
              <UploadComplete
                items={[
                  {
                    fileName: selectedFiles[0]?.file.name ?? "Document",
                    fileType:
                      selectedFiles[0]?.kind === "pdf" ? "pdf" : "image",
                    fileSize: selectedFiles[0]?.file.size ?? 0,
                    analysisId: uploadedRequestId,
                  },
                ]}
                onViewAnalysis={(id) => {
                  window.location.href = `/scan?id=${id}`;
                }}
              />
            )}

            {/* Upload errors */}
            {fileUpload.stage === "error" &&
              fileUpload.queue.filter((f) => f.stage === "error").length >
                0 && (
                <UploadError
                  errors={fileUpload.queue
                    .filter((f) => f.stage === "error" && f.error)
                    .map((f) => ({
                      fileName: f.file.name,
                      message: f.error!,
                      type: "network" as const,
                    }))}
                  onDismiss={() => {}}
                  onRetry={(fileName) => {
                    const item = fileUpload.queue.find(
                      (f) => f.file.name === fileName,
                    );
                    if (item) void fileUpload.retry(item.id);
                  }}
                />
              )}

            <div className={styles.footerNotes}>
              <div className={styles.footerNoteItem}>
                <Bot size={16} /> {t("scan.analysisChat")}
              </div>
              <div className={styles.footerNoteItem}>
                <Lock size={16} /> {t("scan.privacy")}
              </div>
            </div>

            {/* Chat messages */}
            <ChatHistory
              messages={chat.messages}
              isTyping={chat.isTyping}
              isLoading={chat.isLoadingHistory}
              quickActions={[
                { label: t("chat.quick.lab"), prompt: t("chat.quick.lab") },
                {
                  label: t("chat.quick.prescription"),
                  prompt: t("chat.quick.prescription"),
                },
                {
                  label: t("chat.quick.discharge"),
                  prompt: t("chat.quick.discharge"),
                },
                { label: t("chat.quick.next"), prompt: t("chat.quick.next") },
              ]}
              onQuickAction={handleSend}
            />

            <div style={{ flexGrow: 1 }} />

            {/* Dialect toggle + Clear */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
                padding: "0 4px",
              }}
            >
              <DialectToggle current={chatDialect} onChange={setChatDialect} />
              {chat.messages.length > 0 && (
                <button
                  onClick={() => setClearDialogOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#999",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-geist)",
                    padding: "4px 8px",
                    borderRadius: 6,
                  }}
                  type="button"
                  title="Clear conversation"
                >
                  <Trash2 size={14} /> Clear
                </button>
              )}
            </div>

            {/* Chat input */}
            <div
              className={styles.bottomSectionWrapper}
              style={{ marginTop: 8 }}
            >
              <div className={styles.chatInputWrapper}>
                <ChatInput
                  onSend={handleSend}
                  disabled={chat.isTyping}
                  placeholder={t("chat.placeholder")}
                  onCameraClick={openCamera}
                  imageAttachedLabel={t("chat.imageAttached")}
                  externalAttachment={capturedImage}
                  onExternalAttachmentClear={() => setCapturedImage(null)}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <ClearConversationDialog
          isOpen={clearDialogOpen}
          onConfirm={handleClearConversation}
          onCancel={() => setClearDialogOpen(false)}
        />

        </section>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title={getDemoTitle(activeDemoType)}
        description={getDemoDescription(activeDemoType)}
        language={demoLanguage}
        onLanguageChange={setDemoLanguage}
      >
        {activeDemoType === "lab" && (
          <DemoLabResults data={labResultsDemo} language={demoLanguage} />
        )}
        {activeDemoType === "prescription" && (
          <DemoPrescription data={prescriptionDemo} language={demoLanguage} />
        )}
        {activeDemoType === "discharge" && (
          <DemoDischarge data={dischargeDemo} language={demoLanguage} />
        )}
        {activeDemoType === "other" && (
          <DemoOtherDoc data={xrayReportDemo} language={demoLanguage} />
        )}
      </DemoModal>
    </>
  );
}
