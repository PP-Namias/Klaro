"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import type { StreamMessage } from "~/hooks/use-chat-stream";
import { streamChatResponse, useGuestSession } from "~/hooks/use-chat-stream";
import { useTRPC, useTRPCClient } from "~/trpc/react";

export type Dialect = "English" | "Filipino" | "Bisaya" | "Ilocano";

export interface ChatMessage {
  id: string;
  sender: "user" | "clara";
  text: string;
  image?: string;
  timestamp: number;
}

export interface ChatScanContext {
  summary?: string;
  urgency?: "LOW" | "MODERATE" | "HIGH";
  recommendations?: string[];
}

interface UseChatOptions {
  analysisId?: string;
  dialect?: Dialect;
  /** Result of a guest scan, threaded into Clara's context when there is no analysisId. */
  scanContext?: ChatScanContext;
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
  scanContext,
  onSuccess,
  onError,
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const guestId = useGuestSession();

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
        const placeholderId = `clara-stream-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: placeholderId,
            sender: "clara",
            text: "",
            timestamp: Date.now(),
          },
        ]);

        try {
          const complete = await streamChatResponse(
            content,
            messages
              .filter((m) => m.sender === "user" || m.sender === "clara")
              .map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text,
              })),
            {
              onToken: (token) => {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === placeholderId
                      ? { ...msg, text: msg.text + token }
                      : msg,
                  ),
                );
              },
            },
            image,
            guestId ? { threadId: guestId } : undefined,
          );

          const assistantMsg: ChatMessage = {
            id: placeholderId,
            sender: "clara",
            text:
              complete.answer ||
              "I can help explain what you scanned and suggest the next best step.",
            timestamp: Date.now(),
          };
          setMessages((prev) =>
            prev.map((msg) => (msg.id === placeholderId ? assistantMsg : msg)),
          );
          setIsTyping(false);
          onSuccess?.(assistantMsg);
        } catch {
          setMessages((prev) => prev.filter((msg) => msg.id !== placeholderId));

          // Streaming failed. Guests have no authenticated procedure to fall
          // back to, so retry over the public one before giving up on them.
          try {
            const result = await trpcClient.chat.sendGuestMessage.mutate({
              guestId: guestId ?? `guest-${Date.now()}`,
              content,
              dialect,
              ...(scanContext ? { scanContext } : {}),
              history: messages
                .filter((m) => m.sender === "user" || m.sender === "clara")
                .slice(-20)
                .map((m) => ({
                  role: (m.sender === "user" ? "user" : "assistant") as
                    | "user"
                    | "assistant",
                  content: m.text,
                })),
            });

            const assistantMsg: ChatMessage = {
              id: `clara-${Date.now()}`,
              sender: "clara",
              text: result.content,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setIsTyping(false);
            onSuccess?.(assistantMsg);
          } catch (guestErr) {
            const fallbackMsg: ChatMessage = {
              id: `clara-${Date.now()}`,
              sender: "clara",
              text: "I can help explain what you scanned and suggest the next best step. Could you try asking again?",
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, fallbackMsg]);
            setIsTyping(false);
            const message =
              guestErr instanceof Error
                ? guestErr.message
                : "Clara is unavailable";
            setError(message);
            onError?.(message);
          }
        }
        return;
      }

      try {
        const historyForModel: StreamMessage[] = messages
          .filter((m) => m.sender === "user" || m.sender === "clara")
          .map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          }));

        const placeholderId = `clara-stream-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: placeholderId,
            sender: "clara",
            text: "",
            timestamp: Date.now(),
          },
        ]);

        try {
          const complete = await streamChatResponse(
            content,
            historyForModel,
            {
              onToken: (token) => {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === placeholderId
                      ? { ...msg, text: msg.text + token }
                      : msg,
                  ),
                );
              },
            },
            image,
          );

          const assistantMsg: ChatMessage = {
            id: placeholderId,
            sender: "clara",
            text:
              complete.answer ||
              "I can help explain what you scanned and suggest the next best step.",
            timestamp: Date.now(),
          };
          setMessages((prev) =>
            prev.map((msg) => (msg.id === placeholderId ? assistantMsg : msg)),
          );
          setIsTyping(false);
          onSuccess?.(assistantMsg);
        } catch {
          setMessages((prev) => prev.filter((msg) => msg.id !== placeholderId));
          await sendMessageMutation.mutateAsync({
            analysisId,
            content,
            dialect,
          });
        }
      } catch {
        // Error handled in onError callback
      }
    },
    [
      analysisId,
      dialect,
      guestId,
      messages,
      onError,
      onSuccess,
      scanContext,
      sendMessageMutation,
      trpcClient,
    ],
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
