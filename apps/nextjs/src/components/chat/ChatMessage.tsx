"use client";

import Image from "next/image";

import type { ChatMessage as ChatMessageType } from "~/hooks/use-chat";
import styles from "../../app/scan/page.module.css";

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
    <div className={isUser ? styles.userChatWrapper : styles.claraChatWrapper}>
      {!isUser && (
        <div className={styles.claraChatAvatar}>
          <Image
            src={claraAvatarUrl}
            alt="Clara"
            fill
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
          <div className={styles.chatClaraStatus} />
        </div>
      )}
      <div
        className={
          isUser
            ? styles.userMessageContentWrapper
            : styles.claraMessageContentWrapper
        }
      >
        {message.image && (
          <div className={styles.chatMessageImage}>
            <Image
              src={message.image}
              alt="Attached"
              fill
              style={{ objectFit: "cover", borderRadius: "12px" }}
            />
          </div>
        )}
        {message.text && (
          <div
            className={isUser ? styles.userChatBubble : styles.claraChatBubble}
          >
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
