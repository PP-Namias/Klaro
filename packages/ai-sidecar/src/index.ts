import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import ingestRouter from './routes/ingest.js';
import chatRouter from './routes/chat.js';
import chatStreamRouter from './routes/chat-stream.js';

const CORS_ORIGINS = process.env.CORS_ORIGINS ?? '*';

const app: Express = express();

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chat', chatStreamRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown internal error';
  console.error('[ai-sidecar] Unhandled error:', message);
  if (!res.headersSent) {
    res.status(500).json({ error: message });
  }
});

export default app;
