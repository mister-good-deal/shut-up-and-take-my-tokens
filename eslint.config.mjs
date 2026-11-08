import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['node_modules', '_site', 'lib.js', 'page.js']),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { project: './tsconfig.eslint.json', tsconfigRootDir: import.meta.dirname },
    },
    plugins: { '@stylistic': stylistic },
    rules: {
      '@typescript-eslint/no-floating-promises': ['error', {
        allowForKnownSafeCalls: [{ from: 'package', name: ['test', 'describe'], package: 'node:test' }],
      }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
      '@stylistic/semi': ['error', 'always'],
    },
  },
);
