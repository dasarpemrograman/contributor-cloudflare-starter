import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import globals from 'globals';
import featureBoundaries from './scripts/lint-rules/feature-boundaries.mjs';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.wrangler/**',
      'worker-configuration.d.ts',
      'dist/**',
      'coverage/**',
      'reports/**',
      'playwright-report/**',
      'test-results/**',
      '.qlty/**',
    ],
  },
  {
    files: ['**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.ts', '*.config.ts', 'tests/browser/**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.tooling.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { '@typescript-eslint/no-floating-promises': 'error' },
  },
  {
    files: ['src/features/**/*.ts'],
    plugins: { local: { rules: { 'feature-boundaries': featureBoundaries } } },
    rules: { 'local/feature-boundaries': 'error' },
  },
);
