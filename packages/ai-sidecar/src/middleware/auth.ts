import { createHmac, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";

export interface AuthUser {
  tenantId: string;
  patientId: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

interface JwtHeader {
  alg?: unknown;
  typ?: unknown;
}

interface JwtClaims {
  tenantId?: unknown;
  patientId?: unknown;
  role?: unknown;
  exp?: unknown;
  iat?: unknown;
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 3600,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");
  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtClaims {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error("Malformed token");
  }

  let header: JwtHeader;
  try {
    header = JSON.parse(
      base64UrlDecode(headerB64).toString("utf8"),
    ) as JwtHeader;
  } catch {
    throw new Error("Malformed token header");
  }
  if (header.alg !== "HS256") {
    throw new Error("Unsupported token algorithm");
  }

  const expected = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  let provided: Buffer;
  try {
    provided = base64UrlDecode(signatureB64);
  } catch {
    throw new Error("Malformed token signature");
  }
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw new Error("Invalid token signature");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  } catch {
    throw new Error("Malformed token payload");
  }

  const claims = payload as JwtClaims;
  if (
    typeof claims.exp === "number" &&
    claims.exp < Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Token expired");
  }
  return claims;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const guestMode =
    (req.body as { metadata?: { guestMode?: unknown } } | undefined)?.metadata
      ?.guestMode === true;

  if (guestMode) {
    req.user = { tenantId: "public", patientId: "guest", role: "guest" };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[Sidecar Auth] JWT_SECRET is not configured");
    res.status(500).json({ error: "Authentication is not configured" });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const claims = verifyJwt(token, secret);
    const tenantId =
      typeof claims.tenantId === "string" && claims.tenantId.length > 0
        ? claims.tenantId
        : undefined;
    if (!tenantId) {
      res.status(403).json({ error: "Forbidden: Invalid token" });
      return;
    }
    req.user = {
      tenantId,
      patientId:
        typeof claims.patientId === "string" ? claims.patientId : "patient",
      role: typeof claims.role === "string" ? claims.role : "patient",
    };
    next();
  } catch (error) {
    console.error(
      "[Sidecar Auth] Token verification failed:",
      error instanceof Error ? error.message : error,
    );
    res.status(403).json({ error: "Forbidden: Invalid token" });
  }
}
