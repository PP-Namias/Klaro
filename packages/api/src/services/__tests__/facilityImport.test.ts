import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildNominatimSearchUrl,
  geocodeFacilityAddress,
} from "../facilityGeocoding";
import {
  enrichFacilityWithGeocode,
  parseDohFacilitiesCsv,
} from "../facilityImport";

describe("facility import helpers", () => {
  it("parses doh csv rows into normalized facilities", () => {
    const facilities = parseDohFacilitiesCsv(`name,facility_type,ownership,address,latitude,longitude,philhealth,specialties,opening_hours
"Saint Luke's, QC",Hospital,Private,"279 E Rodriguez Sr. Ave, Quezon City",14.6225,121.0242,yes,"Cardiology; Oncology","weekdays: 08:00-17:00"
`);

    assert.equal(facilities.length, 1);
    assert.equal(facilities[0]?.name, "Saint Luke's, QC");
    assert.equal(facilities[0]?.facilityType, "hospital");
    assert.equal(facilities[0]?.ownership, "private");
    assert.deepEqual(facilities[0]?.acceptedSpecialties, ["Cardiology", "Oncology"]);
    assert.equal(facilities[0]?.isPhilHealthAccredited, true);
  });

  it("builds a nominatim search url for philippines facilities", () => {
    const url = buildNominatimSearchUrl("Makati Medical Center", {
      countryCode: "ph",
      limit: 1,
    });

    assert.equal(url.origin, "https://nominatim.openstreetmap.org");
    assert.equal(url.searchParams.get("q"), "Makati Medical Center");
    assert.equal(url.searchParams.get("countrycodes"), "ph");
    assert.equal(url.searchParams.get("limit"), "1");
  });

  it("geocodes facilities using the free nominatim api", async () => {
    let requestedUrl = "";

    const geocode = await geocodeFacilityAddress("PGH Manila", {
      fetchImpl: async (input, init) => {
        requestedUrl = String(input);
        assert.ok(init?.headers);

        return new Response(
          JSON.stringify([
            {
              lat: "14.5771",
              lon: "120.9884",
              display_name: "PGH Manila, Taft Ave, Manila",
              importance: 0.8,
            },
          ]),
          { status: 200 },
        );
      },
    });

    assert.ok(requestedUrl.includes("nominatim.openstreetmap.org/search"));
    assert.equal(geocode?.latitude, 14.5771);
    assert.equal(geocode?.longitude, 120.9884);
    assert.equal(geocode?.displayName, "PGH Manila, Taft Ave, Manila");
  });

  it("enriches facilities with geocoded coordinates when missing", async () => {
    const enriched = await enrichFacilityWithGeocode(
      {
        name: "Klaro Clinic",
        facilityType: "clinic",
        ownership: "private",
        address: "Ortigas Center, Pasig City",
        isPhilHealthAccredited: true,
        acceptedSpecialties: ["Internal Medicine"],
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify([
              {
                lat: "14.5866",
                lon: "121.0635",
                display_name: "Ortigas Center, Pasig City",
              },
            ]),
            { status: 200 },
          ),
      },
    );

    assert.equal(enriched.latitude, "14.58660000");
    assert.equal(enriched.longitude, "121.06350000");
  });
});