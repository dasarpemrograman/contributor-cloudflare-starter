import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

const base = process.argv[2];
assert(base, 'Pass the local Worker base URL.');
const deadline = Date.now() + 60000;
while (Date.now() < deadline) {
  try {
    const response = await fetch(new URL('/api/health', base), {
      signal: AbortSignal.timeout(1000),
    });
    if (response.ok && (await response.json()).status === 'ok') {
      console.log(`Worker ready: ${base}`);
      process.exit(0);
    }
  } catch {
    // Startup can briefly refuse connections while Wrangler starts workerd.
  }
  await setTimeout(500);
}
throw new Error(`Worker did not become healthy within 60 seconds: ${base}`);
