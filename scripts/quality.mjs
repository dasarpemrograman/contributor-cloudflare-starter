import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { prerequisites } from './quality/tools.mjs';
import { node } from './quality/process.mjs';
import * as stages from './quality/stages.mjs';

const full = ['core', 'maintainability', 'security', 'codeql', 'browser'];
const report = { profile: '', complete: false, stages: [] };

function options() {
  const { values } = parseArgs({
    options: {
      full: { type: 'boolean' },
      doctor: { type: 'boolean' },
      setup: { type: 'boolean' },
      stage: { type: 'string' },
      base: { type: 'string', default: 'origin/main' },
    },
  });
  if (Number(process.versions.node.split('.')[0]) !== 24)
    throw new Error('Use Node.js 24, as specified in .node-version.');
  const profiles = [
    values.full,
    values.doctor,
    values.setup,
    values.stage,
  ].filter(Boolean);
  if (profiles.length > 1)
    throw new Error('Choose one of --full, --doctor, --setup or --stage.');
  const selected =
    values.doctor || values.full ? full : [values.stage ?? 'core'];
  if (selected.some((name) => !full.includes(name)))
    throw new Error(`Unknown stage. Choose: ${full.join(', ')}.`);
  return { values, selected };
}

function verifyBase(base) {
  try {
    execFileSync('git', ['rev-parse', '--verify', `${base}^{commit}`], {
      stdio: 'ignore',
    });
  } catch {
    throw new Error(
      `Base ${base} is unavailable. Fetch origin, or pass --base HEAD for an initial local repository.`,
    );
  }
}

async function saveReport() {
  await mkdir('reports/quality', { recursive: true });
  await writeFile(
    'reports/quality/local.json',
    JSON.stringify(report, null, 2) + '\n',
  );
}

async function executeStage(name, base) {
  const entry = { name, status: 'running', seconds: 0 };
  report.stages.push(entry);
  console.log(`\n[quality] ${name}`);
  const started = performance.now();
  try {
    await stages[name](base);
    entry.status = 'passed';
  } catch (error) {
    entry.status = 'failed';
    throw error;
  } finally {
    entry.seconds = Number(((performance.now() - started) / 1000).toFixed(2));
  }
}

async function main() {
  const { values, selected } = options();
  if (values.setup) {
    report.profile = 'setup';
    await saveReport();
    await node('node_modules/@playwright/test/cli.js', ['install', 'chromium']);
    console.log(
      'Chromium installed. Run npm run quality:doctor for the external scanner prerequisites.',
    );
    report.complete = true;
    return;
  }
  report.profile = values.doctor ? 'doctor' : selected.join(',');
  // Invalidate a prior result before running: interruption must not leave a
  // stale successful report for the current invocation.
  await saveReport();
  const missing = await prerequisites(selected);
  if (missing.length)
    throw new Error(
      `Missing prerequisites:\n${missing.map((item) => `- ${item}`).join('\n')}`,
    );
  if (values.doctor) {
    console.log('All full-profile prerequisites are ready.');
    report.complete = true;
    return;
  }
  if (selected.includes('core')) verifyBase(values.base);
  for (const name of selected) await executeStage(name, values.base);
  report.complete = true;
  console.log(
    `\nPassed: ${selected.join(', ')}. Reports: reports/quality/local.json`,
  );
  if (selected.length === 1 && selected[0] === 'core')
    console.log(
      'Run npm run quality:full for scanner, browser, accessibility, performance and DAST gates.',
    );
}

try {
  await main();
} catch (error) {
  report.error = error.message;
  console.error(`\n[quality] ${error.message}`);
  process.exitCode = 1;
} finally {
  await saveReport();
}
