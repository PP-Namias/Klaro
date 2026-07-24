"use client";

/**
 * Session Warning Modal
 *
 * Displayed when session is about to expire (1 minute warning).
 * Allows user to extend session or logout immediately.
 *
 * HIPAA Compliance: Auto-logoff after 15 minutes of inactivity
 */
import { useSessionTimeout } from "~/providers/session-timeout-provider";

interface SessionWarningModalProps {
  onExtend?: () => void;
  onLogout?: () => void;
}

export function SessionWarningModal({
  onExtend,
  onLogout,
}: SessionWarningModalProps) {
  const { isWarning, formattedRemaining, extendSession, forceLogout } =
    useSessionTimeout();

  if (!isWarning) return null;

  const handleExtend = () => {
    extendSession();
    onExtend?.();
  };

  const handleLogout = () => {
    forceLogout();
    onLogout?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        {/* Warning Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg
              className="h-8 w-8 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
          Session Expiring Soon
        </h2>

        {/* Description */}
        <p className="mb-4 text-center text-gray-600 dark:text-gray-400">
          Your session will expire due to inactivity. This is to protect your
          health information.
        </p>

        {/* Countdown Timer */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formattedRemaining}
            </span>
            <span className="ml-2 text-sm text-red-500 dark:text-red-400">
              remaining
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleExtend}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Continue Session
          </button>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Logout Now
          </button>
        </div>

        {/* Privacy Notice */}
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
          Protected health information is automatically secured after 15 minutes
          of inactivity per HIPAA requirements.
        </p>
      </div>
    </div>
  );
}
