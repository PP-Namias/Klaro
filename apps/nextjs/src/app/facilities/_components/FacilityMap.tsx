"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
}


interface FacilityMapProps {
  facilities: Facility[];
  center: [number, number];
  zoom?: number;
  onMarkerClick?: (facility: Facility) => void;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function FacilityMap({
  facilities,
  center,
  zoom = 13,
  onMarkerClick,
}: FacilityMapProps) {
  const isBrowser = typeof window !== "undefined";

  if (!isBrowser) return <div className="h-full w-full bg-slate-100 animate-pulse" />;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {facilities.map((fac, index) => {
        if (!fac.latitude || !fac.longitude) return null;
        const position: [number, number] = [
          Number(fac.latitude),
          Number(fac.longitude),
        ];

        return (
          <Marker
            key={fac.id ?? index}
            position={position}
            eventHandlers={{
              click: () => onMarkerClick?.(fac),
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm">{fac.name ?? "Unknown Facility"}</h3>
                <p className="text-xs text-slate-500 capitalize">
                  {fac.facilityType ?? "Medical Facility"} • {fac.ownership ?? "Private"}
                </p>
                <p className="text-xs mt-1">{fac.address ?? "No address provided"}</p>
                {fac.distance !== undefined && (
                  <p className="text-xs font-semibold mt-1 text-blue-600">
                    {fac.distance.toFixed(1)} km away
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

    </MapContainer>
  );
}
