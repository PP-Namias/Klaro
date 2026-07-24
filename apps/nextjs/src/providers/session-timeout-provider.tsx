"use client";

/* eslint-disable react-hooks/set-state-in-effect */

/**
 * Session Timeout Provider
 *
 * React context provider for HIPAA-compliant session timeout.
 * Tracks user activity and manages session state.
 */
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { SessionState, SessionStatus } from "~/lib/session-timeout";
import {
  extendSession,
  formatRemainingTime,
  getSessionStatus,
  initSessionTimeout,
  stopSessionTimeout,
} from "~/lib/session-timeout";

interface SessionTimeoutContextValue {
  status: SessionStatus;
  remainingMs: number;
  formattedRemaining: string;
  isWarning: boolean;
  isExpired: boolean;
  extendSession: () => void;
  forceLogout: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextValue | null>(
  null,
);

interface SessionTimeoutProviderProps {
  children: ReactNode;
  onLogout?: () => void;
  timeoutMs?: number;
  warningMs?: number;
}

export function SessionTimeoutProvider({
  children,
  onLogout,
  timeoutMs,
  warningMs,
}: SessionTimeoutProviderProps) {
  const [state, setState] = useState<SessionState>(getSessionStatus());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    initSessionTimeout(
      {
        onWarning: (newState) => {
          setState(newState);
        },
        onExpired: () => {
          setState(getSessionStatus());
          onLogout?.();
        },
        onActivity: (newState) => {
          setState(newState);
        },
        onExtend: () => {
          setState(getSessionStatus());
        },
      },
      {
        ...(timeoutMs !== undefined && { timeoutMs }),
        ...(warningMs !== undefined && { warningMs }),
      },
    );

    setIsInitialized(true);

    return () => {
      stopSessionTimeout();
    };
  }, [isInitialized, onLogout, timeoutMs, warningMs]);

  // Update remaining time display
  useEffect(() => {
    if (state.status === "expired") return;

    const timer = setInterval(() => {
      setState(getSessionStatus());
    }, 1000);

    return () => clearInterval(timer);
  }, [state.status]);

  const handleExtendSession = useCallback(() => {
    extendSession();
    setState(getSessionStatus());
  }, []);

  const handleForceLogout = useCallback(() => {
    stopSessionTimeout();
    onLogout?.();
  }, [onLogout]);

  const value = useMemo(
    () => ({
      status: state.status,
      remainingMs: state.remainingMs,
      formattedRemaining: formatRemainingTime(state.remainingMs),
      isWarning: state.status === "warning",
      isExpired: state.status === "expired",
      extendSession: handleExtendSession,
      forceLogout: handleForceLogout,
    }),
    [state, handleExtendSession, handleForceLogout],
  );

  return (
    <SessionTimeoutContext.Provider value={value}>
      {children}
    </SessionTimeoutContext.Provider>
  );
}

export function useSessionTimeout(): SessionTimeoutContextValue {
  const ctx = useContext(SessionTimeoutContext);
  if (!ctx) {
    // Return safe defaults when not within provider
    return {
      status: "active",
      remainingMs: 900000,
      formattedRemaining: "15:00",
      isWarning: false,
      isExpired: false,
      extendSession: () => { void 0; },
      forceLogout: () => { void 0; },
    };
  }
  return ctx;
}
