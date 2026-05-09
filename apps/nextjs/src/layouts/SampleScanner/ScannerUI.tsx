"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Bot,
  Check,
  Focus,
  Lock,
  Paperclip,
  Scan,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

import styles from "../../app/scan/page.module.css";

type ChatMessage = {
  id: string;
  sender: "user" | "clara";
  text: string;
  image?: string;
};

export function ScannerUI() {
  const [isScanning, setIsScanning] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [scanTarget, setScanTarget] = useState<"main" | "chat">("main");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleStartScan = async (target: "main" | "chat" = "main") => {
    setScanTarget(target);
    setIsScanning(true);
    try {
      // Using getDisplayMedia for screen recording/sharing as a test fallback
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing display media:", err);
    }
  };

  const handleCancelScan = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        setIsCaptured(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
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
      image: chatAttachment || undefined,
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
  return (
    <div className={styles.scannerContainer}>
      {!isCaptured ? (
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
              {capturedImage && (
                <Image
                  src={capturedImage}
                  alt="Captured document"
                  fill
                  style={{ objectFit: "cover", borderRadius: "12px" }}
                />
              )}
            </div>
          </div>
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
                .
              </>
            )}
          </div>
        </div>

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
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className={styles.cameraFeed}
                    />
                  </>
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
              ) : !isCaptured ? (
                <div className={styles.uploadWrapper}>
                  <div className={styles.uploadBox}>
                    <button
                      className={styles.secondaryBtn}
                      onClick={triggerUpload}
                    >
                      <Paperclip size={18} /> Drag or Upload a document
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
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={chatFileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleChatFileUpload}
      />
    </div>
  );
}
