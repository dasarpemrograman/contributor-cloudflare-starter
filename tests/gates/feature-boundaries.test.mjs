import { RuleTester } from 'eslint';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import rule from '../../scripts/lint-rules/feature-boundaries.mjs';

const file = (path) =>
  fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

test('feature imports allow local dependencies and app composition, rejecting cross-feature internals', () => {
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  });
  tester.run('feature-boundaries', rule, {
    valid: [
      {
        filename: file('app.ts'),
        code: "import { welcomeResponse } from './features/welcome/welcome';",
      },
      {
        filename: file('features/greeting/nested/example.ts'),
        code: "import { greetingResponse } from '../greeting';",
      },
      {
        filename: file('features/greeting/example.ts'),
        code: "import { createHash } from 'node:crypto';",
      },
    ],
    invalid: [
      "import { welcomeResponse } from '../welcome/welcome';",
      "export { welcomeResponse } from '../welcome/welcome';",
      "export * from '../welcome/welcome';",
      "const other = import('../welcome/welcome');",
      "const other = require('../welcome/welcome');",
    ].map((code) => ({
      filename: file('features/greeting/example.ts'),
      code,
      errors: [{ messageId: 'crossFeature' }],
    })),
  });
});
