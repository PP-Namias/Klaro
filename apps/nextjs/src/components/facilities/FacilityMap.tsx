"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

const iconFactory = (emoji: string, background: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;border-radius:9999px;background:${background};display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(15,23,42,.25);border:2px solid white;font-size:16px;line-height:1">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });

const defaultMarker = iconFactory("📍", "#2563eb");
const hospitalMarker = iconFactory("🏥", "#dc2626");
const clinicMarker = iconFactory("🩺", "#16a34a");
const diagnosticMarker = iconFactory("🔬", "#7c3aed");
const healthUnitMarker = iconFactory("💊", "#ea580c");

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
  }, [center, zoom, map]);
  return null;
}

const getMarkerIcon = (facilityType?: string | null) => {
  const type = facilityType?.toLowerCase() ?? "";
  if (type === "hospital") return hospitalMarker;
  if (type === "clinic") return clinicMarker;
  if (type === "diagnostic_center") return diagnosticMarker;
  if (type === "health_unit" || type === "rural_health_unit") return healthUnitMarker;
  return defaultMarker;
};

export default function FacilityMap({
  facilities,
  center,
  zoom = 13,
  onMarkerClick,
  onBookFacility,
}: FacilityMapProps) {
  const isBrowser = typeof window !== "undefined";

  const validFacilities = useMemo(
    () =>
      facilities.filter(
        (facility) => facility.latitude != null && facility.longitude != null,
      ),
    [facilities],
  );

  if (!isBrowser) {
    return <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "18px" }}
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
            icon={getMarkerIcon(facility.facilityType)}
            eventHandlers={{
              click: () => onMarkerClick?.(facility),
            }}
          >
            <Popup>
              <div className="space-y-2 p-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {facility.name ?? "Unknown Facility"}
                  </h3>
                  <p className="text-xs capitalize text-slate-500">
                    {facility.facilityType ?? "Medical facility"} • {facility.ownership ?? "private"}
                  </p>
                </div>
                <p className="text-xs text-slate-700">{facility.address ?? "No address provided"}</p>
                {facility.distance !== undefined && (
                  <p className="text-xs font-semibold text-blue-600">
                    {facility.distance.toFixed(1)} km away
                  </p>
                )}
                {facility.summary && (
                  <p className="rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-700">
                    {facility.summary}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                    onClick={() => onBookFacility?.(facility)}
                  >
                    Book Now
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
