import path from 'path';
import fs from 'fs';

const g = globalThis as Record<string, any>;

export default async function globalTeardown() {
  if (g.__SERVER__) {
    g.__SERVER__.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      g.__SERVER__.kill('SIGKILL');
    } catch {
      // Already dead
    }
  }

  const infoPath = path.resolve(__dirname, '.server-info.json');
  if (fs.existsSync(infoPath)) {
    fs.unlinkSync(infoPath);
  }
}
