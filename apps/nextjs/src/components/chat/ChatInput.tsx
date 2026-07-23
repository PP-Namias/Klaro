"use client";

import { useRef, useState } from "react";
import { Focus, Paperclip, Send, X } from "lucide-react";

import type { Dialect } from "~/hooks/use-chat";

interface ChatInputProps {
  onSend: (content: string, image?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onCameraClick?: () => void;
  dialect?: Dialect;
  imageAttachedLabel?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Upload a medical document or ask a health question...",
  onCameraClick,
  imageAttachedLabel = "Image attached",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!input.trim() && !attachment) return;
    onSend(input, attachment ?? undefined);
    setInput("");
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const hasContent = input.trim().length > 0 || attachment !== null;

  return (
    <>
      <div className="chatInputContainer">
        {attachment && (
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
                src={attachment}
                alt="Attachment preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <span style={{ fontSize: "0.8rem", color: "#666", flex: 1 }}>
              {imageAttachedLabel}
            </span>
            <button
              onClick={() => setAttachment(null)}
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
          className="chatTextArea"
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
        <div className="chatInputActions">
          <div className="chatInputLeftActions">
            <button
              className="chatIconBtn"
              onClick={triggerFileUpload}
              type="button"
              disabled={disabled}
            >
              <Paperclip size={20} />
            </button>
            {onCameraClick && (
              <button
                className="chatIconBtn"
                onClick={onCameraClick}
                type="button"
                disabled={disabled}
              >
                <Focus size={20} />
              </button>
            )}
          </div>
          <button
            className={`chatSendBtn ${hasContent ? "chatSendBtnActive" : ""}`}
            onClick={handleSend}
            type="button"
            disabled={disabled || (!input.trim() && !attachment)}
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
