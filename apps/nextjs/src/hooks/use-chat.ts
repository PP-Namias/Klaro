 

"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC, useTRPCClient } from "~/trpc/react";

export type Dialect = "English" | "Filipino" | "Bisaya" | "Ilocano";

export interface ChatMessage {
  id: string;
  sender: "user" | "clara";
  text: string;
  image?: string;
  timestamp: number;
}

interface UseChatOptions {
  analysisId?: string;
  dialect?: Dialect;
  onSuccess?: (response: ChatMessage) => void;
  onError?: (error: string) => void;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string, image?: string) => Promise<void>;
  isTyping: boolean;
  error: string | null;
  clearMessages: () => Promise<void>;
  isLoadingHistory: boolean;
}

export function useChat({
  analysisId,
  dialect = "Filipino",
  onSuccess,
  onError,
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  // Load history when analysisId changes
  useEffect(() => {
    if (!analysisId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setIsLoadingHistory(true);

    const load = async () => {
      try {
        const history = await trpcClient.chat.getHistory.query({
          analysisId,
          limit: 50,
        });

        if (cancelled) return;

        const mapped: ChatMessage[] = history.map((m) => ({
          id: `${m.role}-${m.id}`,
          sender: m.role === "user" ? "user" : "clara",
          text: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        }));

        setMessages(mapped);
      } catch {
        if (!cancelled) {
          setError("Failed to load chat history");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [analysisId, trpcClient]);

  const sendMessageMutation = useMutation(
    trpc.chat.sendMessage.mutationOptions({
      onSuccess: (result) => {
        const assistantMsg: ChatMessage = {
          id: `clara-${Date.now()}`,
          sender: "clara",
          text:
            result.assistantMessage?.content ||
            "I can help explain what you scanned.",
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
        setError(err.message);
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
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            const fallbackMsg: ChatMessage = {
              id: `clara-${Date.now()}`,
              sender: "clara",
              text: "I can help explain what you scanned and suggest the next best step. Please upload a document first so I can analyze your results.",
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, fallbackMsg]);
            setIsTyping(false);
            resolve();
          }, 1200);
        });
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

  const clearMessages = useCallback(async () => {
    if (analysisId) {
      try {
        await trpcClient.chat.clearHistory.mutate({ analysisId });
      } catch {
        // Silently fail - local clear is sufficient
      }
    }
    setMessages([]);
    setError(null);
  }, [analysisId, trpcClient]);

  return {
    messages,
    sendMessage,
    isTyping,
    error,
    clearMessages,
    isLoadingHistory,
  };
}
