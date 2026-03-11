/**
 * ESLint Flat Configuration
 *
 * Migrated from .eslintrc.json to the new ESLint 9+ flat config format.
 * @see https://eslint.org/docs/latest/use/configure/configuration-files-new
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPlaywright from 'eslint-plugin-playwright';

export default [
  // Ignore patterns (previously in ignorePatterns)
  {
    ignores: [
      'node_modules/**',
      'test-results/**',
      'allure-results/**',
      'playwright-report/**',
      'allure-report/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
      '*.d.ts',
    ],
  },

  // Base JavaScript rules (previously "eslint:recommended")
  js.configs.recommended,

  // Playwright plugin flat config
  pluginPlaywright.configs['flat/recommended'],

  // TypeScript configuration
  ...tseslint.configs.recommended,

  // Project-specific configuration
  {
    files: ['**/*.ts', '**/*.tsx'],

    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' for flexible typing in fixtures
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',

      // Playwright rules - relaxed for test framework flexibility
      'playwright/missing-playwright-await': 'error',
      'playwright/prefer-web-first-assertions': 'off',
      'playwright/no-conditional-in-test': 'off', // Allow conditional logic in data-driven tests
      'playwright/no-conditional-expect': 'off', // Allow conditional assertions
      'playwright/expect-expect': 'off', // Some test helpers don't need assertions
      'playwright/no-skipped-test': 'off', // Allow tests to be skipped during development

      // General JavaScript rules
      'no-console': 'off', // Allow console.log for debugging in tests
      'prefer-const': 'error',
      'no-var': 'error',
      'no-useless-escape': 'off', // Regex escapes are sometimes necessary for clarity
    },
  },

  // Special rules for test files
  {
    files: ['**/*.e2e.ts', '**/*.spec.ts', '**/tests/**/*.ts', '**/hooks/**/*.ts'],

    rules: {
      // Allow console in test files for debugging
      'no-console': 'off',
    },
  },

  // Special rules for global setup/teardown
  {
    files: ['src/global-setup.ts', 'src/global-teardown.ts'],

    rules: {
      // Allow console for logging in global setup
      'no-console': 'off',
    },
  },
];
