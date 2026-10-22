import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe('deployed Worker contract', () => {
  it('serves the first-run page with no secrets', async () => {
    const response = await exports.default.fetch('https://example.com/');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(await response.text()).toContain('Your Worker is ready');
  });
  it('reports health', async () => {
    const response = await exports.default.fetch(
      'https://example.com/api/health',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
  it('routes the greeting', async () => {
    const response = await exports.default.fetch(
      'https://example.com/api/greeting?name=Ada',
    );
    expect(await response.json()).toEqual({ message: 'Hello, Ada!' });
  });
  it('rejects unknown routes', async () => {
    const response = await exports.default.fetch('https://example.com/missing');
    expect(response.status).toBe(404);
  });
  it('rejects unsupported methods with allowed methods', async () => {
    const response = await exports.default.fetch(
      'https://example.com/api/greeting',
      { method: 'POST' },
    );
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, HEAD');
  });
  it('supports HEAD without a response body', async () => {
    const response = await exports.default.fetch('https://example.com/', {
      method: 'HEAD',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });
});
