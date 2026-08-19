"use client";

import { useRef, useState } from "react";
import { Focus, Paperclip, Send, X } from "lucide-react";

import type { Dialect } from "~/hooks/use-chat";
import styles from "../../app/scan/page.module.css";

interface ChatInputProps {
  onSend: (content: string, image?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onCameraClick?: () => void;
  dialect?: Dialect;
  imageAttachedLabel?: string;
  externalAttachment?: string | null;
  onExternalAttachmentClear?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Upload a medical document or ask a health question...",
  onCameraClick,
  imageAttachedLabel = "Image attached",
  externalAttachment = null,
  onExternalAttachmentClear,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveAttachment = externalAttachment ?? attachment;

  const clearAttachment = () => {
    if (externalAttachment) {
      onExternalAttachmentClear?.();
    } else {
      setAttachment(null);
    }
  };

  const handleSend = () => {
    if (!input.trim() && !effectiveAttachment) return;
    onSend(input, effectiveAttachment ?? undefined);
    setInput("");
    setAttachment(null);
    onExternalAttachmentClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const attachFiles = (files: FileList | File[]) => {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) attachFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    attachFiles(e.dataTransfer.files);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const hasContent = input.trim().length > 0 || effectiveAttachment !== null;

  return (
    <>
      <div
        className={styles.chatInputContainer}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDrop}
      >
        {effectiveAttachment && (
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
              <img
                src={effectiveAttachment}
                alt="Attachment preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <span style={{ fontSize: "0.8rem", color: "#666", flex: 1 }}>
              {imageAttachedLabel}
            </span>
            <button
              onClick={clearAttachment}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                padding: 4,
              }}
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <textarea
          className={styles.chatTextArea}
          placeholder={placeholder}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
          disabled={disabled}
        />
        <div className={styles.chatInputActions}>
          <div className={styles.chatInputLeftActions}>
            <button
              className={styles.chatIconBtn}
              onClick={triggerFileUpload}
              type="button"
              disabled={disabled}
            >
              <Paperclip size={20} />
            </button>
            {onCameraClick && (
              <button
                className={styles.chatIconBtn}
                onClick={onCameraClick}
                type="button"
                disabled={disabled}
              >
                <Focus size={20} />
              </button>
            )}
          </div>
          <button
            className={`${styles.chatSendBtn} ${hasContent ? styles.chatSendBtnActive : ""}`}
            onClick={handleSend}
            type="button"
            disabled={disabled || (!input.trim() && !effectiveAttachment)}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileUpload}
      />
    </>
  );
}
