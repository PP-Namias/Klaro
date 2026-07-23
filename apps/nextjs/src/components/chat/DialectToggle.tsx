"use client";

import { Languages } from "lucide-react";

import type { Dialect } from "~/hooks/use-chat";

const DIALECTS: { value: Dialect; label: string }[] = [
  { value: "English", label: "EN" },
  { value: "Filipino", label: "FIL" },
  { value: "Bisaya", label: "BIS" },
  { value: "Ilocano", label: "ILO" },
];

interface DialectToggleProps {
  current: Dialect;
  onChange: (dialect: Dialect) => void;
}

export function DialectToggle({ current, onChange }: DialectToggleProps) {
  return (
    <div className="dialectToggle">
      <Languages size={14} />
      {DIALECTS.map((d) => (
        <button
          key={d.value}
          className={`dialectToggleBtn ${d.value === current ? "dialectToggleBtnActive" : ""}`}
          onClick={() => onChange(d.value)}
          type="button"
          title={d.value}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
