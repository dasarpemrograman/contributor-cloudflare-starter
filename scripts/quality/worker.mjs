import { createServer } from 'node:net';
import { spawn, execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';

async function freePort() {
  const socket = createServer();
  await new Promise((accept, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', accept);
  });
  const port = socket.address().port;
  await new Promise((accept, reject) =>
    socket.close((error) => (error ? reject(error) : accept())),
  );
  return port;
}

function cleanup(child) {
  let stopped = false;
  return () => {
    if (stopped || child.exitCode !== null || child.signalCode || !child.pid)
      return;
    stopped = true;
    if (process.platform === 'win32')
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    else {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  };
}

async function waitUntilHealthy(child, url, getFailure) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (getFailure()) throw getFailure();
    if (child.exitCode !== null)
      throw new Error('The audit Worker exited before it was ready.');
    try {
      const response = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok && (await response.json()).status === 'ok') return;
    } catch {
      /* Wait for startup; no external services are used. */
    }
    await setTimeout(200);
  }
  throw new Error('The audit Worker did not become healthy within 60 seconds.');
}

export async function startWorker({ dockerReachable = false } = {}) {
  const port = await freePort();
  // Docker Desktop reaches host services through its host gateway. The temporary
  // audit Worker uses all interfaces there and loopback on native Linux.
  const host =
    dockerReachable && process.platform !== 'linux' ? '0.0.0.0' : '127.0.0.1';
  const child = spawn(
    process.execPath,
    [
      resolve('node_modules/wrangler/bin/wrangler.js'),
      'dev',
      '--ip',
      host,
      '--port',
      String(port),
    ],
    {
      stdio: ['ignore', 'inherit', 'inherit'],
      windowsHide: true,
      detached: process.platform !== 'win32',
    },
  );
  let failure;
  child.on('error', (error) => {
    failure = error;
  });
  const stop = cleanup(child);
  const url = `http://127.0.0.1:${port}`;
  try {
    await waitUntilHealthy(child, url, () => failure);
    return { url, port, stop };
  } catch (error) {
    stop();
    throw error;
  }
}
