"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@klaro/ui/button";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 420);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="fixed right-4 bottom-20 z-50 transition-all duration-300"
      data-visible={visible}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={scrollToTop}
        aria-label="Go back to top"
        className="h-12 w-12 rounded-full border-border/60 bg-background/85 text-foreground shadow-[0_14px_35px_rgba(0,0,0,0.14)] backdrop-blur-md transition-transform hover:-translate-y-0.5 hover:bg-background"
      >
        <ArrowUp className="size-5" />
      </Button>
    </div>
  );
}