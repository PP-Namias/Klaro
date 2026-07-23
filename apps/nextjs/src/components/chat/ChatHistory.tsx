"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import type { ChatMessage } from "~/hooks/use-chat";

import { ChatMessage as ChatMessageComponent } from "./ChatMessage";

interface ChatHistoryProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isLoading?: boolean;
  claraAvatarUrl?: string;
}

function TypingIndicator() {
  return (
    <div className="claraChatWrapper">
      <div className="claraChatAvatar">
        <Image
          src="/clara.png"
          alt="Clara"
          fill
          style={{ objectFit: "cover", borderRadius: "50%" }}
        />
        <div className="chatClaraStatus" />
      </div>
      <div className="claraChatBubble">
        <div className="typingIndicator">
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
}: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (isLoading) {
    return (
      <div className="chatHistory">
        <LoadingSkeleton />
      </div>
    );
  }

  if (messages.length === 0 && !isTyping) return null;

  return (
    <div className="chatHistory">
      {messages.map((msg) => (
        <ChatMessageComponent
          key={msg.id}
          message={msg}
          claraAvatarUrl={claraAvatarUrl}
        />
      ))}
      {isTyping && <TypingIndicator />}
      <div style={{ height: 180 }} />
      <div ref={bottomRef} />
    </div>
  );
}
