import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const scripts = fileURLToPath(new URL('../../scripts/', import.meta.url));

test('SARIF policy fails on findings and malformed reports', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-sarif-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  for (const [name, report, valid] of [
    ['clean', { runs: [{ results: [] }] }, true],
    [
      'finding',
      {
        runs: [
          { results: [{ ruleId: 'example', message: { text: 'Finding' } }] },
        ],
      },
      false,
    ],
    ['empty', { runs: [] }, false],
    [
      'scanner-error',
      { runs: [{ invocations: [{ executionSuccessful: false }] }] },
      false,
    ],
  ]) {
    const file = join(directory, `${name}.sarif`);
    await writeFile(file, JSON.stringify(report));
    const result = spawnSync(process.execPath, [
      join(scripts, 'check-sarif.mjs'),
      file,
    ]);
    assert.equal(result.status === 0, valid, name);
  }
});

test('DAST policy blocks medium/high risks and missing reports', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-zap-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'reports'));
  for (const [name, report, valid] of [
    ['clean', { site: [{ alerts: [] }] }, true],
    ['low', { site: [{ alerts: [{ riskcode: '1' }] }] }, true],
    [
      'medium',
      {
        site: [
          { alerts: [{ riskcode: '2', pluginid: 'example', name: 'Finding' }] },
        ],
      },
      false,
    ],
    ['missing', { site: [] }, false],
    ['invalid', { site: [{ alerts: [{ riskcode: 'unknown' }] }] }, false],
  ]) {
    await writeFile(
      join(directory, 'reports/zap.json'),
      JSON.stringify(report),
    );
    const result = spawnSync(
      process.execPath,
      [join(scripts, 'check-zap.mjs')],
      { cwd: directory },
    );
    assert.equal(result.status === 0, valid, name);
  }
});
