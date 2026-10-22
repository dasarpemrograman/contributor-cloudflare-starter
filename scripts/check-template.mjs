import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
assert(
  manifest.repository?.url,
  'Set the public repository: npm run template:configure -- https://github.com/OWNER/REPO',
);
const repository = manifest.repository.url.replace(/\.git$/, '');
assert(
  !repository.includes('/OWNER/'),
  'Replace the example owner and repository.',
);
assert(
  readme.split('\n')[0].includes(encodeURIComponent(repository)),
  'README button and package repository must match.',
);
console.log(
  'Template URL is configured. Verify that the repository is public before sharing the button.',
);
