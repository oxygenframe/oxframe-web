import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/.svelte-kit',
      '**/generated',
      '.tools',
      '**/.data',
      '**/.wrangler',
      // Built by packages/player.
      'apps/site/static/player*.js',
      'bench',
      'apps/site/og/target',
      '**/*.gen.ts',
      '**/test-results',
      '**/playwright-report',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node, Bun: 'readonly' } },
    rules: {
      'no-undef': 'off',
      // The site has no base path, so plain hrefs are correct.
      'svelte/no-navigation-without-resolve': 'off',
      // Map/Set caches in components are deliberately non-reactive.
      'svelte/prefer-svelte-reactivity': 'off',
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
);
