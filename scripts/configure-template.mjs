import { readFile, writeFile } from 'node:fs/promises';

const argument = process.argv[2];
if (!argument)
  throw new Error(
    'Usage: npm run template:configure -- https://github.com/OWNER/REPO',
  );
const url = new URL(argument);
const supportedOrigin =
  url.protocol === 'https:' &&
  ['github.com', 'gitlab.com'].includes(url.hostname);
const hasExtraUrlParts = [
  url.username,
  url.password,
  url.search,
  url.hash,
].some(Boolean);
if (!supportedOrigin || hasExtraUrlParts) {
  throw new Error(
    'Use a public HTTPS github.com or gitlab.com repository URL.',
  );
}
const parts = url.pathname
  .replace(/\/$/, '')
  .replace(/\.git$/, '')
  .split('/')
  .filter(Boolean);
if (
  parts.length < 2 ||
  (url.hostname === 'github.com' && parts.length !== 2) ||
  parts.some((part) => !/^[\w.-]+$/.test(part))
) {
  throw new Error(
    'Use a repository root URL, without a branch or subdirectory.',
  );
}
url.pathname = `/${parts.join('/')}`;
const readmePath = new URL('../README.md', import.meta.url);
const readme = await readFile(readmePath, 'utf8');
const button = `[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=${encodeURIComponent(url.href)})`;
await writeFile(readmePath, readme.replace(/^.*\r?\n/, `${button}\n`));
const packagePath = new URL('../package.json', import.meta.url);
const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
manifest.repository = { type: 'git', url: `${url.href}.git` };
await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Deploy button configured for ${url.href}. Run npm run format and commit both changed files.`,
);
