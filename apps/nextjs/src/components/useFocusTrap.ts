import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/**
 * Simple focus-trap hook.
 * Provide a ref to the modal root; it will keep tab focus inside while `active` is true.
 */
export default function useFocusTrap(
  rootRef: RefObject<HTMLElement | null>,
  active = true,
) {
  const root = rootRef;
  const currentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    currentRef.current = root.current;
  });

  useEffect(() => {
    if (!active) return;

    const node = currentRef.current;
    if (!node) return;

    const focusableSelector =
      'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(
      node.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter((el) => el.offsetParent !== null);

    if (focusable.length) {
      focusable[0].focus();
    } else {
      node.setAttribute("tabindex", "-1");
      node.focus();
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      try {
        if (node.hasAttribute("tabindex")) node.removeAttribute("tabindex");
      } catch {
        // ignore
      }
    };
  }, [active, rootRef]);

  return rootRef;
}
