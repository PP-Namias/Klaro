import 'dotenv/config';
import app from './index.js';

const PORT = parseInt(process.env.PORT ?? '3002', 10);

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
