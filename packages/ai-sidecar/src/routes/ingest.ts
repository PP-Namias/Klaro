import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { Document } from '@langchain/core/documents';
import { graph as ingestionGraph } from '../ingestion_graph/graph.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const router = Router();

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const doc = new Document({
      pageContent: '',
      metadata: {
        buffer: req.file.buffer,
        sourceFile: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uuid: crypto.randomUUID(),
      },
    });

    const result = await ingestionGraph.invoke({ docs: [doc] });

    res.json({
      status: 'ok',
      ingested: true,
      docCount: result.docs?.length ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ai-sidecar] Ingestion failed:', message);
    res.status(500).json({ error: message });
  }
});

router.use((err: any, _req: Request, res: Response, _next: any) => {
  if (err?.message?.startsWith?.('Unsupported file type')) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err?.code === 'LIMIT_FILE_SIZE' || err?.message?.includes?.('File too large')) {
    res.status(400).json({ error: 'File too large (max 20MB)' });
    return;
  }
  console.error('[ai-sidecar] Upload error:', err.message ?? err);
  res.status(500).json({ error: err.message ?? 'Upload failed' });
});

export default router;
