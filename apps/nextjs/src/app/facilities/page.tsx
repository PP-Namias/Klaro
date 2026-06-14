import { Suspense } from "react";

import FacilitiesClient from "~/components/facilities/FacilitiesClient";

export const metadata = {
  title: "Medical Facility Locator | Klaro",
  description:
    "Find hospitals and clinics near you with AI-driven suggestions and route estimation.",
};

export default function FacilitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          Loading locator...
        </div>
      }
    >
      <FacilitiesClient />
    </Suspense>
  );
}
