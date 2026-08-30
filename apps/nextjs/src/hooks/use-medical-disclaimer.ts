"use client";

/**
 * Medical Disclaimer Hook
 *
 * Owns the blocking consent gate that must be accepted before any medical
 * document is read (Terms of Service, Terms & Conditions and the medical
 * disclaimer). Acceptance is remembered per browser.
 */
import { useCallback, useState, useSyncExternalStore } from "react";

import {
  clearDisclaimerAcceptance,
  getDisclaimerServerSnapshot,
  getDisclaimerSnapshot,
  recordDisclaimerAcceptance,
  subscribeToDisclaimer,
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
  /**
   * Gate an action behind consent. Returns true when the caller may proceed;
   * otherwise opens the overlay and returns false.
   */
  requireConsent: () => boolean;
}

export function useMedicalDisclaimer(): UseMedicalDisclaimerReturn {
  const [isShowing, setIsShowing] = useState(false);

  // Read from the external store so the server render (always "not accepted")
  // and the first client render agree, without setting state in an effect.
  const hasAccepted = useSyncExternalStore(
    subscribeToDisclaimer,
    getDisclaimerSnapshot,
    getDisclaimerServerSnapshot,
  );

  const showDisclaimer = useCallback(() => {
    setIsShowing(true);
  }, []);

  const hideDisclaimer = useCallback(() => {
    setIsShowing(false);
  }, []);

  const acceptDisclaimer = useCallback(() => {
    // Persist here rather than relying on the overlay, so acceptance is
    // recorded no matter which surface presented it.
    recordDisclaimerAcceptance();
    setIsShowing(false);
  }, []);

  const declineDisclaimer = useCallback(() => {
    setIsShowing(false);
    // Consent is not recorded, so the gate stays closed.
  }, []);

  const resetDisclaimer = useCallback(() => {
    clearDisclaimerAcceptance();
  }, []);

  const requireConsent = useCallback(() => {
    if (hasAccepted) return true;
    setIsShowing(true);
    return false;
  }, [hasAccepted]);

  return {
    isShowing,
    hasAccepted,
    showDisclaimer,
    hideDisclaimer,
    acceptDisclaimer,
    declineDisclaimer,
    resetDisclaimer,
    requireConsent,
  };
}

export type { UseMedicalDisclaimerReturn };
