"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import type { ChatMessage } from "~/hooks/use-chat";
import styles from "../../app/scan/page.module.css";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";

interface ChatHistoryProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isLoading?: boolean;
  claraAvatarUrl?: string;
  quickActions?: { label: string; prompt: string }[];
  onQuickAction?: (prompt: string) => void;
}

function TypingIndicator() {
  return (
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
        <div className={styles.typingIndicator}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: "1rem", textAlign: "center", color: "#999" }}>
      Loading conversation...
    </div>
  );
}

export function ChatHistory({
  messages,
  isTyping,
  isLoading = false,
  claraAvatarUrl,
  quickActions = [],
  onQuickAction,
}: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (isLoading) {
    return (
      <div className={styles.chatHistory}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (messages.length === 0 && !isTyping) {
    return quickActions.length > 0 ? (
      <div className={styles.chatHistory}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.5rem" }}>
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => onQuickAction?.(qa.prompt)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "9999px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {qa.label}
            </button>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>
    ) : null;
  }

  return (
    <div className={styles.chatHistory}>
      {messages.map((msg) => (
        <ChatMessageComponent
          key={msg.id}
          message={msg}
          claraAvatarUrl={claraAvatarUrl}
        />
      ))}
      {isTyping && <TypingIndicator />}
      {quickActions.length > 0 && !isTyping && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.5rem" }}>
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => onQuickAction?.(qa.prompt)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "9999px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {qa.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ height: 180 }} />
      <div ref={bottomRef} />
    </div>
  );
}
