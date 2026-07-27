import type { Request, Response } from "express";
import { Router } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "ai-sidecar",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

export default router;
