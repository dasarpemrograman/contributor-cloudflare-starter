import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const bundle = await readFile(new URL('../dist/index.js', import.meta.url));
const compressed = gzipSync(bundle).byteLength;
assert(
  bundle.byteLength <= 50000,
  `Worker bundle exceeds 50 KB: ${bundle.byteLength} bytes`,
);
assert(
  compressed <= 15000,
  `Gzipped Worker exceeds 15 KB: ${compressed} bytes`,
);
console.log(
  `Worker bundle: ${bundle.byteLength}/50000 bytes; gzip: ${compressed}/15000 bytes.`,
);
