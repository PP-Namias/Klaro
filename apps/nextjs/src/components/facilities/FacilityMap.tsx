"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-floating-promises */

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// Icons are created dynamically after Leaflet is available in the browser.

export interface Facility {
  id?: string;
  name?: string;
  facilityType?: string | null;
  ownership?: "public" | "private" | null;
  address?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  distance?: number;
  isPhilHealthAccredited?: boolean;
  acceptedSpecialties?: string[];
  summary?: string;
  rankingScore?: number;
  urgency?: "LOW" | "MODERATE" | "HIGH";
  matchReasons?: string[];
}

interface FacilityMapProps {
  facilities: Facility[];
  center: [number, number];
  zoom?: number;
  onMarkerClick?: (facility: Facility) => void;
  onBookFacility?: (facility: Facility) => void;
  interactive?: boolean;
  dragging?: boolean;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
}

function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // Force leaflet to recalculate size after a short delay to fix container width issues
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);
  return null;
}

export default function FacilityMap({
  facilities,
  center,
  zoom = 13,
  onMarkerClick,
  onBookFacility,
  interactive = true,
  dragging = true,
  scrollWheelZoom = true,
  zoomControl = true,
}: FacilityMapProps) {
  const isBrowser = typeof globalThis.window !== "undefined";

  // Client-only: dynamically create Leaflet divIcons to avoid referencing
  // Leaflet at module import time. This prevents SSR/bundler issues and
  // ensures icons are available once the browser has loaded Leaflet.
  const [icons, setIcons] = useState<{
    default: any;
    hospital: any;
    clinic: any;
    diagnostic: any;
    healthUnit: any;
  } | null>(null);

  const defaultMarker = icons?.default;
  const hospitalMarker = icons?.hospital;
  const clinicMarker = icons?.clinic;
  const diagnosticMarker = icons?.diagnostic;
  const healthUnitMarker = icons?.healthUnit;

  const getMarkerIcon = (facilityType?: string | null) => {
    const type = facilityType?.toLowerCase() ?? "";
    if (type === "hospital") return hospitalMarker;
    if (type === "clinic") return clinicMarker;
    if (type === "diagnostic_center") return diagnosticMarker;
    if (type === "health_unit" || type === "rural_health_unit")
      return healthUnitMarker;
    return defaultMarker;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        const factory = (emoji: string, background: string) =>
          L.divIcon({
            className: "",
            html: `<div style="width:32px;height:32px;border-radius:9999px;background:${background};display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(15,23,42,.25);border:2px solid white;font-size:16px;line-height:1">${emoji}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -30],
          });

        if (!mounted) return;
        setIcons({
          default: factory("📍", "#18181b"),
          hospital: factory("🏥", "#ef4444"),
          clinic: factory("🩺", "#10b981"),
          diagnostic: factory("🔬", "#8b5cf6"),
          healthUnit: factory("💊", "#f97316"),
        });
      } catch (err) {
        // Fail silently; markers will fall back to default icons.
        console.warn("Failed to load Leaflet icons:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const validFacilities = useMemo(
    () =>
      facilities.filter(
        (facility) => facility.latitude != null && facility.longitude != null,
      ),
    [facilities],
  );

  if (!isBrowser) {
    return (
      <div className="h-full w-full animate-pulse rounded-[24px] border border-zinc-100 bg-zinc-50" />
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={interactive && scrollWheelZoom}
      dragging={interactive && dragging}
      zoomControl={interactive && zoomControl}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      style={{ height: "100%", width: "100%" }}
      className={`z-10 h-full w-full ${!interactive ? "grayscale-[0.2]" : ""}`}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validFacilities.map((facility, index) => {
        const position: [number, number] = [
          Number(facility.latitude),
          Number(facility.longitude),
        ];

        return (
          <Marker
            key={facility.id ?? index}
            position={position}
            {...(icons ? { icon: getMarkerIcon(facility.facilityType) } : {})}
            eventHandlers={{
              click: () => onMarkerClick?.(facility),
            }}
          >
            <Popup className="premium-popup">
              <div className="space-y-3 p-1 font-sans">
                <div>
                  <h3 className="text-[14px] leading-tight font-bold text-zinc-900">
                    {facility.name ?? "Unknown Facility"}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                    {facility.facilityType ?? "Medical facility"} •{" "}
                    {facility.ownership ?? "private"}
                  </p>
                </div>
                <p className="text-[12px] leading-relaxed font-medium text-zinc-500">
                  {facility.address ?? "No address provided"}
                </p>
                {facility.distance !== undefined && (
                  <p className="text-[12px] font-bold text-zinc-900">
                    {facility.distance.toFixed(1)} km away
                  </p>
                )}
                {facility.summary && (
                  <div className="rounded-[12px] border border-zinc-100 bg-zinc-50 p-3 text-[12px] leading-relaxed font-medium text-zinc-700">
                    {facility.summary}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    className="w-full rounded-full bg-zinc-900 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-zinc-800"
                    onClick={() => onBookFacility?.(facility)}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
