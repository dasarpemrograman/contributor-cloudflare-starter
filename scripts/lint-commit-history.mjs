import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(
  new URL('../node_modules/@commitlint/cli/cli.js', import.meta.url),
);
// Commitlint skips empty messages; reject those explicitly, even if a commit
// was created with Git's --allow-empty-message escape hatch.
const subjects = execFileSync('git', ['log', '--format=%H%x09%s', 'HEAD'], {
  encoding: 'utf8',
}).trimEnd();
for (const line of subjects.split('\n')) {
  const separator = line.indexOf('\t');
  if (!line.slice(separator + 1).trim() || separator === -1) {
    throw new Error(`Empty commit message: ${line.slice(0, separator)}`);
  }
}
const root = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')[0];
if (!root) throw new Error('No Git history found.');

function lint(args, input) {
  const result = spawnSync(
    process.execPath,
    [cli, ...args, '--format', './scripts/commitlint-history-format.mjs'],
    {
      input,
      stdio: [input === undefined ? 'inherit' : 'pipe', 'inherit', 'inherit'],
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Git's root..HEAD range excludes the root itself, so check it separately.
lint([], execFileSync('git', ['show', '-s', '--format=%B', root]));
lint(['--from', root, '--to', 'HEAD']);
console.log('Commit history follows Conventional Commits.');
