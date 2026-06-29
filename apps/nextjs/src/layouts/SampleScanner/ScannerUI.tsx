"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Bot, Check, Focus, Lock, Paperclip, Send, X } from "lucide-react";
import { motion } from "framer-motion";

import { DropZone } from "~/components/drop-zone";
import {
  FilePreview,
  type FilePreviewItem,
} from "~/components/file-preview";
import { UploadProgress } from "~/components/upload-progress";
import { DropOverlay } from "~/components/drop-overlay";
import { DemoModal } from "~/components/demo-modal";
import { DemoLabResults } from "~/components/demo/lab-results";
import { DemoPrescription } from "~/components/demo/prescription";
import { DemoDischarge } from "~/components/demo/discharge";
import { DemoOtherDoc } from "~/components/demo/other-doc";
import { useFileUpload } from "~/hooks/use-file-upload";
import { useChat } from "~/hooks/use-chat";
import {
  validateFiles,
  createPreviewUrl,
  getFileKind,
} from "~/lib/file-validation";
import {
  type DemoType,
  getDemoData,
  getDemoTitle,
  getDemoDescription,
  labResultsDemo,
  prescriptionDemo,
  dischargeDemo,
  xrayReportDemo,
} from "~/data/demo-index";
import styles from "../../app/scan/page.module.css";

interface ScannerUIProps {
  initialAnalysisId?: string;
}

export function ScannerUI({ initialAnalysisId }: ScannerUIProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FilePreviewItem[]>([]);
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [uploadedRequestId, setUploadedRequestId] = useState<string | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeDemoType, setActiveDemoType] = useState<DemoType>("lab");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const fileUpload = useFileUpload({
    onSuccess: (requestId) => {
      setUploadedRequestId(requestId);
    },
  });

  const chat = useChat({
    analysisId: initialAnalysisId || uploadedRequestId || undefined,
  });

  useEffect(() => {
    if (chat.messages.length === 0 && !isScanning && !chat.isTyping) return;
    const timer = globalThis.setTimeout(() => {
      globalThis.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "auto",
      });
    }, 50);
    return () => globalThis.clearTimeout(timer);
  }, [chat.messages, isScanning, chat.isTyping]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      const stream = video?.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera not available or permission denied", error);
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    await startCamera();
  };

  const handleCancelScan = () => {
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsScanning(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
    handleCancelScan();
  };

  const openDemo = useCallback((type: DemoType) => {
    setActiveDemoType(type);
    setDemoModalOpen(true);
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    const { valid, invalid } = validateFiles(files);

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

  const handleUploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    const files = selectedFiles.map((item) => item.file);
    await fileUpload.upload(files);
  }, [selectedFiles, fileUpload]);

  const handleChatFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setChatAttachment(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const triggerChatUpload = () => {
    chatFileInputRef.current?.click();
  };

  const handleSend = () => {
    if (!chatInput.trim() && !chatAttachment) return;
    chat.sendMessage(chatInput, chatAttachment ?? undefined);
    setChatInput("");
    setChatAttachment(null);
  };

  // Global drag handlers for DropOverlay
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((c) => c + 1);
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((c) => {
        const next = c - 1;
        if (next === 0) setIsDragging(false);
        return next;
      });
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setDragCounter(0);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) {
        handleFilesSelected(files);
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
  }, [handleFilesSelected]);

  let scannerPreview: ReactNode = null;
  if (isScanning) {
    scannerPreview = (
      <video ref={videoRef} autoPlay playsInline className={styles.cameraFeed}>
        <track
          kind="captions"
          label="Camera preview"
          srcLang="en"
          src="data:text/vtt,WEBVTT%0A%0A00:00.000%20--%3E%2000:10.000%0ACamera%20preview"
          default
        />
      </video>
    );
  } else if (capturedImage) {
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
  const hasAnalysisId = !!initialAnalysisId || !!uploadedRequestId;

  return (
    <>
      <DropOverlay isVisible={isDragging} />

      <section ref={sectionRef} className={styles.scannerContainer} aria-label="Scan document workspace">
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
          <h1 className={styles.title}>
            Scan Your Results. Understand Them Instantly.
          </h1>
          <p className={styles.subtitle}>
            Upload your medical documents and get clear explanations
            <br />
            then ask <span className={styles.claraText}>Clara</span> anything
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
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDemo("lab"); } }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>Lab Results</h3>
            <p className={styles.scanCardDesc}>
              Blood tests, CBC, cholesterol, and more
            </p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/1.png"
                alt="Lab Results"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 500, marginTop: 4 }}>Click to see demo</span>
          </div>

          <div
            className={styles.scanCard}
            onClick={() => openDemo("prescription")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDemo("prescription"); } }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>Prescriptions</h3>
            <p className={styles.scanCardDesc}>
              Understand medicines and instructions clearly
            </p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/2.png"
                alt="Prescriptions"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 500, marginTop: 4 }}>Click to see demo</span>
          </div>

          <div
            className={styles.scanCard}
            onClick={() => openDemo("discharge")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDemo("discharge"); } }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>
              Discharge
              <br />
              Summaries
            </h3>
            <p className={styles.scanCardDesc}>
              Break down hospital notes and next steps
            </p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/3.png"
                alt="Discharge Summaries"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 500, marginTop: 4 }}>Click to see demo</span>
          </div>

          <div
            className={styles.scanCard}
            onClick={() => openDemo("other")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDemo("other"); } }}
            style={{ cursor: "pointer" }}
          >
            <h3 className={styles.scanCardTitle}>
              Other
              <br />
              Documents
            </h3>
            <p className={styles.scanCardDesc}>
              Upload any medical file and we'll analyze it
            </p>
            <div className={styles.scanCardImageContainer}>
              <Image
                src="/scan/4.png"
                alt="Other Documents"
                fill
                style={{ objectFit: "contain", objectPosition: "bottom" }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 500, marginTop: 4 }}>Click to see demo</span>
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
                <span>
                  Great — your document has been scanned! Ask me anything about
                  your results.
                </span>
              ) : capturedImage ? (
                <span>Great — your photo is ready for the scan step.</span>
              ) : (
                <>
                  Hi! <span className={styles.mediumText}>Start Scanning</span>{" "}
                  or <span className={styles.mediumText}>Upload a document</span>{" "}
                  and{" "}
                  <span className={styles.mediumText}>
                    ask me a health question
                  </span>
                  .
                </>
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

              {!isScanning && !capturedImage && (
                <button
                  className={styles.primaryBtn}
                  onClick={handleStartScan}
                >
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

            {/* Upload success message */}
            {uploadComplete && uploadedRequestId && (
              <div
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "12px 16px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Check size={18} style={{ color: "#22c55e" }} />
                <span
                  style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "0.9rem",
                    color: "#166534",
                  }}
                >
                  Document scanned successfully! Ask Clara about your results.
                </span>
              </div>
            )}

            {/* Error with retry */}
            {fileUpload.stage === "error" && (
              <div
                style={{
                  width: "100%",
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  className={styles.secondaryBtn}
                  onClick={() => {
                    fileUpload.reset();
                    setSelectedFiles([]);
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            <div className={styles.footerNotes}>
              <div className={styles.footerNoteItem}>
                <Bot size={16} /> Analysis & Chat
              </div>
              <div className={styles.footerNoteItem}>
                <Lock size={16} /> Your data is private and secure.
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {isScanning ? (
                <>
                  <button
                    className={styles.secondaryBtn}
                    onClick={handleCancelScan}
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button
                    className={styles.primaryBtn}
                    onClick={handleCapture}
                  >
                    <Check size={18} /> Scan image
                  </button>
                </>
              ) : null}
            </div>

            {/* Chat messages */}
            {chat.messages.length > 0 && (
              <div className={styles.chatHistory}>
                {chat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.sender === "user"
                        ? styles.userChatWrapper
                        : styles.claraChatWrapper
                    }
                  >
                    {msg.sender === "clara" && (
                      <div className={styles.claraChatAvatar}>
                        <Image
                          src="/clara.png"
                          alt="Clara"
                          fill
                          style={{
                            objectFit: "cover",
                            borderRadius: "50%",
                          }}
                        />
                        <div className={styles.chatClaraStatus} />
                      </div>
                    )}
                    <div
                      className={
                        msg.sender === "user"
                          ? styles.userMessageContentWrapper
                          : styles.claraMessageContentWrapper
                      }
                    >
                      {msg.image && (
                        <div className={styles.chatMessageImage}>
                          <Image
                            src={msg.image}
                            alt="Attached"
                            fill
                            style={{
                              objectFit: "cover",
                              borderRadius: "12px",
                            }}
                          />
                        </div>
                      )}
                      {msg.text && (
                        <div
                          className={
                            msg.sender === "user"
                              ? styles.userChatBubble
                              : styles.claraChatBubble
                          }
                        >
                          <span>{msg.text}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chat.isTyping && (
                  <div className={styles.claraChatWrapper}>
                    <div className={styles.claraChatAvatar}>
                      <Image
                        src="/clara.png"
                        alt="Clara"
                        fill
                        style={{
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                      />
                      <div className={styles.chatClaraStatus} />
                    </div>
                    <div className={styles.claraChatBubble}>
                      <div className={styles.typingIndicator}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ height: 180 }} />
              </div>
            )}

            <div style={{ flexGrow: 1 }} />

            {/* Chat input */}
            <div
              className={styles.bottomSectionWrapper}
              style={{ marginTop: 16 }}
            >
              <div className={styles.chatInputWrapper}>
                <div className={styles.chatInputContainer}>
                  {chatAttachment && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #eaeaea",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={chatAttachment}
                          alt="Attachment preview"
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          flex: 1,
                        }}
                      >
                        Image attached
                      </span>
                      <button
                        onClick={() => setChatAttachment(null)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#999",
                          padding: 4,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <textarea
                    className={styles.chatTextArea}
                    placeholder="Upload a medical document or ask a health question..."
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }
                    }}
                  />
                  <div className={styles.chatInputActions}>
                    <div className={styles.chatInputLeftActions}>
                      <button
                        className={styles.chatIconBtn}
                        onClick={triggerChatUpload}
                        type="button"
                      >
                        <Paperclip size={20} />
                      </button>
                      <button
                        className={styles.chatIconBtn}
                        onClick={handleStartScan}
                        type="button"
                      >
                        <Focus size={20} />
                      </button>
                    </div>
                    <button
                      className={`${styles.chatSendBtn} ${chatInput.trim() || chatAttachment ? styles.chatSendBtnActive : ""}`}
                      onClick={handleSend}
                      type="button"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
        <input
          type="file"
          ref={chatFileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleChatFileUpload}
        />
      </section>

      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title={getDemoTitle(activeDemoType)}
        description={getDemoDescription(activeDemoType)}
      >
        {activeDemoType === "lab" && <DemoLabResults data={labResultsDemo} />}
        {activeDemoType === "prescription" && <DemoPrescription data={prescriptionDemo} />}
        {activeDemoType === "discharge" && <DemoDischarge data={dischargeDemo} />}
        {activeDemoType === "other" && <DemoOtherDoc data={xrayReportDemo} />}
      </DemoModal>
    </>
  );
}
