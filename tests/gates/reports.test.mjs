import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const scripts = fileURLToPath(new URL('../../scripts/', import.meta.url));

test('changed-line coverage blocks untested additions and missing instrumentation', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-coverage-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'src'));
  await mkdir(join(directory, 'coverage'));
  const file = join(directory, 'src/example.ts');
  const git = (...args) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Gate Test',
        '-c',
        'user.email=gate@example.invalid',
        ...args,
      ],
      { cwd: directory, encoding: 'utf8' },
    );
  git('init');
  await writeFile(file, 'export const value = 0;\n');
  git('add', '.');
  git('commit', '-m', 'test: create coverage fixture');
  const base = git('rev-parse', 'HEAD').trim();
  await writeFile(file, 'export const value = 0;\nexport const other = 1;\n');
  git('add', '.');
  git('commit', '-m', 'feat: add fixture behavior');
  for (const [label, count, missing, valid] of [
    ['covered', 1, false, true],
    ['uncovered', 0, false, false],
    ['missing', 0, true, false],
  ]) {
    const coverage = missing
      ? {}
      : {
          [file]: {
            statementMap: { 0: { start: { line: 2 } } },
            s: { 0: count },
          },
        };
    await writeFile(
      join(directory, 'coverage/coverage-final.json'),
      JSON.stringify(coverage),
    );
    const result = spawnSync(
      process.execPath,
      [join(scripts, 'check-changed-coverage.mjs'), base],
      { cwd: directory },
    );
    assert.equal(result.status === 0, valid, label);
  }
  // Local gates must see uncommitted edits and untracked runtime files too.
  const cleanBase = git('rev-parse', 'HEAD').trim();
  await writeFile(file, 'export const value = 0;\nexport const other = 2;\n');
  const untrackedFile = join(directory, 'src/untracked.ts');
  await writeFile(untrackedFile, 'export const addition = 1;\n');
  for (const [count, valid] of [
    [0, false],
    [1, true],
  ]) {
    const report = {
      [file]: { statementMap: { 0: { start: { line: 2 } } }, s: { 0: count } },
      [untrackedFile]: {
        statementMap: { 0: { start: { line: 1 } } },
        s: { 0: count },
      },
    };
    await writeFile(
      join(directory, 'coverage/coverage-final.json'),
      JSON.stringify(report),
    );
    const result = spawnSync(
      process.execPath,
      [
        join(scripts, 'check-changed-coverage.mjs'),
        cleanBase,
        '--working-tree',
      ],
      { cwd: directory, encoding: 'utf8' },
    );
    assert.equal(result.status === 0, valid, result.stdout + result.stderr);
    assert.match(result.stdout, /\/2,/);
  }
});

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
