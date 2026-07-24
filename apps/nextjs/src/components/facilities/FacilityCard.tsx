"use client";

import type { Facility } from "./FacilityMap";

interface FacilityCardProps {
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
          ? "scale-[1.01] border-zinc-900 bg-zinc-50 shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-[15px] leading-tight font-semibold text-zinc-900">
            {facility.name}
            {isBestFit && (
              <span className="ml-2 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                Best Fit
              </span>
            )}
          </h3>
          <p className="mt-1.5 text-[13px] font-medium text-zinc-400">
            {facility.facilityType ?? "Medical facility"} •{" "}
            {facility.ownership ?? "private"}
          </p>
        </div>

        <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[13px] font-bold text-zinc-900">
          {typeof facility.distance === "number"
            ? `${facility.distance.toFixed(1)} km`
            : "Nearby"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold tracking-tight">
        {facility.isPhilHealthAccredited && (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-blue-600">
            PhilHealth
          </span>
        )}
        {urgency && urgency !== "LOW" && (
          <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-amber-600">
            {urgency === "HIGH" ? "Urgent Care" : "Follow-up recommended"}
          </span>
        )}
        {recommendedSummary && (
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-white">
            Recommended
          </span>
        )}
      </div>

      <p className="mt-4 text-[13.5px] leading-relaxed font-normal text-zinc-500">
        {facility.address}
      </p>

      {recommendedSummary && (
        <div className="mt-4 rounded-[16px] border border-zinc-300 bg-zinc-50 p-4">
          <p className="text-[13px] leading-relaxed font-medium text-zinc-700">
            {recommendedSummary}
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-300 pt-4">
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-[12px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
            onClick={() => onSelect?.(facility)}
          >
            View
          </button>
          <button
            type="button"
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-zinc-800"
            onClick={(event) => {
              event.stopPropagation();
              onBook?.(facility);
            }}
          >
            Book Now
          </button>
        </div>
        <span
          className="flex items-center gap-0.5 text-white"
          aria-label="5 star rating"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <svg
              key={index}
              className="h-3.5 w-3.5 fill-current text-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 .587l3.668 7.431L23.4 9.75l-5.7 5.554L19.335 24 12 19.897 4.665 24l1.636-8.696L.6 9.75l7.732-1.732L12 .587z" />
            </svg>
          ))}
        </span>
      </div>
    </div>
  );
}

export default FacilityCard;
