"use client";

import { useEffect, useState } from "react";

import { Button } from "@klaro/ui/button";

export type FacilityFilters = {
  textSearch: string;
  specialty: string;
  emergencyOnly: boolean;
  ownership: "all" | "public" | "private";
};

type FacilitySearchBarProps = {
  specialties: string[];
  filters: FacilityFilters;
  onChange: (filters: FacilityFilters) => void;
};

export function FacilitySearchBar({ specialties, filters, onChange }: FacilitySearchBarProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onChange(draft);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draft, onChange]);

  return (
    <div className="space-y-4 rounded-[24px] border border-zinc-200 bg-white p-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 [font-family:var(--font-cormorant)]">Search nearby care</p>
        <h3 className="mt-1 text-[21px] font-medium text-zinc-900 tracking-tight [font-family:var(--font-cormorant)] italic">Find the right clinic or hospital</h3>
      </div>

      <div className="relative">
        <input
          aria-label="Search facility name"
          className="w-full rounded-[14px] border border-zinc-200 bg-white px-4 py-2.5 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-900"
          placeholder="Search by facility name or address"
          value={draft.textSearch}
          onChange={(event) => setDraft((current) => ({ ...current, textSearch: event.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-[13px]">
          <span className="font-semibold text-zinc-700 ml-1">Specialty</span>
          <select
            aria-label="Specialty filter"
            className="w-full rounded-[14px] border border-zinc-200 bg-white px-3 py-2.5 text-[13px] font-medium text-zinc-900 outline-none focus:border-zinc-900 transition"
            value={draft.specialty}
            onChange={(event) => setDraft((current) => ({ ...current, specialty: event.target.value }))}
          >
            <option value="">All specialties</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-[13px]">
          <span className="font-semibold text-zinc-700 ml-1">Ownership</span>
          <select
            aria-label="Ownership filter"
            className="w-full rounded-[14px] border border-zinc-200 bg-white px-3 py-2.5 text-[13px] font-medium text-zinc-900 outline-none focus:border-zinc-900 transition"
            value={draft.ownership}
            onChange={(event) => setDraft((current) => ({ ...current, ownership: event.target.value as FacilityFilters["ownership"] }))}
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-3 text-[13px] font-medium text-zinc-600 cursor-pointer select-none">
        <input
          aria-label="Emergency only"
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          checked={draft.emergencyOnly}
          onChange={(event) => setDraft((current) => ({ ...current, emergencyOnly: event.target.checked }))}
        />
        Emergency / urgent-care only
      </label>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-50">
        <p className="text-[11px] font-medium text-zinc-400">Updates automatically.</p>
        <button
          type="button"
          className="text-[12px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
          onClick={() => {
            const reset = {
              textSearch: "",
              specialty: "",
              emergencyOnly: false,
              ownership: "all" as const,
            };
            setDraft(reset);
            onChange(reset);
          }}
        >
          Clear filters
        </button>
      </div>
    </div>

  );
}

export default FacilitySearchBar;