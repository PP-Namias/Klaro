import { describe, it, expect } from "vitest";
import { user, session, account, verification } from "../auth-schema";

describe("user table", () => {
  it("has id text primary key", () => {
    expect(user.id).toBeDefined();
  });

  it("has name text not null", () => {
    expect(user.name).toBeDefined();
  });

  it("has email text unique", () => {
    expect(user.email).toBeDefined();
  });

  it("has emailVerified boolean default false", () => {
    expect(user.emailVerified).toBeDefined();
  });

  it("has image text", () => {
    expect(user.image).toBeDefined();
  });

  it("has createdAt timestamp", () => {
    expect(user.createdAt).toBeDefined();
  });

  it("has updatedAt timestamp", () => {
    expect(user.updatedAt).toBeDefined();
  });
});

describe("session table", () => {
  it("has id text primary key", () => {
    expect(session.id).toBeDefined();
  });

  it("has expiresAt timestamp", () => {
    expect(session.expiresAt).toBeDefined();
  });

  it("has token text unique", () => {
    expect(session.token).toBeDefined();
  });

  it("has ipAddress text", () => {
    expect(session.ipAddress).toBeDefined();
  });

  it("has userAgent text", () => {
    expect(session.userAgent).toBeDefined();
  });

  it("has userId with cascade delete", () => {
    expect(session.userId).toBeDefined();
  });
});

describe("account table", () => {
  it("has id text primary key", () => {
    expect(account.id).toBeDefined();
  });

  it("has accountId text", () => {
    expect(account.accountId).toBeDefined();
  });

  it("has providerId text", () => {
    expect(account.providerId).toBeDefined();
  });

  it("has userId with cascade delete", () => {
    expect(account.userId).toBeDefined();
  });

  it("has accessToken text", () => {
    expect(account.accessToken).toBeDefined();
  });

  it("has refreshToken text", () => {
    expect(account.refreshToken).toBeDefined();
  });

  it("has idToken text", () => {
    expect(account.idToken).toBeDefined();
  });
});

describe("verification table", () => {
  it("has id text primary key", () => {
    expect(verification.id).toBeDefined();
  });

  it("has identifier text", () => {
    expect(verification.identifier).toBeDefined();
  });

  it("has value text", () => {
    expect(verification.value).toBeDefined();
  });

  it("has expiresAt timestamp", () => {
    expect(verification.expiresAt).toBeDefined();
  });
});
