import type { NextRequest } from "next/server";
import crypto from "crypto";
import { validateSession } from "~/lib/session-validation";

function setCorsHeaders(res: Response) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
}

export const OPTIONS = () => {
  const res = new Response(null, { status: 204 });
  setCorsHeaders(res);
  return res;
};

export const GET = async (req: NextRequest) => {
  try {
    // validate session (optional for sign endpoint, but recommended)
    const session = await validateSession();
    if (!session) {
      const res = new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
      setCorsHeaders(res);
      return res;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "";
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const apiKey = process.env.CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

    // Build params string for Cloudinary signature
    let paramsToSign = `timestamp=${timestamp}`;
    if (uploadPreset) {
      paramsToSign += `&upload_preset=${uploadPreset}`;
    }

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    const body = {
      apiKey,
      cloudName,
      timestamp,
      signature,
      uploadPreset: uploadPreset || null,
    };

    const res = new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    setCorsHeaders(res);
    return res;
  } catch (err) {
    console.error("GET /api/uploads/sign error:", err);
    const res = new Response(
      JSON.stringify({
        error: "Failed to generate signature",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(res);
    return res;
  }
};