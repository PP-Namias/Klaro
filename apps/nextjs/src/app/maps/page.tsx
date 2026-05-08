import { Suspense } from "react";

import FacilitiesClient from "../../components/facilities/FacilitiesClient";

export const metadata = {
  title: "Medical Locations Map | Klaro",
  description:
    "Find nearby clinics and hospitals with smart filters and scan-aware recommendations.",
};

export default function MapsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          Loading map...
        </div>
      }
    >
      <FacilitiesClient />
    </Suspense>
  );
}
