import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAllChatHistory,
  clearChatHistory,
  deleteMessage,
  exportChatHistory,
  getChatHistory,
  getChatStats,
  getMessageCount,
  getRecentMessages,
  saveChatMessage,
} from "../chatHistory";

describe("Chat History", () => {
  beforeEach(() => {
    clearAllChatHistory();
  });

  describe("saveChatMessage", () => {
    it("saves user message", () => {
      const msg = saveChatMessage("analysis-1", "user", "Hello");
      expect(msg.role).toBe("user");
      expect(msg.content).toBe("Hello");
      expect(msg.analysisId).toBe("analysis-1");
    });

    it("saves assistant message", () => {
      const msg = saveChatMessage("analysis-1", "assistant", "Hi there");
      expect(msg.role).toBe("assistant");
    });

    it("generates unique ID", () => {
      const msg1 = saveChatMessage("analysis-1", "user", "a");
      const msg2 = saveChatMessage("analysis-1", "user", "b");
      expect(msg1.id).not.toBe(msg2.id);
    });
  });

  describe("getChatHistory", () => {
    it("returns messages in order", () => {
      saveChatMessage("analysis-1", "user", "Hello");
      saveChatMessage("analysis-1", "assistant", "Hi");

      const history = getChatHistory("analysis-1");
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe("Hello");
      expect(history[1].content).toBe("Hi");
    });

    it("supports pagination", () => {
      for (let i = 0; i < 10; i++) {
        saveChatMessage("analysis-1", "user", `Message ${i}`);
      }

      const page = getChatHistory("analysis-1", { limit: 3, offset: 2 });
      expect(page).toHaveLength(3);
      expect(page[0].content).toBe("Message 2");
    });

    it("returns empty for unknown analysis", () => {
      expect(getChatHistory("unknown")).toHaveLength(0);
    });
  });

  describe("getRecentMessages", () => {
    it("returns last N messages", () => {
      for (let i = 0; i < 10; i++) {
        saveChatMessage("analysis-1", "user", `Message ${i}`);
      }

      const recent = getRecentMessages("analysis-1", 3);
      expect(recent).toHaveLength(3);
      expect(recent[0].content).toBe("Message 7");
    });
  });

  describe("clearChatHistory", () => {
    it("removes all messages for analysis", () => {
      saveChatMessage("analysis-1", "user", "Hello");
      expect(clearChatHistory("analysis-1")).toBe(true);
      expect(getChatHistory("analysis-1")).toHaveLength(0);
    });
  });

  describe("getChatStats", () => {
    it("returns message count", () => {
      saveChatMessage("analysis-1", "user", "Hello");
      saveChatMessage("analysis-1", "assistant", "Hi");

      const stats = getChatStats("analysis-1");
      expect(stats.totalMessages).toBe(2);
    });

    it("returns timestamps", () => {
      saveChatMessage("analysis-1", "user", "Hello");
      const stats = getChatStats("analysis-1");
      expect(stats.firstMessage).toBeInstanceOf(Date);
      expect(stats.lastMessage).toBeInstanceOf(Date);
    });
  });

  describe("exportChatHistory", () => {
    it("exports as JSON", () => {
      saveChatMessage("analysis-1", "user", "Hello");
      const exported = exportChatHistory("analysis-1");
      const parsed = JSON.parse(exported);
      expect(parsed.analysisId).toBe("analysis-1");
      expect(parsed.messages).toHaveLength(1);
    });
  });

  describe("deleteMessage", () => {
    it("removes specific message", () => {
      const msg = saveChatMessage("analysis-1", "user", "Hello");
      expect(deleteMessage("analysis-1", msg.id)).toBe(true);
      expect(getChatHistory("analysis-1")).toHaveLength(0);
    });

    it("returns false for unknown message", () => {
      expect(deleteMessage("analysis-1", "unknown")).toBe(false);
    });
  });

  describe("getMessageCount", () => {
    it("returns total message count", () => {
      saveChatMessage("analysis-1", "user", "Hello");
      saveChatMessage("analysis-2", "user", "Hi");
      expect(getMessageCount()).toBe(2);
    });
  });
});
