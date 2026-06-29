"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

interface ChatMessage {
  id: string;
  sender: "user" | "clara";
  text: string;
  image?: string;
  timestamp: number;
}

interface UseChatOptions {
  analysisId?: string;
  dialect?: string;
  onSuccess?: (response: ChatMessage) => void;
  onError?: (error: string) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string, image?: string) => Promise<void>;
  isTyping: boolean;
  error: string | null;
  clearMessages: () => void;
}

export function useChat({
  analysisId,
  dialect = "English",
  onSuccess,
  onError,
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trpc = useTRPC();

  const sendMessageMutation = useMutation(
    trpc.chat.sendMessage.mutationOptions({
      onSuccess: (result) => {
        const assistantMsg: ChatMessage = {
          id: result.assistantMessage?.id || `clara-${Date.now()}`,
          sender: "clara",
          text: result.assistantMessage?.content || result.response || "I can help explain what you scanned.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
        onSuccess?.(assistantMsg);
      },
      onError: (err) => {
        setIsTyping(false);
        const fallbackMsg: ChatMessage = {
          id: `clara-fallback-${Date.now()}`,
          sender: "clara",
          text: "I can help explain what you scanned and suggest the next best step. Could you try asking again?",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        onError?.(err.message);
      },
    }),
  );

  const sendMessage = useCallback(
    async (content: string, image?: string) => {
      if (!content.trim() && !image) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: content,
        image,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setError(null);

      if (!analysisId) {
        // No analysis ID - use local fallback response
        setTimeout(() => {
          const fallbackMsg: ChatMessage = {
            id: `clara-${Date.now()}`,
            sender: "clara",
            text: "I can help explain what you scanned and suggest the next best step. Please upload a document first so I can analyze your results.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, fallbackMsg]);
          setIsTyping(false);
        }, 1200);
        return;
      }

      try {
        await sendMessageMutation.mutateAsync({
          analysisId,
          content,
          dialect,
        });
      } catch {
        // Error handled in onError callback
      }
    },
    [analysisId, dialect, sendMessageMutation],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    isTyping,
    error,
    clearMessages,
  };
}

export type { ChatMessage, UseChatOptions, UseChatReturn };
