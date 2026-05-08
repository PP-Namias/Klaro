"use client";

import dynamic from "next/dynamic";

import type { Facility } from "./FacilityMap";

const FacilityMap = dynamic(() => import("./FacilityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-[20px] border border-zinc-100 bg-zinc-50" />
  ),
});

const MOCK_FACILITIES: Facility[] = [
  {
    id: "1",
    name: "St. Luke's Medical Center",
    facilityType: "hospital",
    latitude: 14.6225,
    longitude: 121.0242,
    ownership: "private",
    address: "279 E Rodriguez Sr. Ave, Quezon City, 1112 Metro Manila",
  },
  {
    id: "2",
    name: "Lung Center of the Philippines",
    facilityType: "hospital",
    latitude: 14.6483,
    longitude: 121.0456,
    ownership: "public",
  },
  {
    id: "3",
    name: "Philippine Heart Center",
    latitude: 14.6438,
    longitude: 121.0478,
    facilityType: "hospital",
  },
];

export function MapPreview() {
  return (
    <div className="h-full w-full overflow-hidden rounded-[20px] border border-zinc-100 shadow-sm">
      <FacilityMap
        facilities={MOCK_FACILITIES}
        center={[14.635, 121.035]}
        zoom={13}
        interactive={true}
        dragging={true}
        scrollWheelZoom={false}
        zoomControl={false}
      />
    </div>
  );
}
