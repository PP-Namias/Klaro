/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DISCLAIMER_STORAGE_KEY } from "~/components/medical-disclaimer-overlay";
import { useMedicalDisclaimer } from "~/hooks/use-medical-disclaimer";

/**
 * The consent gate is a compliance control, not a cosmetic banner: no medical
 * document may be read until Terms of Service, Terms & Conditions and the
 * medical disclaimer are accepted (RA 10173).
 */
const mockStorage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  get length() {
    return Object.keys(mockStorage).length;
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
  key: (index: number) => Object.keys(mockStorage)[index] ?? null,
});

describe("useMedicalDisclaimer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads persisted acceptance from the external store", () => {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, new Date().toISOString());

    const { result } = renderHook(() => useMedicalDisclaimer());

    // The persisted acceptance is picked up from the external store.
    expect(result.current.hasAccepted).toBe(true);
  });

  it("blocks the action and opens the overlay when consent is missing", () => {
    const { result } = renderHook(() => useMedicalDisclaimer());

    let allowed = true;
    act(() => {
      allowed = result.current.requireConsent();
    });

    expect(allowed).toBe(false);
    expect(result.current.isShowing).toBe(true);
    expect(result.current.hasAccepted).toBe(false);
  });

  it("allows the action once accepted and persists the acceptance", () => {
    const { result } = renderHook(() => useMedicalDisclaimer());

    act(() => {
      result.current.acceptDisclaimer();
    });

    expect(result.current.hasAccepted).toBe(true);
    expect(result.current.isShowing).toBe(false);
    expect(localStorage.getItem(DISCLAIMER_STORAGE_KEY)).not.toBeNull();

    let allowed = false;
    act(() => {
      allowed = result.current.requireConsent();
    });
    expect(allowed).toBe(true);
  });

  it("keeps blocking after a decline", () => {
    const { result } = renderHook(() => useMedicalDisclaimer());

    act(() => {
      result.current.requireConsent();
    });
    act(() => {
      result.current.declineDisclaimer();
    });

    expect(result.current.hasAccepted).toBe(false);
    expect(result.current.isShowing).toBe(false);
    expect(localStorage.getItem(DISCLAIMER_STORAGE_KEY)).toBeNull();

    let allowed = true;
    act(() => {
      allowed = result.current.requireConsent();
    });
    expect(allowed).toBe(false);
  });

  it("blocks an upload submit handler until consent is recorded", () => {
    const { result } = renderHook(() => useMedicalDisclaimer());

    // Mirrors upload-form/ScannerUI: the submit path returns early unless
    // requireConsent() passes, so the scan mutation is never reached.
    let scanCalls = 0;
    const submit = () => {
      if (!result.current.requireConsent()) return;
      scanCalls += 1;
    };

    act(() => {
      submit();
    });
    expect(scanCalls).toBe(0);
    expect(result.current.isShowing).toBe(true);

    act(() => {
      result.current.acceptDisclaimer();
    });
    act(() => {
      submit();
    });
    expect(scanCalls).toBe(1);
  });

  it("re-prompts after consent is reset", () => {
    const { result } = renderHook(() => useMedicalDisclaimer());

    act(() => {
      result.current.acceptDisclaimer();
    });
    act(() => {
      result.current.resetDisclaimer();
    });

    expect(result.current.hasAccepted).toBe(false);
    expect(localStorage.getItem(DISCLAIMER_STORAGE_KEY)).toBeNull();
  });
});
