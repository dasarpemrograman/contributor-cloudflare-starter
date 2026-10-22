import assert from 'node:assert/strict';

const base = new URL(process.argv[2] ?? 'http://localhost:8787');
async function request(path, options) {
  return fetch(new URL(path, base), {
    ...options,
    signal: AbortSignal.timeout(15000),
  });
}
const page = await request('/');
assert.equal(page.status, 200);
assert.match(page.headers.get('content-type') ?? '', /text\/html/);
assert.match(await page.text(), /Your Worker is ready/);
const health = await request('/api/health');
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { status: 'ok' });
const greeting = await request('/api/greeting?name=Ada');
assert.equal(greeting.status, 200);
assert.deepEqual(await greeting.json(), { message: 'Hello, Ada!' });
assert.equal((await request('/missing')).status, 404);
const method = await request('/api/greeting', { method: 'POST' });
assert.equal(method.status, 405);
console.log(`Smoke checks passed for ${base.origin}`);
