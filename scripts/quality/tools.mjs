import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export const tools = {
  qlty: () => process.env.QLTY_PATH || 'qlty',
  trivy: () => process.env.TRIVY_PATH || 'trivy',
  codeql: () => process.env.CODEQL_PATH || 'codeql',
  docker: () => process.env.DOCKER_PATH || 'docker',
};
export const zapImage =
  'ghcr.io/zaproxy/zaproxy:2.17.0@sha256:5ccfff9a411743ab2615136a2edd7416bec9ce41572fa94e935df38c14adb2b6';

const instructions = {
  qlty: 'Install Qlty CLI: https://docs.qlty.sh/cli (CI uses 0.661.0).',
  trivy:
    'Install Trivy 0.76.1: https://trivy.dev/latest/getting-started/installation/.',
  codeql:
    'Install the CodeQL CLI bundle 2.27.3: https://github.com/github/codeql-action/releases/tag/codeql-bundle-v2.27.3.',
  docker:
    'Start a Linux Docker engine. Docker Desktop should use Linux containers.',
};

function availableTool(name) {
  const args =
    name === 'docker' ? ['info', '--format', '{{.OSType}}'] : ['--version'];
  if (name === 'codeql')
    args.splice(0, args.length, 'version', '--format=json');
  const result = spawnSync(tools[name](), args, {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  });
  const available = !result.error && result.status === 0;
  const linuxEngine = name !== 'docker' || result.stdout?.trim() === 'linux';
  if (!available || !linuxEngine) return false;
  console.log(`[ready] ${name}: ${result.stdout.trim().split('\n')[0]}`);
  return true;
}

export async function prerequisites(stages) {
  const stageTools = {
    maintainability: 'qlty',
    security: 'trivy',
    codeql: 'codeql',
    browser: 'docker',
  };
  const required = new Set(
    stages.map((name) => stageTools[name]).filter(Boolean),
  );
  const missing = [];
  for (const name of required) {
    if (!availableTool(name)) missing.push(instructions[name]);
  }
  if (stages.includes('browser')) {
    const { chromium } = await import('@playwright/test');
    if (!existsSync(chromium.executablePath()))
      missing.push('Install Chromium: npm run quality:setup');
  }
  return missing;
}
