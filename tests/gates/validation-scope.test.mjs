import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  copyFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('the tooling project actually typechecks browser tests', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'quality-tooling-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'tests/browser'), { recursive: true });
  await copyFile(join(root, 'tsconfig.json'), join(directory, 'tsconfig.json'));
  const config = JSON.parse(
    await readFile(join(root, 'tsconfig.tooling.json'), 'utf8'),
  );
  config.compilerOptions.typeRoots = [join(root, 'node_modules/@types')];
  await writeFile(
    join(directory, 'tsconfig.tooling.json'),
    JSON.stringify(config),
  );
  const file = join(directory, 'tests/browser/example.ts');
  const compile = () =>
    spawnSync(
      process.execPath,
      [
        join(root, 'node_modules/typescript/bin/tsc'),
        '--project',
        join(directory, 'tsconfig.tooling.json'),
        '--noEmit',
      ],
      { encoding: 'utf8' },
    );
  await writeFile(file, 'const value: string = "valid"; export { value };\n');
  assert.equal(compile().status, 0);
  await writeFile(file, 'const value: string = 123; export { value };\n');
  const result = compile();
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /TS2322/);
});

test('the lint configuration covers host tooling and rejects undefined variables', () => {
  const lint = (input) =>
    spawnSync(
      process.execPath,
      [
        join(root, 'node_modules/eslint/bin/eslint.js'),
        '--stdin',
        '--stdin-filename',
        'scripts/quality-probe.mjs',
      ],
      { cwd: root, input, encoding: 'utf8' },
    );
  assert.equal(lint('console.log("ready");\n').status, 0);
  const result = lint('missingContributorSymbol();\n');
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /no-undef/);
});
