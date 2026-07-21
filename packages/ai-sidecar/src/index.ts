import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';

const PORT = parseInt(process.env.PORT ?? '3002', 10);
const CORS_ORIGINS = process.env.CORS_ORIGINS ?? '*';

const app: Express = express();

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

app.use('/api/health', healthRouter);

const server = app.listen(PORT, () => {
  console.log(`[ai-sidecar] Listening on http://localhost:${PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`[ai-sidecar] Received ${signal}, shutting down...`);
  server.close(() => {
    console.log('[ai-sidecar] Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
