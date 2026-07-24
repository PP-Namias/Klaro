"use client";

/**
 * Medical Disclaimer Hook
 *
 * Manages the state of the medical disclaimer overlay.
 * Tracks whether the user has accepted the disclaimer.
 */
import { useCallback, useState } from "react";

import {
  clearDisclaimerAcceptance,
  hasAcceptedDisclaimer,
} from "~/components/medical-disclaimer-overlay";

interface UseMedicalDisclaimerReturn {
  /** Whether the disclaimer is currently showing */
  isShowing: boolean;
  /** Whether the user has accepted the disclaimer */
  hasAccepted: boolean;
  /** Show the disclaimer overlay */
  showDisclaimer: () => void;
  /** Hide the disclaimer overlay */
  hideDisclaimer: () => void;
  /** Handle user accepting the disclaimer */
  acceptDisclaimer: () => void;
  /** Handle user declining the disclaimer */
  declineDisclaimer: () => void;
  /** Reset disclaimer acceptance (for re-consent) */
  resetDisclaimer: () => void;
}

export function useMedicalDisclaimer(): UseMedicalDisclaimerReturn {
  const [isShowing, setIsShowing] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(() => hasAcceptedDisclaimer());

  // Check localStorage on mount

  const showDisclaimer = useCallback(() => {
    setIsShowing(true);
  }, []);

  const hideDisclaimer = useCallback(() => {
    setIsShowing(false);
  }, []);

  const acceptDisclaimer = useCallback(() => {
    setHasAccepted(true);
    setIsShowing(false);
  }, []);

  const declineDisclaimer = useCallback(() => {
    setIsShowing(false);
    // Don't set hasAccepted to true
  }, []);

  const resetDisclaimer = useCallback(() => {
    clearDisclaimerAcceptance();
    setHasAccepted(false);
  }, []);

  return {
    isShowing,
    hasAccepted,
    showDisclaimer,
    hideDisclaimer,
    acceptDisclaimer,
    declineDisclaimer,
    resetDisclaimer,
  };
}
