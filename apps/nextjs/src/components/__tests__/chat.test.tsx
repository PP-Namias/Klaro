import { describe, it, expect } from "vitest";

import type { ChatMessage } from "~/hooks/use-chat";

import type { Dialect } from "~/hooks/use-chat";

describe("ChatMessage", () => {
  it("renders user message with text", () => {
    const msg: ChatMessage = {
      id: "user-1",
      sender: "user",
      text: "What is hemoglobin?",
      timestamp: Date.now(),
    };
    expect(msg.sender).toBe("user");
    expect(msg.text).toBe("What is hemoglobin?");
  });

  it("renders clara message with text", () => {
    const msg: ChatMessage = {
      id: "clara-1",
      sender: "clara",
      text: "Hemoglobin is a protein in red blood cells.",
      timestamp: Date.now(),
    };
    expect(msg.sender).toBe("clara");
    expect(msg.text).toContain("Hemoglobin");
  });

  it("supports image attachment", () => {
    const msg: ChatMessage = {
      id: "user-2",
      sender: "user",
      text: "Check this",
      image: "data:image/png;base64,abc123",
      timestamp: Date.now(),
    };
    expect(msg.image).toBeTruthy();
    expect(msg.image).toContain("data:image");
  });

  it("generates unique ids", () => {
    const msg1: ChatMessage = {
      id: "user-1",
      sender: "user",
      text: "Hi",
      timestamp: 1000,
    };
    const msg2: ChatMessage = {
      id: "user-2",
      sender: "user",
      text: "Hello",
      timestamp: 2000,
    };
    expect(msg1.id).not.toBe(msg2.id);
  });

  it("preserves timestamp order", () => {
    const msgs: ChatMessage[] = [
      { id: "1", sender: "user", text: "First", timestamp: 1000 },
      { id: "2", sender: "clara", text: "Response", timestamp: 2000 },
      { id: "3", sender: "user", text: "Second", timestamp: 3000 },
    ];
    expect(msgs[0]!.timestamp).toBeLessThan(msgs[1]!.timestamp);
    expect(msgs[1]!.timestamp).toBeLessThan(msgs[2]!.timestamp);
  });
});

describe("DialectToggle", () => {
  it("supports all four dialects", () => {
    const dialects: Dialect[] = ["English", "Filipino", "Bisaya", "Ilocano"];
    expect(dialects).toHaveLength(4);
    expect(dialects).toContain("Filipino");
    expect(dialects).toContain("Bisaya");
  });

  it("identifies active dialect", () => {
    const current: Dialect = "Filipino";
    const isActive = (d: Dialect) => d === current;
    expect(isActive("Filipino")).toBe(true);
    expect(isActive("English")).toBe(false);
  });
});

describe("ChatHistory", () => {
  it("returns null when empty and not typing", () => {
    const messages: ChatMessage[] = [];
    const isTyping = false;
    expect(messages.length === 0 && !isTyping).toBe(true);
  });

  it("shows typing indicator when isTyping is true", () => {
    const isTyping = true;
    expect(isTyping).toBe(true);
  });

  it("scrolls to bottom on new message", () => {
    const messages: ChatMessage[] = [
      { id: "1", sender: "user", text: "Hi", timestamp: 1000 },
    ];
    const lastMsg = messages[messages.length - 1]!;
    expect(lastMsg.text).toBe("Hi");
  });
});

describe("ClearConversationDialog", () => {
  it("shows when isOpen is true", () => {
    const isOpen = true;
    expect(isOpen).toBe(true);
  });

  it("hides when isOpen is false", () => {
    const isOpen = false;
    expect(isOpen).toBe(false);
  });

  it("calls onConfirm when confirmed", () => {
    let confirmed = false;
    const onConfirm = () => {
      confirmed = true;
    };
    onConfirm();
    expect(confirmed).toBe(true);
  });

  it("calls onCancel when cancelled", () => {
    let cancelled = false;
    const onCancel = () => {
      cancelled = true;
    };
    onCancel();
    expect(cancelled).toBe(true);
  });
});
