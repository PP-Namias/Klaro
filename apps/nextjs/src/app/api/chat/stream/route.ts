/* eslint-disable no-restricted-properties -- server-side env access, validated via turbo globalEnv */
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProxyBody {
  content?: unknown;
  history?: unknown;
  image?: unknown;
  metadata?: { threadId?: unknown; tenantId?: unknown };
}

const IMAGE_DATA_URI = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ProxyBody;

    if (typeof body.content !== "string" || !body.content.trim()) {
      return Response.json(
        { error: "content is required in the request body" },
        { status: 400 },
      );
    }

    const messages = Array.isArray(body.history)
      ? body.history.map((msg) => {
          const m = msg as { role?: string; content?: unknown };
          return {
            role: m.role === "user" ? "user" : "assistant",
            content: String(m.content ?? ""),
          };
        })
      : [];

    const image =
      typeof body.image === "string" && IMAGE_DATA_URI.test(body.image)
        ? body.image
        : undefined;

    if (image && image.length > MAX_IMAGE_BYTES) {
      return Response.json(
        { error: "Image payload too large" },
        { status: 413 },
      );
    }

    const sidecarUrl = process.env.AI_SIDECAR_URL ?? "http://localhost:3002";

    const authHeader = req.headers.get("Authorization");
    const isGuest = !authHeader;
    const tenantId =
      typeof body.metadata?.tenantId === "string"
        ? body.metadata.tenantId
        : undefined;
    const threadId =
      typeof body.metadata?.threadId === "string"
        ? body.metadata.threadId
        : undefined;

    const response = await fetch(`${sidecarUrl}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        question: body.content,
        messages,
        ...(image ? { image } : {}),
        metadata: {
          guestMode: isGuest,
          tenantId: isGuest ? "public" : (tenantId ?? undefined),
          ...(threadId ? { threadId } : {}),
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorBody: unknown = null;
      try {
        errorBody = JSON.parse(errorText) as unknown;
      } catch {
        errorBody = null;
      }
      if (errorBody && typeof errorBody === "object") {
        return Response.json(errorBody, { status: response.status });
      }
      return Response.json(
        { error: errorText || "Sidecar request failed" },
        { status: response.status },
      );
    }

    if (!response.body) {
      throw new Error(`Sidecar streaming failed: ${response.statusText}`);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[ChatProxy] SSE Proxy Error:", error);
    return Response.json({ error: "Streaming proxy failed" }, { status: 500 });
  }
}
