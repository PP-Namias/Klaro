"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Bot,
  Check,
  Focus,
  Lock,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

import styles from "../../app/scan/page.module.css";

interface ChatMessage {
  id: string;
  sender: "user" | "clara";
  text: string;
  image?: string;
}

interface ScanAsset {
  id: string;
  file: File;
  previewUrl: string;
}

export function ScannerUI() {
  const [isScanning, setIsScanning] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanAssets, setScanAssets] = useState<ScanAsset[]>([]);
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [scanTarget, setScanTarget] = useState<"main" | "chat">("main");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const primaryPreview = capturedImage ?? scanAssets[0]?.previewUrl ?? null;
  const showUploadAction = !isScanning && !isCaptured;

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "auto",
    });
  };

  useEffect(() => {
    if (messages.length > 0 || isScanning || isTyping) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isScanning, isTyping]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const normalizeFiles = (files: File[]) =>
    files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

  const addScanAssets = (files: File[]) => {
    const nextAssets = normalizeFiles(files);
    if (nextAssets.length === 0) return;

    setScanAssets((prev) => {
      const seen = new Set(prev.map((asset) => asset.id));
      const merged = [...prev];

      nextAssets.forEach((asset) => {
        if (seen.has(asset.id)) {
          URL.revokeObjectURL(asset.previewUrl);
        } else {
          merged.push(asset);
          seen.add(asset.id);
        }
      });

      return merged;
    });

    setIsCaptured(true);
  };

  const handleStartScan = async (target: "main" | "chat" = "main") => {
    setScanTarget(target);
    setIsScanning(true);
    try {
      // Use the device camera (front-facing by default) so users can point
      // the camera at the person/document. Prefer front camera for "focus on her".
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // attempt to play the video
        void videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing display media:", err);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addScanAssets(files);
  };

  const handleCancelScan = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const removeScanAsset = (assetId: string) => {
    setScanAssets((prev) => {
      const asset = prev.find((item) => item.id === assetId);
      if (asset) {
        URL.revokeObjectURL(asset.previewUrl);
      }
      return prev.filter((item) => item.id !== assetId);
    });
  };

  const clearScanAssets = () => {
    setScanAssets((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    setCapturedImage(null);
    setIsCaptured(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    addScanAssets(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setChatAttachment(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerChatUpload = () => {
    chatFileInputRef.current?.click();
  };

  const handleSend = () => {
    if (!chatInput.trim() && !chatAttachment) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: chatInput,
      image: chatAttachment ?? undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setChatAttachment(null);

    // Simulate Clara reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "clara",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
      ]);
    }, 1500);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/png");

        if (scanTarget === "main") {
          setCapturedImage(imageData);
          setIsCaptured(true);
        } else {
          setChatAttachment(imageData);
        }

        setIsScanning(false);

        // Stop stream
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      scanAssets.forEach((asset) => URL.revokeObjectURL(asset.previewUrl));
    };
  }, [scanAssets]);

  return (
    <section
      className={styles.scannerContainer}
      aria-label="Scan document workspace"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isCaptured ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <h1 className={styles.title}>
            Scan Your Results. Understand Them Instantly.
          </h1>
          <p className={styles.subtitle}>
            Upload your medical documents and get clear explanations
            <br />
            then ask <span className={styles.claraText}>Clara</span> anything
          </p>
          {isDragging && (
            <div style={{ marginTop: 12, color: "#0369a1" }}>
              Drop 1 or more images here to upload
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <h1 className={styles.placeholderTitle}>
            Patient's medical document
          </h1>
          <div className={styles.centeredImageContainer}>
            <div className={styles.centeredImage}>
              {primaryPreview && (
                <Image
                  src={primaryPreview}
                  alt="Selected document preview"
                  fill
                  style={{ objectFit: "cover", borderRadius: "12px" }}
                />
              )}
            </div>
          </div>
          {scanAssets.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                width: "min(100%, 920px)",
                borderRadius: 16,
                padding: "1rem",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{scanAssets.length} image{scanAssets.length > 1 ? "s" : ""} ready</strong>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    Drag more pages in, or remove ones you don’t need before scanning.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearScanAssets}
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "inherit",
                    borderRadius: 999,
                    padding: "0.5rem 0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Clear all
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 12,
                }}
              >
                {scanAssets.map((asset) => (
                  <div
                    key={asset.id}
                    style={{
                      position: "relative",
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      minHeight: 140,
                    }}
                  >
                    <Image
                      src={asset.previewUrl}
                      alt={asset.file.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeScanAsset(asset.id)}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        border: 0,
                        borderRadius: 999,
                        width: 28,
                        height: 28,
                        background: "rgba(0,0,0,0.65)",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      aria-label={`Remove ${asset.file.name}`}
                    >
                      ×
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: "0.7rem",
                        background:
                          "linear-gradient(180deg, transparent, rgba(0,0,0,0.7))",
                        color: "#fff",
                        fontSize: 12,
                      }}
                    >
                      {asset.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!isScanning && !isCaptured && (
        <motion.div 
          className={styles.cardGrid}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          <div className={styles.scanCard}>
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
          </div>

          <div className={styles.scanCard}>
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
          </div>

          <div className={styles.scanCard}>
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
          </div>

          <div className={styles.scanCard}>
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
          </div>
        </motion.div>
      )}

      <motion.div
        className={`${styles.workspaceWrapper} ${isScanning || isCaptured ? styles.workspaceExpanded : ""}`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
      >
        <div
          className={`${styles.claraChatWrapper} ${isCaptured ? styles.claraCaptured : ""}`}
        >
          <div className={styles.claraChatAvatar}>
            <Image
              src="/clara.png"
              alt="Clara"
              fill
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
            <div className={styles.chatClaraStatus}></div>
          </div>
          <div className={styles.claraChatBubble}>
            {isCaptured ? (
              <span>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </span>
            ) : (
              <>
                Hi! <span className={styles.mediumText}>Start Scanning</span> or{" "}
                <span className={styles.mediumText}>Upload a document</span> and{" "}
                <span className={styles.mediumText}>
                  ask me a health question
                </span>
                {"."}
              </>
            )}
          </div>
        </div>

        {scanAssets.length > 0 && (
          <div
            style={{
              width: "100%",
              margin: "1rem 0 0",
              padding: "1rem",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Selected pages</div>
                <strong>{scanAssets.length} image{scanAssets.length > 1 ? "s" : ""}</strong>
              </div>
              <button
                type="button"
                onClick={clearScanAssets}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "transparent",
                  color: "inherit",
                  borderRadius: 999,
                  padding: "0.45rem 0.85rem",
                  cursor: "pointer",
                }}
              >
                Clear queue
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {scanAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => removeScanAsset(asset.id)}
                  style={{
                    minWidth: 104,
                    maxWidth: 104,
                    padding: 0,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.18)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  aria-label={`Remove ${asset.file.name}`}
                >
                  <div style={{ position: "relative", aspectRatio: "4 / 5" }}>
                    <Image
                      src={asset.previewUrl}
                      alt={asset.file.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ padding: "0.55rem 0.6rem", fontSize: 11, lineHeight: 1.25, color: "#fff" }}>
                    {asset.file.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className={styles.chatHistory}>
            {messages.map((msg) => (
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
                      style={{ objectFit: "cover", borderRadius: "50%" }}
                    />
                    <div className={styles.chatClaraStatus}></div>
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
                        style={{ objectFit: "cover", borderRadius: "12px" }}
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
            {isTyping && (
              <div className={styles.claraChatWrapper}>
                <div className={styles.claraChatAvatar}>
                  <Image
                    src="/clara.png"
                    alt="Clara"
                    fill
                    style={{ objectFit: "cover", borderRadius: "50%" }}
                  />
                  <div className={styles.chatClaraStatus}></div>
                </div>
                <div className={styles.claraChatBubble}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: "180px" }} />
          </div>
        )}

        <div style={{ flexGrow: 1 }} />

        <div
          className={`${styles.bottomSectionWrapper} ${isCaptured ? styles.stickyInputWrapper : ""} ${isCaptured ? styles.capturedBottomSection : ""}`}
        >
          {chatAttachment && (
            <div
              className={styles.imagePreviewContainer}
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                marginBottom: "0.5rem",
                paddingLeft: 0,
              }}
            >
              <div className={styles.imagePreview}>
                <Image
                  src={chatAttachment}
                  alt="Chat attachment"
                  fill
                  style={{ objectFit: "cover", borderRadius: "8px" }}
                />
                <button
                  className={styles.removeImageBtn}
                  onClick={() => setChatAttachment(null)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div
            className={`${styles.scannerWorkspace} ${isScanning || isCaptured ? styles.scannerWorkspaceExpanded : ""} ${isScanning ? styles.workspaceScanning : ""} ${isCaptured && !isScanning ? styles.workspaceCaptured : ""}`}
            style={{ marginTop: 0 }}
          >
            {(!isCaptured || isScanning) && (
              <div
                className={`${styles.scannerBox} ${isScanning ? styles.scannerBoxExpanded : ""}`}
              >
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

                {isScanning && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={styles.cameraFeed}
                  >
                    <track
                      kind="captions"
                      label="Camera preview"
                      srcLang="en"
                      src="data:text/vtt,WEBVTT%0A%0A00:00.000%20--%3E%2000:10.000%0ACamera%20preview"
                      default
                    />
                  </video>
                )}

                {!isScanning && (
                  <button
                    className={styles.primaryBtn}
                    onClick={() => handleStartScan("main")}
                  >
                    <Focus size={18} color="#ffffff" /> Take a photo & Scan here
                  </button>
                )}
              </div>
            )}

            {isCaptured && !isScanning && (
              <div className={styles.chatInputWrapper}>
                <div className={styles.chatInputContainer}>
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
                      >
                        <Paperclip size={20} />
                      </button>
                      <button
                        className={styles.chatIconBtn}
                        onClick={() => handleStartScan("chat")}
                      >
                        <Focus size={20} />
                      </button>
                    </div>
                    <button
                      className={`${styles.chatSendBtn} ${chatInput.trim() || chatAttachment ? styles.chatSendBtnActive : ""}`}
                      onClick={handleSend}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.bottomActionsWrapper}>
              {isScanning ? (
                <div className={styles.scanningButtons}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={handleCancelScan}
                  >
                    <X size={18} /> Cancel
                  </button>
                  <button className={styles.primaryBtn} onClick={handleCapture}>
                    <Check size={18} /> Scan image
                  </button>
                </div>
              ) : null}

              {showUploadAction ? (
                <div className={styles.uploadWrapper}>
                  <div className={styles.uploadBox}>
                    <button
                      className={styles.secondaryBtn}
                      onClick={triggerUpload}
                    >
                      <Paperclip size={18} /> Drag or Upload 1+ images
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.footerNotes}>
              <div className={styles.footerNoteItem}>
                <Bot size={16} /> Analysis & Chat
              </div>
              <div className={styles.footerNoteItem}>
                <Lock size={16} /> Your data is private and secure.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        multiple
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={chatFileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleChatFileUpload}
      />
    </section>
  );
}
