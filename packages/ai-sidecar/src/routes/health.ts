import type { Request, Response } from "express";
import { Router } from "express";

import { checkVectorStoreHealth } from "../shared/retrieval.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    await checkVectorStoreHealth();
    res.json({
      status: "healthy",
      service: "ai-sidecar",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[HealthCheck] Service degraded:", error);
    res.status(503).json({
      status: "degraded",
      error: "Vector store unreachable",
    });
  }
});

export default router;
