"use client";

import type { Facility } from "./FacilityMap";

type FacilityCardProps = {
  facility: Facility;
  isActive?: boolean;
  isBestFit?: boolean;
  recommendedSummary?: string;
  urgency?: "LOW" | "MODERATE" | "HIGH";
  onSelect?: (facility: Facility) => void;
  onBook?: (facility: Facility) => void;
};

export function FacilityCard({
  facility,
  isActive,
  isBestFit,
  recommendedSummary,
  urgency,
  onSelect,
  onBook,
}: Readonly<FacilityCardProps>) {
  return (
    <div
      className={`w-full rounded-2xl border p-4 text-left transition ${
        isActive ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {facility.name}
            {isBestFit && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Best Fit
              </span>
            )}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {facility.facilityType ?? "Medical facility"} • {facility.ownership ?? "private"}
          </p>
        </div>

        <span className="text-xs font-semibold text-blue-600">
          {typeof facility.distance === "number" ? `${facility.distance.toFixed(1)} km` : "Nearby"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
        {facility.isPhilHealthAccredited && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">PhilHealth</span>
        )}
        {urgency && urgency !== "LOW" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
            {urgency === "HIGH" ? "Urgent Care" : "Follow-up recommended"}
          </span>
        )}
        {recommendedSummary && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">Recommended for your results</span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{facility.address}</p>

      {recommendedSummary && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {recommendedSummary}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          ⭐⭐⭐⭐⭐ Coming soon
        </span>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
          onClick={() => onSelect?.(facility)}
        >
          View on map
        </button>
        <button
          type="button"
          className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
          onClick={(event) => {
            event.stopPropagation();
            onBook?.(facility);
          }}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

export default FacilityCard;