"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@klaro/ui/button";

import type { Facility } from "./FacilityMap";
import type { FacilityFilters } from "./FacilitySearchBar";
import { useTRPC } from "~/trpc/react";
import styles from "../../app/facilities/page.module.css";
import FacilityCard from "./FacilityCard";
import FacilitySearchBar from "./FacilitySearchBar";
import { ScanAgentSidebar } from "./ScanAgentSidebar";

const FacilityMap = dynamic(() => import("./FacilityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-2xl bg-zinc-100" />
  ),
});

const DEFAULT_COORDS: [number, number] = [14.6225, 121.0242];
const BOOKING_URL = "https://cal.com/pp-namias/1-hour-session-with-clara";

type MedicalContext = {
  severity: "LOW" | "MODERATE" | "HIGH";
  testSummary: string;
  flaggedTests: Array<{ name: string; value?: string; unit?: string }>;
};

const defaultFilters: FacilityFilters = {
  textSearch: "",
  specialty: "",
  emergencyOnly: false,
  ownership: "all",
};

const normalizeSeverity = (value: unknown): MedicalContext["severity"] => {
  const severity = String(value ?? "").toUpperCase();
  if (severity === "HIGH" || severity === "MODERATE" || severity === "LOW") {
    return severity;
  }
  return "LOW";
};

const extractMedicalContext = (payload: unknown): MedicalContext | null => {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;
  const extractedData = data.extractedData as
    | Record<string, unknown>
    | undefined;

  const severity = normalizeSeverity(data.severity ?? analysis?.severity);

  const flaggedTestsSource: unknown[] = Array.isArray(data.flaggedTests)
    ? data.flaggedTests
    : Array.isArray(extractedData?.flaggedTests)
      ? extractedData.flaggedTests
      : Array.isArray(analysis?.flaggedValues)
        ? analysis.flaggedValues
        : [];

  const flaggedTests: MedicalContext["flaggedTests"] = [];
  for (const item of flaggedTestsSource) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    flaggedTests.push({
      name: String(
        entry.name ?? entry.testName ?? entry.label ?? "Unknown test",
      ),
      value: entry.value == null ? undefined : String(entry.value),
      unit: entry.unit == null ? undefined : String(entry.unit),
    });
  }

  const testSummary =
    String(
      data.plainLanguageSummary ?? data.summary ?? analysis?.summary ?? "",
    ).trim() || `${flaggedTests.length} flagged test(s) may need follow-up.`;

  return {
    severity,
    testSummary,
    flaggedTests,
  };
};

export default function FacilitiesClient() {
  const trpc = useTRPC();
  const [coords, setCoords] = useState<[number, number]>(DEFAULT_COORDS);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<FacilityFilters>(defaultFilters);
  const [medicalContext, setMedicalContext] = useState<MedicalContext | null>(
    null,
  );
  const [locationStatus, setLocationStatus] = useState<string>(
    "Allow location access to see nearby clinics and hospitals.",
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus(
        "Geolocation is not available in this browser. Showing the default area instead.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords([position.coords.latitude, position.coords.longitude]);
        setLocationStatus("Using your current location.");
      },
      () => {
        setLocationStatus(
          "Location permission was denied. Showing the default area instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 1000 * 60 * 5 },
    );
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("scanResult");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      const context = extractMedicalContext(parsed);
      if (context) {
        setMedicalContext(context);
      }
    } catch {
      // ignore malformed scan state
    }
  }, []);

  const facilitiesQuery = useQuery({
    ...trpc.facilities.searchNearby.queryOptions({
      latitude: coords[0],
      longitude: coords[1],
      radiusKm: 15,
      limit: 50,
      ownership: filters.ownership === "all" ? undefined : filters.ownership,
      philHealthOnly: false,
      textSearch: filters.textSearch.trim() || undefined,
      specialty: filters.specialty.trim() || undefined,
      emergencyOnly: filters.emergencyOnly,
    }),
  });

  const facilities = (facilitiesQuery.data ?? []) as Facility[];
  const isFacilitiesLoading = facilitiesQuery.isLoading;

  const bestSuggestedQuery = useQuery({
    ...trpc.facilities.bestSuggested.queryOptions({
      latitude: coords[0],
      longitude: coords[1],
      medicalContext: medicalContext ?? undefined,
    }),
  });

  const recommendationsQuery = useQuery({
    ...trpc.facilities.recommendByTestResults.queryOptions({
      extractedTests:
        medicalContext?.flaggedTests.map((test) => ({
          name: test.name,
          value: test.value ?? "",
          unit: test.unit,
          flagged: true,
        })) ?? [],
      latitude: coords[0],
      longitude: coords[1],
      radiusKm: 15,
      limit: 5,
    }),
    enabled: Boolean(medicalContext?.flaggedTests.length),
  });

  const recommendedById = useMemo(() => {
    const rows = recommendationsQuery.data ?? [];
    return new Map<string, (typeof rows)[number]>(
      rows.filter((row) => Boolean(row.id)).map((row) => [String(row.id), row]),
    );
  }, [recommendationsQuery.data]);

  const facilitySpecialties = useMemo(() => {
    const specialties = new Set<string>();
    for (const facility of facilities) {
      for (const specialty of facility.acceptedSpecialties ?? []) {
        if (typeof specialty === "string" && specialty.trim()) {
          specialties.add(specialty.trim());
        }
      }
    }
    return [...specialties].sort();
  }, [facilities]);

  const handleFacilityClick = useCallback((facility: Facility) => {
    setSelectedFacilityId(facility.id ?? null);
    if (facility.latitude != null && facility.longitude != null) {
      setCoords([Number(facility.latitude), Number(facility.longitude)]);
    }
  }, []);

  const handleBookFacility = useCallback((facility: Facility) => {
    const name = encodeURIComponent(facility.name ?? "Medical facility");
    window.open(`${BOOKING_URL}?text=${name}`, "_blank", "noopener,noreferrer");
  }, []);

  const resetLocation = () => {
    setCoords(DEFAULT_COORDS);
    setSelectedFacilityId(null);
    setLocationStatus("Reset to the default area in Quezon City.");
  };

  const activeBestSuggestion = bestSuggestedQuery.data ?? null;

  return (
    <div className={styles.facilities}>
      <div className={styles.facilities__shell}>
        <aside className={styles.facilities__sidebar} data-lenis-prevent>
          <div className={styles.facilities__searchBox}>
            <FacilitySearchBar
              specialties={facilitySpecialties}
              filters={filters}
              onChange={setFilters}
            />
          </div>

          <div className="border-b border-zinc-200 bg-zinc-50/50 px-8 py-5 text-sm text-zinc-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900">{locationStatus}</p>
                <p className="mt-0.5 text-[11px] font-medium tracking-tight text-zinc-400 uppercase">
                  {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-[11px] font-bold text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900"
                onClick={resetLocation}
              >
                Reset
              </Button>
            </div>
          </div>

          {medicalContext && (
            <div className={styles.facilities__suggestion}>
              <div className={styles.facilities__suggestionTitle}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Scan context available
              </div>
              <p className={styles.facilities__suggestionText}>
                {medicalContext.testSummary}
              </p>
            </div>
          )}

          {activeBestSuggestion && (
            <div className={styles.facilities__suggestion}>
              <div className={styles.facilities__suggestionTitle}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Best fit for you
              </div>
              <p className={styles.facilities__suggestionText}>
                {activeBestSuggestion.summary}
              </p>
            </div>
          )}

          <div className={styles.facilities__list}>
            {isFacilitiesLoading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-[20px] border border-zinc-100 bg-zinc-50"
                  />
                ))}
              </div>
            ) : facilities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[14px] leading-relaxed font-medium text-zinc-400">
                  No facilities matched your filters.
                  <br />
                  Try removing one filter or reset the location.
                </p>
              </div>
            ) : (
              facilities.map((facility) => {
                const recommendation = recommendedById.get(
                  String(facility.id ?? ""),
                );

                return (
                  <FacilityCard
                    key={facility.id}
                    facility={facility}
                    isActive={selectedFacilityId === facility.id}
                    isBestFit={activeBestSuggestion?.id === facility.id}
                    recommendedSummary={
                      recommendation?.summary ??
                      (activeBestSuggestion?.id === facility.id
                        ? activeBestSuggestion?.summary
                        : undefined)
                    }
                    urgency={
                      recommendation?.urgency ??
                      medicalContext?.severity ??
                      undefined
                    }
                    onSelect={handleFacilityClick}
                    onBook={handleBookFacility}
                  />
                );
              })
            )}
          </div>
        </aside>

        <main className={styles.facilities__content}>
          <FacilityMap
            facilities={facilities}
            center={coords}
            zoom={selectedFacilityId ? 15 : 13}
            onMarkerClick={handleFacilityClick}
            onBookFacility={handleBookFacility}
          />
        </main>

        {medicalContext && (
          <aside
            className="hidden w-80 overflow-y-auto border-l border-zinc-100 bg-white xl:block"
            data-lenis-prevent
          >
            <ScanAgentSidebar />
          </aside>
        )}
      </div>
    </div>
  );
}
