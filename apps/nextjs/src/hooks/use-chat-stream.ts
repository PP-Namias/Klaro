"use client";

import { useCallback, useRef, useState } from "react";

export interface StreamMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamMetadata {
  threadId?: string;
  tenantId?: string;
}

export interface StreamTokenEvent {
  event: "token";
  token: string;
}

export interface StreamCompleteEvent {
  event: "complete";
  answer: string;
  followUpQuestions?: string[];
}

export interface StreamErrorEvent {
  error: string;
  code?: number;
}

export interface StreamHandlers {
  onToken?: (token: string) => void;
  onComplete?: (event: StreamCompleteEvent) => void;
  onError?: (error: string) => void;
}

export function parseSsePayload(
  line: string,
):
  | ({ event: "token" } & StreamTokenEvent)
  | ({ event: "complete" } & StreamCompleteEvent)
  | StreamErrorEvent
  | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;

  const json = trimmed.slice("data:".length).trim();
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (typeof parsed.error === "string") {
      return { error: parsed.error, code: Number(parsed.code) || undefined };
    }
    if (parsed.event === "token" && typeof parsed.token === "string") {
      return { event: "token", token: parsed.token };
    }
    if (parsed.event === "complete") {
      return {
        event: "complete",
        answer: String(parsed.answer ?? ""),
        followUpQuestions: Array.isArray(parsed.followUpQuestions)
          ? parsed.followUpQuestions.map(String)
          : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const GUEST_SESSION_KEY = "chat_guest_id";

export function useGuestSession(): string | null {
  const [guestId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    let currentGuest = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!currentGuest) {
      currentGuest = `guest_${crypto.randomUUID()}`;
      sessionStorage.setItem(GUEST_SESSION_KEY, currentGuest);
    }
    return currentGuest;
  });

  return guestId;
}

export async function streamChatResponse(
  content: string,
  history: StreamMessage[],
  handlers: StreamHandlers = {},
  image?: string,
  metadata?: StreamMetadata,
): Promise<StreamCompleteEvent> {
  const payload: Record<string, unknown> = { content, history };
  if (image) payload.image = image;
  if (metadata) payload.metadata = metadata;

  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    throw new Error("Streaming request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let complete: StreamCompleteEvent | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const block of events) {
      const payload = parseSsePayload(block);
      if (!payload) continue;

      if ("error" in payload) {
        handlers.onError?.(payload.error);
        throw new Error(payload.error);
      }
      if (payload.event === "token") {
        handlers.onToken?.(payload.token);
      }
      if (payload.event === "complete") {
        complete = payload;
      }
    }
  }

  if (!complete) {
    throw new Error("Stream ended without a complete event");
  }

  handlers.onComplete?.(complete);
  return complete;
}

export interface ChatStreamMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatStreamMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<ChatStreamMessage[]>([]);

  const sendMessage = useCallback(async (content: string, image?: string) => {
    if (!content.trim() && !image) return;

    const userMsg: ChatStreamMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      image,
    };
    const assistantMsgId = crypto.randomUUID();
    const history = historyRef.current;

    setMessages((prev) => [...prev, userMsg]);
    setError(null);
    setIsTyping(true);

    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);

    const historyForModel: StreamMessage[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content },
    ];

    try {
      const complete = await streamChatResponse(
        content,
        historyForModel,
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: msg.content + token }
                  : msg,
              ),
            );
          },
          onError: (message) => setError(message),
        },
        image,
      );

      const assistantMsg: ChatStreamMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: complete.answer,
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMsgId ? assistantMsg : msg)),
      );
      historyRef.current = [...history, userMsg, assistantMsg];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send";
      setError(message);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
    } finally {
      setIsTyping(false);
    }
  }, []);

  return { messages, sendMessage, isTyping, error };
}
