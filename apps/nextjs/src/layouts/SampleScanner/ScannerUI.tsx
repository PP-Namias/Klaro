"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Bot, Check, Focus, Lock, Paperclip, Send, X } from "lucide-react";
import { motion } from "framer-motion";

import styles from "../../app/scan/page.module.css";

interface ChatMessage {
  id: string;
  sender: "user" | "clara";
  text: string;
  image?: string;
}

export function ScannerUI() {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const hasUploadQueue = selectedCount > 0;

  useEffect(() => {
    if (messages.length === 0 && !isScanning && !isTyping) return;

    const timer = globalThis.setTimeout(() => {
      globalThis.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
    }, 50);

    return () => globalThis.clearTimeout(timer);
  }, [messages, isScanning, isTyping]);

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

  const addSelectedImages = (files: FileList | File[]) => {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    setSelectedCount((current) => current + images.length);
  };

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
    scannerPreview = <Image src={capturedImage} alt="Captured scan" fill style={{ objectFit: "cover" }} />;
  }

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addSelectedImages(event.dataTransfer.files);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    addSelectedImages(event.target.files ?? []);
    event.target.value = "";
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

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

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: chatInput,
      image: chatAttachment ?? undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setChatAttachment(null);
    setIsTyping(true);

    globalThis.setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          sender: "clara",
          text: "I can help explain what you scanned and suggest the next best step.",
        },
      ]);
    }, 1200);
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

  return (
    <section
      className={styles.scannerContainer}
      aria-label="Scan document workspace"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <h1 className={styles.title}>Scan Your Results. Understand Them Instantly.</h1>
        <p className={styles.subtitle}>
          Upload your medical documents and get clear explanations
          <br />
          then ask <span className={styles.claraText}>Clara</span> anything
        </p>
        {isDragging && (
          <div style={{ marginTop: 12, color: "#0369a1", fontWeight: 500 }}>
            Drop 1 or more images here to upload
          </div>
        )}
      </motion.div>

      <motion.div
        className={styles.cardGrid}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      >
        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Lab Results</h3>
          <p className={styles.scanCardDesc}>Blood tests, CBC, cholesterol, and more</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/1.png" alt="Lab Results" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Prescriptions</h3>
          <p className={styles.scanCardDesc}>Understand medicines and instructions clearly</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/2.png" alt="Prescriptions" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>
            Discharge
            <br />
            Summaries
          </h3>
          <p className={styles.scanCardDesc}>Break down hospital notes and next steps</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/3.png" alt="Discharge Summaries" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>
            Other
            <br />
            Documents
          </h3>
          <p className={styles.scanCardDesc}>Upload any medical file and we'll analyze it</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/4.png" alt="Other Documents" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
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
            <Image src="/clara.png" alt="Clara" fill style={{ objectFit: "cover", borderRadius: "50%" }} />
            <div className={styles.chatClaraStatus} />
          </div>
          <div className={styles.claraChatBubble}>
            {capturedImage ? (
              <span>Great — your photo is ready for the scan step.</span>
            ) : (
              <>
                Hi! <span className={styles.mediumText}>Start Scanning</span> or{" "}
                <span className={styles.mediumText}>Upload a document</span> and{" "}
                <span className={styles.mediumText}>ask me a health question</span>.
              </>
            )}
          </div>
        </div>

        <div className={styles.scannerWorkspace} style={{ marginTop: 0 }}>
          <div className={styles.scannerBox}>
            <svg className={`${styles.scannerBracket} ${styles.bracketTopLeft}`} viewBox="0 0 40 40">
              <path d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className={`${styles.scannerBracket} ${styles.bracketTopRight}`} viewBox="0 0 40 40">
              <path d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className={`${styles.scannerBracket} ${styles.bracketBottomLeft}`} viewBox="0 0 40 40">
              <path d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className={`${styles.scannerBracket} ${styles.bracketBottomRight}`} viewBox="0 0 40 40">
              <path d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {scannerPreview}

            {!isScanning && !capturedImage && (
              <button className={styles.primaryBtn} onClick={handleStartScan}>
                <Focus size={18} color="#ffffff" /> Take a photo & Scan here
              </button>
            )}
          </div>

          <button className={styles.uploadWrapper} type="button" onClick={triggerUpload}>
            <div className={styles.uploadBox}>
              <span className={styles.secondaryBtn}>
                <Paperclip size={18} /> Drag or Upload a document
              </span>
            </div>
            {hasUploadQueue && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
                {selectedCount} image{selectedCount === 1 ? "" : "s"} selected
              </div>
            )}
          </button>

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
                <button className={styles.secondaryBtn} onClick={handleCancelScan}>
                  <X size={18} /> Cancel
                </button>
                <button className={styles.primaryBtn} onClick={handleCapture}>
                  <Check size={18} /> Scan image
                </button>
              </>
            ) : null}
          </div>

          {messages.length > 0 && (
            <div className={styles.chatHistory}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.sender === "user" ? styles.userChatWrapper : styles.claraChatWrapper}
                >
                  {msg.sender === "clara" && (
                    <div className={styles.claraChatAvatar}>
                      <Image src="/clara.png" alt="Clara" fill style={{ objectFit: "cover", borderRadius: "50%" }} />
                      <div className={styles.chatClaraStatus} />
                    </div>
                  )}
                  <div className={msg.sender === "user" ? styles.userMessageContentWrapper : styles.claraMessageContentWrapper}>
                    {msg.image && (
                      <div className={styles.chatMessageImage}>
                        <Image src={msg.image} alt="Attached" fill style={{ objectFit: "cover", borderRadius: "12px" }} />
                      </div>
                    )}
                    {msg.text && (
                      <div className={msg.sender === "user" ? styles.userChatBubble : styles.claraChatBubble}>
                        <span>{msg.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className={styles.claraChatWrapper}>
                  <div className={styles.claraChatAvatar}>
                    <Image src="/clara.png" alt="Clara" fill style={{ objectFit: "cover", borderRadius: "50%" }} />
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

          <div className={styles.bottomSectionWrapper} style={{ marginTop: 16 }}>
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
                    <button className={styles.chatIconBtn} onClick={triggerChatUpload} type="button">
                      <Paperclip size={20} />
                    </button>
                    <button className={styles.chatIconBtn} onClick={handleStartScan} type="button">
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
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" multiple onChange={handleFileUpload} />
      <input type="file" ref={chatFileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleChatFileUpload} />
    </section>
  );
}

