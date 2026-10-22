import { createHash } from 'node:crypto';

const styles = `
:root{color-scheme:light dark;background:light-dark(#ffffff,#111111);color:light-dark(#171717,#f5f5f5);font-family:system-ui,sans-serif;line-height:1.6}
body{max-width:44rem;margin:10vh auto;padding:0 1.5rem}
.status{color:light-dark(#166534,#86efac)}
h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.1;letter-spacing:-.04em}
a{color:light-dark(#1d4ed8,#93c5fd)}
li{margin:.8rem 0}code{font-size:.95em}
`;
// Authorize only these exact stylesheet bytes; edits update the hash automatically.
const styleHash = createHash('sha256').update(styles).digest('base64');

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}

export function welcomeResponse(appName: string): Response {
  const title = escapeHtml(appName);
  return new Response(
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>${styles}</style></head>
<body><main><p class="status">● Your Worker is ready</p><h1>${title}</h1>
<p>A small starting point you can understand, change, and make your own.</p>
<ul><li><a href="/api/greeting?name=contributor">Try the greeting API</a></li>
<li><a href="/api/health">Check application health</a></li></ul>
<p>Start with the greeting feature. Its behavior, tests, and documentation live together.</p>
</main></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': `default-src 'none'; style-src 'sha256-${styleHash}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`,
        'Referrer-Policy': 'no-referrer',
      },
    },
  );
}
