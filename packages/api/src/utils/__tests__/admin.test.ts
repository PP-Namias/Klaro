import { describe, expect, it } from "vitest";

function parseAdminEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminLogic(
  adminEmails: string[],
  session: { user?: { id?: string; email?: string } } | null,
): boolean {
  if (!session?.user?.id) return false;
  if (adminEmails.length === 0) return false;
  const email = session.user.email?.toLowerCase();
  if (!email) return false;
  return adminEmails.includes(email);
}

describe("isAdmin logic", () => {
  it("returns false when session has no user", () => {
    const adminEmails = parseAdminEmails("admin@example.com");
    expect(isAdminLogic(adminEmails, null)).toBe(false);
  });

  it("returns false when user has no id", () => {
    const adminEmails = parseAdminEmails("admin@example.com");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: undefined, email: "test@example.com" },
      }),
    ).toBe(false);
  });

  it("returns false when admin list is empty", () => {
    const adminEmails = parseAdminEmails("");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "admin@example.com" },
      }),
    ).toBe(false);
  });

  it("returns false when admin list is blank", () => {
    const adminEmails = parseAdminEmails(",,,");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "admin@example.com" },
      }),
    ).toBe(false);
  });

  it("returns true when user email matches admin email", () => {
    const adminEmails = parseAdminEmails("admin@example.com");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "admin@example.com" },
      }),
    ).toBe(true);
  });

  it("returns true when email case differs", () => {
    const adminEmails = parseAdminEmails("ADMIN@EXAMPLE.COM");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "admin@example.com" },
      }),
    ).toBe(true);
  });

  it("returns false when email not in admin list", () => {
    const adminEmails = parseAdminEmails("admin@example.com");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "user@example.com" },
      }),
    ).toBe(false);
  });

  it("handles multiple admin emails", () => {
    const adminEmails = parseAdminEmails(
      "admin1@example.com,admin2@example.com",
    );
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "admin1@example.com" },
      }),
    ).toBe(true);
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-2", email: "admin2@example.com" },
      }),
    ).toBe(true);
  });

  it("trims whitespace from admin emails", () => {
    const adminEmails = parseAdminEmails(
      " admin@example.com , other@example.com ",
    );
    expect(adminEmails).toEqual(["admin@example.com", "other@example.com"]);
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "admin@example.com" },
      }),
    ).toBe(true);
  });

  it("returns false when user has no email", () => {
    const adminEmails = parseAdminEmails("admin@example.com");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: undefined },
      }),
    ).toBe(false);
  });

  it("lowercases all emails for comparison", () => {
    const adminEmails = parseAdminEmails("Admin@Example.COM");
    expect(adminEmails).toEqual(["admin@example.com"]);
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "ADMIN@EXAMPLE.COM" },
      }),
    ).toBe(true);
  });
});

describe("requireAdmin logic", () => {
  it("returns true for admin", () => {
    const adminEmails = parseAdminEmails("admin@example.com");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "admin@example.com" },
      }),
    ).toBe(true);
  });

  it("returns false for non-admin", () => {
    const adminEmails = parseAdminEmails("admin@example.com");
    expect(
      isAdminLogic(adminEmails, {
        user: { id: "user-1", email: "user@example.com" },
      }),
    ).toBe(false);
  });
});
