import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { createTRPCContext } from "../../trpc";
import { appRouter } from "../../root";

type TrpcContext = Awaited<ReturnType<typeof createTRPCContext>>;

interface DoctorRow {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  prcStatus: "pending" | "verified" | "expired" | "rejected";
  bio: string | null;
  profileImageUrl: string | null;
  pricePerSession: string;
  availableSessionTypes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const createDbStub = (options: {
  selectPlans: {
    rows: DoctorRow[];
    final: "where" | "offset";
  }[];
  insertRow?: DoctorRow;
  updateRow?: DoctorRow;
}) => {
  let selectIndex = 0;

  const makeSelectChain = (plan: {
    rows: DoctorRow[];
    final: "where" | "offset";
  }) => ({
    from: () => makeSelectChain(plan),
    where: () => (plan.final === "where" ? plan.rows : makeSelectChain(plan)),
    limit: () => makeSelectChain(plan),
    offset: () => plan.rows,
  });

  const insertChain = {
    values: () => ({
      returning: async () => (options.insertRow ? [options.insertRow] : []),
    }),
  };

  const updateChain = {
    set: () => ({
      where: () => ({
        returning: async () => (options.updateRow ? [options.updateRow] : []),
      }),
    }),
  };

  return {
    select: () => {
      const plan = options.selectPlans[selectIndex] ??
        options.selectPlans.at(-1) ?? {
          rows: [],
          final: "where" as const,
        };
      selectIndex += 1;
      return makeSelectChain(plan);
    },
    insert: () => insertChain,
    update: () => updateChain,
  } as unknown as TrpcContext["db"];
};

const createAuthApiStub = () =>
  ({
    getSession: async () => null,
  }) as unknown as TrpcContext["authApi"];

const createSessionStub = (userId = "user-1") =>
  ({
    user: {
      id: userId,
      email: "doctor@klaro.local",
      name: "Test Doctor",
    },
  }) as unknown as TrpcContext["session"];

const createCaller = (db: TrpcContext["db"], session = createSessionStub()) => {
  const context = {
    authApi: createAuthApiStub(),
    session,
    db,
    traceId: "test-trace",
  } as TrpcContext;

  return appRouter.createCaller(context);
};

const baseDoctorRow: DoctorRow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "user-1",
  name: "Dr. Luis Navarro",
  specialization: "Internal Medicine",
  licenseNumber: "PRC-IM-2024-0917",
  prcStatus: "verified",
  bio: "Focused on preventative care and metabolic health.",
  profileImageUrl: null,
  pricePerSession: "1500.00",
  availableSessionTypes: ["chat_consult", "video_consult"],
  isActive: true,
  createdAt: new Date("2026-05-05T00:00:00Z"),
  updatedAt: new Date("2026-05-05T00:00:00Z"),
};

describe("doctor router", () => {
  it("creates a doctor registration and returns the new id", async () => {
    const caller = createCaller(
      createDbStub({
        selectPlans: [{ rows: [], final: "where" }],
        insertRow: {
          ...baseDoctorRow,
          id: "doctor-new",
          userId: "user-1",
          prcStatus: "pending",
          isActive: false,
        },
      }),
    );

    const result = await caller.doctor.register({
      name: "Dr. Ana Cruz",
      specialization: "Cardiology",
      licenseNumber: "PRC-CARD-2024-0110",
      bio: "Heart health and lifestyle coaching.",
      pricePerSession: 2000,
      availableSessionTypes: ["chat_consult", "video_consult"],
    });

    assert.equal(result.id, "doctor-new");
    assert.equal(result.status, "pending_verification");
  });

  it("lists active doctors through the new listDoctors alias", async () => {
    const caller = createCaller(
      createDbStub({
        selectPlans: [
          {
            rows: [
              baseDoctorRow,
              {
                ...baseDoctorRow,
                id: "550e8400-e29b-41d4-a716-446655440001",
                name: "Dr. Camille Reyes",
              },
            ],
            final: "offset",
          },
        ],
      }),
    );

    const result = await caller.doctor.list({
      specialization: "Internal",
      limit: 10,
      offset: 0,
    });

    assert.equal(result.length, 2);
    assert.equal(result[0]?.name, "Dr. Luis Navarro");
  });

  it("returns a doctor profile through getDoctorById", async () => {
    const caller = createCaller(
      createDbStub({
        selectPlans: [{ rows: [baseDoctorRow], final: "where" }],
      }),
    );

    const result = await caller.doctor.byId({ id: baseDoctorRow.id });

    assert.equal(result.id, baseDoctorRow.id);
    assert.equal(result.specialization, "Internal Medicine");
  });

  it("updates the signed-in doctor's profile", async () => {
    const caller = createCaller(
      createDbStub({
        selectPlans: [{ rows: [baseDoctorRow], final: "where" }],
        updateRow: {
          ...baseDoctorRow,
          name: "Dr. Luis Navarro, MD",
          pricePerSession: "1750.00",
        },
      }),
    );

    const result = await caller.doctor.update({
      id: baseDoctorRow.id,
      name: "Dr. Luis Navarro, MD",
      pricePerSession: 1750,
    });

    assert.equal(result.success, true);
    assert.equal(result.doctor.name, "Dr. Luis Navarro, MD");
  });

  it("toggles PRC verification through the admin alias", async () => {
    const caller = createCaller(
      createDbStub({
        selectPlans: [{ rows: [baseDoctorRow], final: "where" }],
        updateRow: {
          ...baseDoctorRow,
          prcStatus: "verified",
          isActive: true,
        },
      }),
    );

    const result = await caller.admin.togglePrcVerification({
      doctorId: baseDoctorRow.id,
      approved: true,
      reason: "Verified against the PRC registry.",
    });

    assert.equal(result.success, true);
    assert.equal(result.status, "verified");
    assert.equal(result.doctorId, baseDoctorRow.id);
  });
});
