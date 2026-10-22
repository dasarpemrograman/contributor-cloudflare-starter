import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const base = process.argv[2] ?? 'http://127.0.0.1:8788/';
await mkdir('reports/lighthouse', { recursive: true });
const chrome = await launch({
  chromeFlags: ['--headless', '--no-sandbox'],
});
const results = [];
try {
  for (let index = 0; index < 3; index += 1) {
    const result = await lighthouse(base, {
      port: chrome.port,
      output: ['html', 'json'],
      onlyCategories: ['performance', 'accessibility'],
    });
    assert(
      result?.lhr && !result.lhr.runtimeError,
      'Lighthouse did not produce a valid audit.',
    );
    results.push(result.lhr);
    await writeFile(`reports/lighthouse/run-${index}.html`, result.report[0]);
    await writeFile(`reports/lighthouse/run-${index}.json`, result.report[1]);
  }
} finally {
  await chrome.kill();
}

function median(values) {
  return [...values].sort((left, right) => left - right)[1];
}
const score = median(
  results.map((result) => result.categories.performance.score),
);
const lcp = median(
  results.map(
    (result) => result.audits['largest-contentful-paint'].numericValue,
  ),
);
const blocking = median(
  results.map((result) => result.audits['total-blocking-time'].numericValue),
);
assert(score >= 0.95, `Median performance score ${score} is below 0.95.`);
assert(lcp <= 2000, `Median LCP ${lcp} ms exceeds 2000 ms.`);
assert(blocking <= 100, `Median blocking time ${blocking} ms exceeds 100 ms.`);
for (const result of results) {
  assert.equal(
    result.categories.accessibility.score,
    1,
    'Accessibility score must be 100.',
  );
  assert(
    result.audits['cumulative-layout-shift'].numericValue <= 0.01,
    'CLS exceeds 0.01.',
  );
}
console.log(
  `Lighthouse budgets passed: performance ${score}, median LCP ${Math.round(lcp)} ms, median blocking ${blocking} ms.`,
);
