"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import dynamic from "next/dynamic";
import { useTRPC } from "~/trpc/react";
import styles from "../../app/facilities/page.module.css";
import { Button } from "@klaro/ui/button";

// Dynamically import the map to avoid SSR issues with Leaflet
const FacilityMap = dynamic(() => import("./FacilityMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />,
});

// Default coordinates (Quezon City / Metro Manila center)
const DEFAULT_COORDS: [number, number] = [14.6225, 121.0242];

export default function FacilitiesClient() {
  const [coords, setCoords] = useState<[number, number]>(DEFAULT_COORDS);
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "public" | "private">("all");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const trpc = useTRPC();

  // Fetch nearby facilities
  const facilitiesQuery = useQuery(
    trpc.facilities.searchNearby.queryOptions({
      latitude: coords[0],
      longitude: coords[1],
      radiusKm: 15,
      ownership: ownershipFilter === "all" ? undefined : ownershipFilter,
    })
  );

  const facilities = facilitiesQuery.data ?? [];
  const isFacilitiesLoading = facilitiesQuery.isLoading;

  // Fetch best suggested
  const bestSuggestedQuery = useQuery(
    trpc.facilities.bestSuggested.queryOptions({
      latitude: coords[0],
      longitude: coords[1],
    })
  );

  const bestSuggested = bestSuggestedQuery.data;
  const isBestLoading = bestSuggestedQuery.isLoading;


  const filteredFacilities = useMemo(() => {
    return facilities;
  }, [facilities]);

  const handleFacilityClick = (facility: any) => {
    setSelectedFacilityId(facility.id);
    if (facility.latitude && facility.longitude) {
      // Small offset to keep the popup visible
      setCoords([parseFloat(facility.latitude), parseFloat(facility.longitude)]);
    }
  };

  return (
    <div className={styles.facilities}>
      <header className={styles.facilities__header}>
        <div className={styles.facilities__brand}>
          <div className={styles.facilities__logo}>K</div>
          <div className={styles.facilities__title}>
            <span className={styles.facilities__name}>Medical Facility Locator</span>
            <span className={styles.facilities__tagline}>Find clinics and hospitals near you</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" size="sm" onClick={() => setCoords(DEFAULT_COORDS)}>
             Reset to Quezon City
           </Button>
        </div>
      </header>

      <div className={styles.facilities__shell}>
        <aside className={styles.facilities__sidebar}>
          <div className={styles.facilities__searchBox}>
            <h2 className="text-xl font-bold tracking-tight">Facilities</h2>
            <div className={styles.facilities__filters}>
              <button 
                className={`${styles.facilities__filter} ${ownershipFilter === "all" ? styles["facilities__filter--active"] : ""}`}
                onClick={() => setOwnershipFilter("all")}
              >
                All
              </button>
              <button 
                className={`${styles.facilities__filter} ${ownershipFilter === "public" ? styles["facilities__filter--active"] : ""}`}
                onClick={() => setOwnershipFilter("public")}
              >
                Public
              </button>
              <button 
                className={`${styles.facilities__filter} ${ownershipFilter === "private" ? styles["facilities__filter--active"] : ""}`}
                onClick={() => setOwnershipFilter("private")}
              >
                Private
              </button>
            </div>
          </div>

          {bestSuggested && (
            <div className={styles.facilities__suggestion}>
              <div className={styles.facilities__suggestionTitle}>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                AI Suggestion
              </div>
              <p className={styles.facilities__suggestionText}>
                {bestSuggested.summary}
              </p>
            </div>
          )}

          <div className={styles.facilities__list}>
            {isFacilitiesLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-slate-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              filteredFacilities.map((fac: any) => (
                <article 
                  key={fac.id} 
                  className={`${styles.facilities__card} ${selectedFacilityId === fac.id ? styles["facilities__card--active"] : ""}`}
                  onClick={() => handleFacilityClick(fac)}
                >
                  <div className={styles.facilities__cardHeader}>
                    <h3 className={styles.facilities__cardTitle}>
                      {fac.name}
                      {bestSuggested?.id === fac.id && (
                        <span className={`${styles.facilities__bestBadge} ml-2`}>Best Fit</span>
                      )}
                    </h3>
                    <span className={styles.facilities__cardDistance}>
                      {fac.distance?.toFixed(1)} km
                    </span>
                  </div>
                  <div className={styles.facilities__cardMeta}>
                    <span className={styles.facilities__cardBadge}>{fac.facilityType}</span>
                    <span className={styles.facilities__cardBadge}>{fac.ownership}</span>
                    {fac.isPhilHealthAccredited && (
                      <span className={`${styles.facilities__cardBadge} bg-green-50 text-green-700`}>PhilHealth</span>
                    )}
                  </div>
                  <p className={styles.facilities__cardAddress}>{fac.address}</p>
                </article>
              ))
            )}
          </div>
        </aside>

        <main className={styles.facilities__content}>
          <FacilityMap 
            facilities={facilities} 
            center={coords} 
            zoom={selectedFacilityId ? 15 : 13}
            onMarkerClick={handleFacilityClick}
          />
        </main>
      </div>
    </div>
  );
}