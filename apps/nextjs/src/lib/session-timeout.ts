/**
 * Session Timeout Service
 *
 * HIPAA Requirement: Automatic logoff after 15 minutes of inactivity
 * per 45 CFR 164.312(a)(2)(iii)
 *
 * Features:
 * - Tracks user activity (mouse, keyboard, touch, scroll)
 * - Shows warning modal at 14 minutes
 * - Auto-logs out at 15 minutes
 * - Extends session on user interaction during warning
 * - Logs session timeout events for audit trail
 */

// ============================================================================
// Configuration
// ============================================================================

export interface SessionTimeoutConfig {
  /** Total session timeout in milliseconds (default: 15 minutes) */
  timeoutMs: number;
  /** Warning before timeout in milliseconds (default: 1 minute) */
  warningMs: number;
  /** Activity debounce interval in milliseconds */
  debounceMs: number;
  /** Enable debug logging */
  debug: boolean;
}

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  timeoutMs: parseInt(process.env.SESSION_TIMEOUT_MS || "900000", 10), // 15 minutes
  warningMs: parseInt(process.env.SESSION_WARNING_MS || "60000", 10), // 1 minute
  debounceMs: 30000, // 30 seconds
  debug: process.env.NODE_ENV === "development",
};

// ============================================================================
// Types
// ============================================================================

export type SessionStatus = "active" | "warning" | "expired";

export interface SessionState {
  status: SessionStatus;
  lastActivity: Date;
  expiresAt: Date;
  warningAt: Date;
  remainingMs: number;
  warningRemainingMs: number;
}

export interface SessionTimeoutCallbacks {
  onWarning?: (state: SessionState) => void;
  onExpired?: () => void;
  onActivity?: (state: SessionState) => void;
  onExtend?: () => void;
}

// ============================================================================
// Activity Tracking
// ============================================================================

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "focus",
] as const;

let lastActivityTime = Date.now();
let activityTimer: ReturnType<typeof setInterval> | null = null;
let callbacks: SessionTimeoutCallbacks = {};
let config: SessionTimeoutConfig = DEFAULT_CONFIG;
let currentStatus: SessionStatus = "active";
let isInitialized = false;

/**
 * Debounced activity handler
 */
let activityDebounce: ReturnType<typeof setTimeout> | null = null;

function handleActivity(): void {
  if (activityDebounce) {
    clearTimeout(activityDebounce);
  }

  activityDebounce = setTimeout(() => {
    lastActivityTime = Date.now();

    if (config.debug) {
      console.log(
        JSON.stringify({
          type: "session_activity",
          timestamp: new Date().toISOString(),
          status: currentStatus,
        }),
      );
    }

    // If we're in warning state and user is active, extend session
    if (currentStatus === "warning") {
      extendSession();
    }

    callbacks.onActivity?.(getSessionState());
  }, config.debounceMs);
}

/**
 * Attach activity listeners to document
 */
function attachActivityListeners(): void {
  if (typeof document === "undefined") return;

  for (const event of ACTIVITY_EVENTS) {
    document.addEventListener(event, handleActivity, { passive: true });
  }
}

/**
 * Detach activity listeners
 */
function detachActivityListeners(): void {
  if (typeof document === "undefined") return;

  for (const event of ACTIVITY_EVENTS) {
    document.removeEventListener(event, handleActivity);
  }
}

// ============================================================================
// Session State Management
// ============================================================================

function getSessionState(): SessionState {
  const now = Date.now();
  const warningAt = new Date(lastActivityTime + config.timeoutMs - config.warningMs);
  const expiresAt = new Date(lastActivityTime + config.timeoutMs);

  return {
    status: currentStatus,
    lastActivity: new Date(lastActivityTime),
    expiresAt,
    warningAt,
    remainingMs: Math.max(0, lastActivityTime + config.timeoutMs - now),
    warningRemainingMs: Math.max(
      0,
      lastActivityTime + config.timeoutMs - config.warningMs - now,
    ),
  };
}

/**
 * Check session status and update accordingly
 */
function checkSessionStatus(): void {
  const now = Date.now();
  const timeSinceActivity = now - lastActivityTime;
  const timeUntilTimeout = config.timeoutMs - timeSinceActivity;
  const timeUntilWarning = config.timeoutMs - config.warningMs - timeSinceActivity;

  // Session expired
  if (timeUntilTimeout <= 0) {
    if (currentStatus !== "expired") {
      currentStatus = "expired";
      console.log(
        JSON.stringify({
          type: "session_expired",
          timestamp: new Date().toISOString(),
          inactiveMs: timeSinceActivity,
        }),
      );
      callbacks.onExpired?.();
      stopSessionTimeout();
    }
    return;
  }

  // Warning state
  if (timeUntilWarning <= 0 && currentStatus === "active") {
    currentStatus = "warning";
    console.log(
      JSON.stringify({
        type: "session_warning",
        timestamp: new Date().toISOString(),
        remainingMs: timeUntilTimeout,
      }),
    );
    callbacks.onWarning?.(getSessionState());
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize session timeout monitoring
 */
export function initSessionTimeout(
  userCallbacks: SessionTimeoutCallbacks = {},
  userConfig: Partial<SessionTimeoutConfig> = {},
): void {
  if (isInitialized) {
    console.warn("[SessionTimeout] Already initialized");
    return;
  }

  config = { ...DEFAULT_CONFIG, ...userConfig };
  callbacks = userCallbacks;
  lastActivityTime = Date.now();
  currentStatus = "active";
  isInitialized = true;

  attachActivityListeners();

  // Check session status every 5 seconds
  activityTimer = setInterval(checkSessionStatus, 5000);

  console.log(
    JSON.stringify({
      type: "session_timeout_init",
      config: {
        timeoutMs: config.timeoutMs,
        warningMs: config.warningMs,
      },
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * Stop session timeout monitoring
 */
export function stopSessionTimeout(): void {
  if (activityTimer) {
    clearInterval(activityTimer);
    activityTimer = null;
  }

  detachActivityListeners();

  if (activityDebounce) {
    clearTimeout(activityDebounce);
    activityDebounce = null;
  }

  isInitialized = false;
  currentStatus = "active";

  console.log(
    JSON.stringify({
      type: "session_timeout_stop",
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * Extend session (reset timeout)
 */
export function extendSession(): void {
  lastActivityTime = Date.now();
  currentStatus = "active";

  console.log(
    JSON.stringify({
      type: "session_extended",
      timestamp: new Date().toISOString(),
    }),
  );

  callbacks.onExtend?.();
}

/**
 * Get current session state
 */
export function getSessionStatus(): SessionState {
  return getSessionState();
}

/**
 * Force session expiry (for logout)
 */
export function forceSessionExpiry(): void {
  currentStatus = "expired";
  stopSessionTimeout();
}

/**
 * Format remaining time as MM:SS
 */
export function formatRemainingTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
