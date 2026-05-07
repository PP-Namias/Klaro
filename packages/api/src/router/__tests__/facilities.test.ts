import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { createTRPCContext } from "../../trpc";
import { appRouter } from "../../root";

type TrpcContext = Awaited<ReturnType<typeof createTRPCContext>>;

interface FacilityRow {
  id: string;
  name: string;
  facilityType: string;
  ownership: "public" | "private";
  address: string;
  latitude: string | null;
  longitude: string | null;
  phoneNumber?: string | null;
  isPhilHealthAccredited: boolean;
  acceptedSpecialties?: string[] | null;
  openingHours?: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
}

const createDbStub = (rows: FacilityRow[]) => {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => rows,
    offset: () => rows,
  };

  return {
    select: () => chain,
  } as unknown as TrpcContext["db"];
};

const createAuthApiStub = () =>
  ({
    getSession: async () => null,
  }) as unknown as TrpcContext["authApi"];

const createSessionStub = () =>
  ({
    user: {
      id: "user-1",
      email: "user@klaro.local",
      name: "Test User",
    },
  }) as unknown as TrpcContext["session"];

const createCaller = (rows: FacilityRow[]) => {
  const context = {
    authApi: createAuthApiStub(),
    session: createSessionStub(),
    db: createDbStub(rows),
    traceId: "test-trace",
  } as TrpcContext;

  return appRouter.createCaller(context);
};

describe("facilities router", () => {
  it("returns nearby facilities sorted by distance", async () => {
    const caller = createCaller([
      {
        id: "fac-1",
        name: "Makati Medical Center",
        facilityType: "hospital",
        ownership: "private",
        address: "Makati, Metro Manila",
        latitude: "14.5592",
        longitude: "121.0145",
        isPhilHealthAccredited: true,
        acceptedSpecialties: ["General Medicine"],
        createdAt: new Date("2026-05-05T00:00:00Z"),
        updatedAt: new Date("2026-05-05T00:00:00Z"),
      },
      {
        id: "fac-2",
        name: "Pasig Clinic",
        facilityType: "clinic",
        ownership: "private",
        address: "Pasig, Metro Manila",
        latitude: "14.5760",
        longitude: "121.0580",
        isPhilHealthAccredited: false,
        acceptedSpecialties: ["Internal Medicine"],
        createdAt: new Date("2026-05-05T00:00:00Z"),
        updatedAt: new Date("2026-05-05T00:00:00Z"),
      },
    ]);

    const result = await caller.facilities.searchNearby({
      latitude: 14.58,
      longitude: 121.03,
      radiusKm: 20,
      limit: 10,
    });

    assert.equal(result.length, 2);
    assert.equal(result[0]?.name, "Makati Medical Center");
    assert.ok((result[0]?.distance ?? 0) < (result[1]?.distance ?? 0));
  });

  it("filters facilities by specialty", async () => {
    const caller = createCaller([
      {
        id: "fac-1",
        name: "Makati Medical Center",
        facilityType: "hospital",
        ownership: "private",
        address: "Makati, Metro Manila",
        latitude: "14.5592",
        longitude: "121.0145",
        isPhilHealthAccredited: true,
        acceptedSpecialties: ["Cardiology", "Neurology"],
        createdAt: new Date("2026-05-05T00:00:00Z"),
        updatedAt: new Date("2026-05-05T00:00:00Z"),
      },
      {
        id: "fac-2",
        name: "Pasig Clinic",
        facilityType: "clinic",
        ownership: "private",
        address: "Pasig, Metro Manila",
        latitude: "14.5760",
        longitude: "121.0580",
        isPhilHealthAccredited: false,
        acceptedSpecialties: ["Internal Medicine"],
        createdAt: new Date("2026-05-05T00:00:00Z"),
        updatedAt: new Date("2026-05-05T00:00:00Z"),
      },
    ]);

    const result = await caller.facilities.searchBySpecialty({
      specialty: "Cardiology",
      limit: 10,
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.name, "Makati Medical Center");
  });

  it("rejects invalid latitude when searching nearby", async () => {
    const caller = createCaller([]);

    await assert.rejects(
      caller.facilities.searchNearby({
        latitude: 91,
        longitude: 121.03,
        radiusKm: 10,
        limit: 10,
      }),
      (error) => {
        const err = error as { code?: string };
        assert.equal(err.code, "BAD_REQUEST");
        return true;
      },
    );
  });
});
