import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';

const base = process.argv[2];
assert(base, 'Pass the base commit SHA or branch to compare with HEAD.');
const workingTree = process.argv.includes('--working-tree');
const paths = [
  'src/*.ts',
  'src/**/*.ts',
  ':!src/**/*.test.ts',
  ':!src/*.test.ts',
  ':!src/**/*.d.ts',
  ':!src/*.d.ts',
];
const comparison = workingTree
  ? execFileSync('git', ['merge-base', base, 'HEAD'], {
      encoding: 'utf8',
    }).trim()
  : `${base}...HEAD`;
const diff = execFileSync(
  'git',
  [
    '-c',
    'core.quotePath=false',
    'diff',
    '--no-renames',
    '--unified=0',
    comparison,
    '--',
    ...paths,
  ],
  { encoding: 'utf8' },
);
const added = new Map();
if (workingTree) {
  const untracked = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '-z', '--', ...paths],
    { encoding: 'utf8' },
  );
  for (const file of untracked.split('\0').filter(Boolean)) {
    const contents = await readFile(file, 'utf8');
    added.set(file, new Set(contents.split('\n').map((_, index) => index + 1)));
  }
}
let path;
for (const line of diff.split('\n')) {
  if (line.startsWith('+++ '))
    path = line.startsWith('+++ b/') ? line.slice(6).trim() : undefined;
  const hunk = /^@@ .* \+(\d+)(?:,(\d+))? @@/.exec(line);
  if (hunk && path) {
    const changed = added.get(path) ?? new Set();
    const start = Number(hunk[1]);
    const length = hunk[2] === undefined ? 1 : Number(hunk[2]);
    for (let index = start; index < start + length; index += 1)
      changed.add(index);
    added.set(path, changed);
  }
}
const coverage = JSON.parse(
  await readFile('coverage/coverage-final.json', 'utf8'),
);
const files = new Map(
  Object.entries(coverage).map(([file, result]) => [
    relative(process.cwd(), file).replaceAll('\\', '/'),
    result,
  ]),
);
let covered = 0;
let total = 0;
for (const [file, lines] of added) {
  const result = files.get(file);
  assert(result, `${file}: missing coverage instrumentation`);
  const hits = new Map();
  for (const [id, statement] of Object.entries(result.statementMap)) {
    const number = statement.start.line;
    hits.set(number, Math.max(hits.get(number) ?? 0, result.s[id]));
  }
  for (const line of lines) {
    if (!hits.has(line)) continue; // Comments, types and blank lines are not executable.
    total += 1;
    if (hits.get(line) > 0) covered += 1;
  }
}
const percent = total === 0 ? 100 : (covered / total) * 100;
console.log(
  `Changed executable lines: ${covered}/${total}, ${percent.toFixed(2)}% (minimum 95%).`,
);
assert(
  percent >= 95,
  'Changed-line coverage is below 95%. Add behavioral tests.',
);
