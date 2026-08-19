import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedRequest } from "./auth.js";

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return undefined;
}

export function tracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const traceId =
    firstHeader(req.headers["x-datadog-trace-id"]) ??
    firstHeader(req.headers["x-amzn-trace-id"]) ??
    randomUUID();

  req.headers["x-correlation-id"] = traceId;

  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    console.log(
      JSON.stringify({
        event: "http_request",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: durationMs,
        trace_id: traceId,
        tenant_id:
          (req as AuthenticatedRequest).user?.tenantId ?? "unauthenticated",
      }),
    );
  });

  next();
}
