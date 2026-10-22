import { mkdir, open, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tools, zapImage } from './tools.mjs';
import { node, npm, run } from './process.mjs';
import { startWorker } from './worker.mjs';

export async function core(base) {
  await npm('check');
  await npm('check:bundle');
  await npm('commitlint:history');
  await node('scripts/check-changed-coverage.mjs', [base, '--working-tree']);
}

export async function maintainability() {
  await mkdir('reports', { recursive: true });
  await run(tools.qlty(), ['config', 'validate']);
  const file = await open('reports/maintainability.sarif', 'w');
  try {
    await run(tools.qlty(), ['smells', '--all', '--sarif'], {
      stdio: ['ignore', file.fd, 'inherit'],
    });
  } finally {
    await file.close();
  }
  await node('scripts/check-sarif.mjs', ['reports/maintainability.sarif']);
}

export async function security() {
  await mkdir('reports', { recursive: true });
  const flags = [
    'fs',
    '--skip-dirs',
    'node_modules,.git,.wrangler,reports',
    '--include-dev-deps',
  ];
  await run(tools.trivy(), [
    ...flags,
    '--format',
    'cyclonedx',
    '--output',
    'reports/sbom.cdx.json',
    '.',
  ]);
  await run(tools.trivy(), [
    ...flags,
    '--scanners',
    'vuln,secret,misconfig',
    '--severity',
    'HIGH,CRITICAL',
    '--exit-code',
    '1',
    '.',
  ]);
}

export async function codeql() {
  await mkdir('reports/codeql', { recursive: true });
  await run(tools.codeql(), [
    'database',
    'create',
    'reports/codeql-db',
    '--language=javascript-typescript',
    '--source-root=.',
    '--build-mode=none',
    '--overwrite',
    '--codescanning-config=.github/codeql/config.yml',
  ]);
  await run(tools.codeql(), [
    'database',
    'analyze',
    'reports/codeql-db',
    '--download',
    '--format=sarif-latest',
    '--output=reports/codeql/javascript.sarif',
  ]);
  await node('scripts/check-sarif.mjs', ['reports/codeql']);
}

export async function browser() {
  await npm('test:e2e');
  const worker = await startWorker({ dockerReachable: true });
  const onInterrupt = () => {
    worker.stop();
    process.exit(130);
  };
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onInterrupt);
  try {
    const { chromium } = await import('@playwright/test');
    await node('scripts/check-performance.mjs', [worker.url], {
      env: {
        ...process.env,
        CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath(),
      },
    });
    const directory = resolve('reports/zap');
    await mkdir(directory, { recursive: true });
    if (process.platform !== 'win32') await chmod(directory, 0o777);
    const linux = process.platform === 'linux';
    const network = linux ? ['--network', 'host'] : [];
    const target = linux
      ? worker.url
      : `http://host.docker.internal:${worker.port}`;
    await run(tools.docker(), [
      'run',
      '--rm',
      ...network,
      '-v',
      `${directory}:/zap/wrk:rw`,
      zapImage,
      'zap-baseline.py',
      '-t',
      target,
      '-J',
      'zap.json',
      '-r',
      'zap.html',
      '-I',
      '-m',
      '1',
      '-T',
      '5',
    ]);
    await node('scripts/check-zap.mjs', ['reports/zap/zap.json']);
  } finally {
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onInterrupt);
    worker.stop();
  }
}
