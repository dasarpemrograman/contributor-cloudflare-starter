import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { run } from '../../scripts/quality/process.mjs';
import { startWorker } from '../../scripts/quality/worker.mjs';

test('failed subprocesses cannot produce successful quality stages', async () => {
  await assert.rejects(
    run(process.execPath, ['-e', 'process.exit(7)']),
    /failed \(7\)/,
  );
});

test('the audit Worker becomes healthy and its cleanup is idempotent', async (context) => {
  const worker = await startWorker();
  context.after(() => worker.stop());
  const response = await fetch(`${worker.url}/api/health`);
  assert.deepEqual(await response.json(), { status: 'ok' });
  worker.stop();
  worker.stop();
  let stopped = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await fetch(`${worker.url}/api/health`, {
        signal: AbortSignal.timeout(100),
      });
    } catch {
      stopped = true;
      break;
    }
    await setTimeout(100);
  }
  assert(stopped, 'Audit Worker remained reachable after cleanup.');
});
