import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
let searchDir = dirname(__filename);
for (let i = 0; i < 5; i++) {
  const candidate = resolve(searchDir, '.env');
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
  searchDir = resolve(searchDir, '..');
}

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
