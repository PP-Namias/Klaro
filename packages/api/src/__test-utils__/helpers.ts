import { expect, vi, type Mock } from "vitest";

export const createMockContext = (overrides?: Record<string, unknown>): Record<string, unknown> => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  },
  session: {
    id: "test-session-id",
    userId: "test-user-id",
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
    },
  },
  ...overrides,
});

export const createMockRouter = (): Record<string, unknown> => ({
  createCaller: vi.fn(),
});

export const createMockRequest = (overrides?: Record<string, unknown>) =>
  new Request("http://localhost:3000/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...overrides,
  });

export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
