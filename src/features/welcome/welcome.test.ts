import { expect, it } from 'vitest';
import { welcomeResponse } from './welcome';

it('permits only the stylesheet actually delivered in the page', async () => {
  const response = welcomeResponse('Cloudflare Starter');
  const html = await response.text();
  const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1];
  if (!css) throw new Error('The welcome stylesheet is missing.');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(css),
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(digest)));
  const policy = response.headers.get('Content-Security-Policy');
  expect(policy).toContain(`style-src 'sha256-${hash}'`);
  expect(policy).not.toContain('unsafe-inline');
});

it('escapes configuration before inserting it into HTML', async () => {
  const response = welcomeResponse('<script>alert("x")</script>');
  const html = await response.text();
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
  expect(response.headers.get('Content-Security-Policy')).toContain(
    "default-src 'none'",
  );
});
