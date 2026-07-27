export interface ChatMessage {
  id: string;
  analysisId: string;
  role: "user" | "assistant";
  content: string;
  dialect?: string;
  createdAt: Date;
}

export interface ChatHistoryOptions {
  limit?: number;
  offset?: number;
}

const chatStore = new Map<string, ChatMessage[]>();

export function saveChatMessage(
  analysisId: string,
  role: "user" | "assistant",
  content: string,
  dialect?: string,
): ChatMessage {
  const message: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    analysisId,
    role,
    content,
    dialect,
    createdAt: new Date(),
  };

  const messages = chatStore.get(analysisId) || [];
  messages.push(message);
  chatStore.set(analysisId, messages);

  return message;
}

export function getChatHistory(
  analysisId: string,
  options: ChatHistoryOptions = {},
): ChatMessage[] {
  const { limit = 50, offset = 0 } = options;
  const messages = chatStore.get(analysisId) || [];
  return messages.slice(offset, offset + limit);
}

export function getRecentMessages(
  analysisId: string,
  count = 5,
): ChatMessage[] {
  const messages = chatStore.get(analysisId) || [];
  return messages.slice(-count);
}

export function clearChatHistory(analysisId: string): boolean {
  return chatStore.delete(analysisId);
}

export function getChatStats(analysisId: string): {
  totalMessages: number;
  firstMessage?: Date;
  lastMessage?: Date;
} {
  const messages = chatStore.get(analysisId) || [];

  return {
    totalMessages: messages.length,
    firstMessage: messages[0]?.createdAt,
    lastMessage: messages[messages.length - 1]?.createdAt,
  };
}

export function exportChatHistory(analysisId: string): string {
  const messages = chatStore.get(analysisId) || [];
  return JSON.stringify(
    {
      analysisId,
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      })),
    },
    null,
    2,
  );
}

export function deleteMessage(analysisId: string, messageId: string): boolean {
  const messages = chatStore.get(analysisId);
  if (!messages) return false;

  const index = messages.findIndex((m) => m.id === messageId);
  if (index === -1) return false;

  messages.splice(index, 1);
  chatStore.set(analysisId, messages);
  return true;
}

export function clearAllChatHistory(): void {
  chatStore.clear();
}

export function getMessageCount(): number {
  let count = 0;
  for (const messages of chatStore.values()) {
    count += messages.length;
  }
  return count;
}
