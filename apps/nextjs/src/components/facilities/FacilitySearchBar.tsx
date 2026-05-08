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
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Search nearby care</p>
        <h3 className="mt-1 text-base font-bold text-slate-900">Find the right clinic or hospital</h3>
      </div>

      <input
        aria-label="Search facility name"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
        placeholder="Search by facility name or address"
        value={draft.textSearch}
        onChange={(event) => setDraft((current) => ({ ...current, textSearch: event.target.value }))}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Specialty</span>
          <select
            aria-label="Specialty filter"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
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

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Ownership</span>
          <select
            aria-label="Ownership filter"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
            value={draft.ownership}
            onChange={(event) => setDraft((current) => ({ ...current, ownership: event.target.value as FacilityFilters["ownership"] }))}
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          aria-label="Emergency only"
          type="checkbox"
          checked={draft.emergencyOnly}
          onChange={(event) => setDraft((current) => ({ ...current, emergencyOnly: event.target.checked }))}
        />
        Emergency / urgent-care only
      </label>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Filter and ranking updates happen automatically.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
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
          Clear
        </Button>
      </div>
    </div>
  );
}

export default FacilitySearchBar;