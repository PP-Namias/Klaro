import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { appRouter } from "../../root";
import type { createTRPCContext } from "../../trpc";

type TrpcContext = Awaited<ReturnType<typeof createTRPCContext>>;

type AvailabilityRow = {
  id: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
};

const makeDbStub = (opts: {
  findDoctorByUser?: AvailabilityRow[] | null; // reuse shape but for doctor row tests we just return existence
  availabilityRows?: AvailabilityRow[];
  insertRow?: AvailabilityRow;
  updateRow?: AvailabilityRow;
}) => {
  const selectCalls: any[] = [];

  const selectChain = {
    from: () => selectChain,
    where: () => {
      // emulate returning rows for first select and then availability rows when called
      return selectChain;
    },
    limit: () => opts.availabilityRows ?? [],
    offset: () => opts.availabilityRows ?? [],
  } as any;

  const insertChain = {
    values: () => ({
      returning: async () => (opts.insertRow ? [opts.insertRow] : []),
    }),
  };

  const updateChain = {
    set: () => ({
      where: () => ({
        returning: async () => (opts.updateRow ? [opts.updateRow] : []),
      }),
    }),
  };

  const deleteChain = {
    where: () => ({}),
  };

  return {
    select: () => selectChain,
    insert: () => insertChain,
    update: () => updateChain,
    delete: () => deleteChain,
  } as unknown as TrpcContext["db"];
};

const createAuthApiStub = () => ({ getSession: async () => null }) as unknown as TrpcContext["authApi"];

const createSessionStub = (userId = "user-1") => ({ user: { id: userId, email: "doc@k.local", name: "Doctor" } }) as unknown as TrpcContext["session"];

const createCaller = (db: TrpcContext["db"], session = createSessionStub()) => {
  const ctx = { authApi: createAuthApiStub(), session, db, traceId: "t" } as TrpcContext;
  return appRouter.createCaller(ctx);
};

describe("doctor availability", () => {
  it("creates availability for signed-in doctor", async () => {
    const availability: AvailabilityRow = {
      id: "550e8400-e29b-41d4-a716-446655440100",
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      dayOfWeek: "Monday",
      startTime: "09:00:00",
      endTime: "12:00:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = makeDbStub({ insertRow: availability, availabilityRows: [availability] });
    const caller = createCaller(db);

    const res = await caller.doctor.createAvailability({ dayOfWeek: availability.dayOfWeek, startTime: availability.startTime, endTime: availability.endTime });
    assert.equal(res.success, true);
    assert.equal(res.availability.id, availability.id);
  });

  it("lists availability for a doctor", async () => {
    const availability: AvailabilityRow = {
      id: "550e8400-e29b-41d4-a716-446655440101",
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      dayOfWeek: "Wednesday",
      startTime: "13:00:00",
      endTime: "17:00:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = makeDbStub({ availabilityRows: [availability] });
    const caller = createCaller(db, null as any);

    const rows = await caller.doctor.listAvailability({ doctorId: availability.doctorId });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].dayOfWeek, "Wednesday");
  });
});
