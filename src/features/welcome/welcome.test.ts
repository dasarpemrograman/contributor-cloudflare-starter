import { expect, it } from 'vitest';
import { welcomeResponse } from './welcome';

it('escapes configuration before inserting it into HTML', async () => {
  const response = welcomeResponse('<script>alert("x")</script>');
  const html = await response.text();
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
  expect(response.headers.get('Content-Security-Policy')).toContain(
    "default-src 'none'",
  );
});
