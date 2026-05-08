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
      className={`w-full rounded-[20px] border p-5 text-left transition-all duration-200 ${
        isActive 
          ? "border-zinc-900 bg-zinc-50 shadow-sm scale-[1.01]" 
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-zinc-900 leading-tight">
            {facility.name}
            {isBestFit && (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                Best Fit
              </span>
            )}
          </h3>
          <p className="mt-1.5 text-[13px] font-medium text-zinc-400">
            {facility.facilityType ?? "Medical facility"} • {facility.ownership ?? "private"}
          </p>
        </div>

        <span className="text-[13px] font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded-lg">
          {typeof facility.distance === "number" ? `${facility.distance.toFixed(1)} km` : "Nearby"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold tracking-tight">
        {facility.isPhilHealthAccredited && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-600 border border-blue-100">PhilHealth</span>
        )}
        {urgency && urgency !== "LOW" && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-600 border border-amber-100">
            {urgency === "HIGH" ? "Urgent Care" : "Follow-up recommended"}
          </span>
        )}
        {recommendedSummary && (
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-white">Recommended</span>
        )}
      </div>

      <p className="mt-4 text-[13.5px] leading-relaxed text-zinc-500 font-normal">{facility.address}</p>

      {recommendedSummary && (
        <div className="mt-4 rounded-[16px] bg-zinc-50 border border-zinc-300 p-4">
          <p className="text-[13px] leading-relaxed text-zinc-700 font-medium">
            {recommendedSummary}
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-300 pt-4">
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            onClick={() => onSelect?.(facility)}
          >
            View
          </button>
          <button
            type="button"
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-zinc-800 transition-colors"
            onClick={(event) => {
              event.stopPropagation();
              onBook?.(facility);
            }}
          >
            Book Now
          </button>
        </div>
        <span className="text-[11px] font-medium text-zinc-400">
          ⭐⭐⭐⭐⭐
        </span>
      </div>
    </div>

  );
}

export default FacilityCard;