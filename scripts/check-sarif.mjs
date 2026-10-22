import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const paths = process.argv.slice(2);
assert(paths.length > 0, 'Pass at least one SARIF file or directory.');
const files = [];
for (const path of paths) {
  if (path.endsWith('.sarif')) files.push(path);
  else
    files.push(
      ...(await readdir(path))
        .filter((name) => name.endsWith('.sarif'))
        .map((name) => join(path, name)),
    );
}
assert(files.length > 0, 'No SARIF reports were produced.');
let findings = 0;
for (const file of files) {
  const report = JSON.parse(await readFile(file, 'utf8'));
  assert(
    Array.isArray(report.runs) && report.runs.length > 0,
    `${file}: missing scan results`,
  );
  for (const run of report.runs) {
    assert(
      !run.invocations?.some(
        (invocation) => invocation.executionSuccessful === false,
      ),
      `${file}: scanner failed`,
    );
    for (const result of run.results ?? []) {
      findings += 1;
      console.error(
        `${file}: ${result.ruleId}: ${result.message?.text ?? 'Finding'}`,
      );
    }
  }
}
assert.equal(
  findings,
  0,
  `${findings} blocking finding(s). Fix the findings before merging.`,
);
console.log(`${files.length} SARIF report(s): no findings.`);
