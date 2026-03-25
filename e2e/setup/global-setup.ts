import { spawn } from 'child_process';
import path from 'path';

const waitOn = require('wait-on');

const g = globalThis as Record<string, any>;

export default async function globalSetup() {
  const port = 5199;
  const baseUrl = `http://localhost:${port}/agent-input/`;

  const demoDir = path.resolve(__dirname, '../../demo');
  const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
    cwd: demoDir,
    stdio: 'pipe',
    env: { ...process.env, BROWSER: 'none' },
    shell: true,
  });

  server.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString();
    if (!msg.includes('hmr') && !msg.includes('optimized')) {
      process.stderr.write(`[vite] ${msg}`);
    }
  });

  try {
    await waitOn({
      resources: [baseUrl],
      timeout: 30000,
      interval: 500,
    });
  } catch (err) {
    server.kill('SIGTERM');
    throw new Error(`Vite dev server failed to start on port ${port}: ${err}`);
  }

  g.__SERVER__ = server;
  g.__BASE_URL__ = baseUrl;

  const fs = require('fs');
  fs.writeFileSync(
    path.resolve(__dirname, '.server-info.json'),
    JSON.stringify({ port, baseUrl })
  );
}
