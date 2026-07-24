"use client";

import Image from "next/image";

import type { ChatMessage as ChatMessageType } from "~/hooks/use-chat";

interface ChatMessageProps {
  message: ChatMessageType;
  claraAvatarUrl?: string;
}

export function ChatMessage({
  message,
  claraAvatarUrl = "/clara.png",
}: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div className={isUser ? "userChatWrapper" : "claraChatWrapper"}>
      {!isUser && (
        <div className="claraChatAvatar">
          <Image
            src={claraAvatarUrl}
            alt="Clara"
            fill
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
          <div className="chatClaraStatus" />
        </div>
      )}
      <div
        className={
          isUser ? "userMessageContentWrapper" : "claraMessageContentWrapper"
        }
      >
        {message.image && (
          <div className="chatMessageImage">
            <Image
              src={message.image}
              alt="Attached"
              fill
              style={{ objectFit: "cover", borderRadius: "12px" }}
            />
          </div>
        )}
        {message.text && (
          <div className={isUser ? "userChatBubble" : "claraChatBubble"}>
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
