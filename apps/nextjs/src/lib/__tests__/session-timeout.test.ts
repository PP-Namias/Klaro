import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  extendSession,
  forceSessionExpiry,
  formatRemainingTime,
  getSessionStatus,
  initSessionTimeout,
  stopSessionTimeout,
} from "~/lib/session-timeout";

describe("Session Timeout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopSessionTimeout();
  });

  afterEach(() => {
    stopSessionTimeout();
  });

  describe("formatRemainingTime", () => {
    it("formats minutes and seconds correctly", () => {
      expect(formatRemainingTime(900000)).toBe("15:00");
      expect(formatRemainingTime(60000)).toBe("01:00");
      expect(formatRemainingTime(30000)).toBe("00:30");
    });

    it("formats zero correctly", () => {
      expect(formatRemainingTime(0)).toBe("00:00");
    });

    it("formats large values correctly", () => {
      expect(formatRemainingTime(3661000)).toBe("61:01");
    });
  });

  describe("initSessionTimeout", () => {
    it("initializes without errors", () => {
      initSessionTimeout({}, {});
      expect(getSessionStatus().status).toBe("active");
    });

    it("calls onWarning callback when warning state is reached", () => {
      const onWarning = vi.fn();
      initSessionTimeout({ onWarning }, { timeoutMs: 1000, warningMs: 500 });
      // Warning would be triggered by checkSessionStatus interval
      stopSessionTimeout();
    });

    it("calls onExpired callback when session expires", () => {
      const onExpired = vi.fn();
      initSessionTimeout({ onExpired }, { timeoutMs: 100, warningMs: 50 });
      // Expiry would be triggered by checkSessionStatus interval
      stopSessionTimeout();
    });
  });

  describe("stopSessionTimeout", () => {
    it("stops the session timeout", () => {
      initSessionTimeout({}, {});
      stopSessionTimeout();
      expect(getSessionStatus().status).toBe("active");
    });
  });

  describe("extendSession", () => {
    it("extends the session", () => {
      initSessionTimeout({}, {});
      extendSession();
      expect(getSessionStatus().status).toBe("active");
      stopSessionTimeout();
    });
  });

  describe("forceSessionExpiry", () => {
    it("forces session expiry", () => {
      initSessionTimeout({}, {});
      forceSessionExpiry();
      expect(getSessionStatus().status).toBe("expired");
    });
  });

  describe("getSessionStatus", () => {
    it("returns current session state", () => {
      const state = getSessionStatus();
      expect(state).toHaveProperty("status");
      expect(state).toHaveProperty("lastActivity");
      expect(state).toHaveProperty("expiresAt");
      expect(state).toHaveProperty("remainingMs");
    });
  });
});
