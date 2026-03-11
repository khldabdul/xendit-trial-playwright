/**
 * Playwright Test Configuration
 *
 * This file configures the Playwright test runner with:
 * - TypeScript support
 * - Path aliases for imports
 * - Allure reporting integration
 * - Environment-specific settings
 * - Multi-app test organization
 * - Artifact collection (screenshots, videos, traces, HAR)
 */

import type { PlaywrightTestConfig, Project } from '@playwright/test';
import { defineConfig, devices } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import dotenv from 'dotenv';

// Load environment variables from .env or .env.vault file
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get test environment from environment variables
 */
const getTestEnvironment = (): 'dev' | 'staging' | 'production' => {
  const env = process.env['TEST_ENV']?.toLowerCase();

  if (env === 'dev' || env === 'development') {
    return 'dev';
  }

  if (env === 'staging' || env === 'stage') {
    return 'staging';
  }

  if (env === 'prod' || env === 'production') {
    return 'production';
  }

  return 'dev';
};

/**
 * Get test timeout from environment variables
 */
const getTestTimeout = (): number => {
  return Number.parseInt(process.env['TEST_TIMEOUT'] || '60000', 10);
};

/**
 * Get retry count from environment variables
 */
const getRetryCount = (): number => {
  return Number.parseInt(process.env['RETRIES'] || process.env['RETRY_COUNT'] || '0', 10);
};

/**
 * Get whether to run tests on multiple viewports
 * Set MULTI_VIEWPORT=true to enable cross-browser/device testing
 * Note: This multiplies API calls and test execution time
 */
const getMultiViewport = (): boolean => {
  return process.env['MULTI_VIEWPORT'] === 'true';
};
const getWorkerCount = (): number => {
  return Number.parseInt(process.env['WORKERS'] || '1', 10);
};

/**
 * Get output directory for artifacts
 */
const getOutputDir = (): string => {
  return process.env['PLAYWRIGHT_OUTPUT_DIR'] || 'test-results';
};

/**
 * Get Allure results directory
 */
const getAllureResultsDir = (): string => {
  return process.env['ALLURE_RESULTS_DIR'] || 'allure-results';
};

/**
 * Common base configuration for all projects
 */
const baseConfig = {
  // Test timeout
  timeout: getTestTimeout(),

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Test directory
  testDir: './apps',

  // File patterns to ignore
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.github/**',
    '**/*.spec.ts',
    '**/*.test.ts',
  ],

  // Only test files matching this pattern
  testMatch: '**/*.e2e.ts',

  // Output directory for test results
  outputDir: getOutputDir(),

  // Fully parallelize tests (set to false for sequential execution)
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : getRetryCount(),

  // Workers: number of parallel workers (use '100%' for all available CPUs)
  workers: getWorkerCount(),

  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list'],
    ['allure-playwright', { outputFolder: getAllureResultsDir() }],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Trace configuration - always on for showcase/demo purposes
    // Includes network requests/responses, console logs, and page source
    trace: process.env.TRACE === 'off' ? 'off' : 'on',

    // Screenshot configuration - always on for showcase/demo purposes
    screenshot: process.env.SCREENSHOT === 'off' ? 'off' : 'on',

    // Video configuration - always on for showcase/demo purposes
    video: process.env.VIDEO === 'off' ? 'off' : 'on',

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Collect trace after retry
    traceOnRetry: true,

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (for testing only!)
    ignoreHTTPSErrors: true,

    // Locale
    locale: 'en-US',

    // Timezone
    timezoneId: 'America/New_York',

    // User agent
    userAgent: 'Playwright Test',
  },
};

/**
 * Create a project configuration for a specific E2E app
 */
function createE2EProject(name: string, pattern: string, dependencies?: string[]): Project {
  return {
    name: `e2e-${name}`,
    testMatch: pattern,
    dependencies,
    use: {
      ...baseConfig.use,
    },
  };
}

/**
 * Create a project configuration for a specific API app
 */
function createAPIProject(name: string, pattern: string, dependencies?: string[]): Project {
  return {
    name: `api-${name}`,
    testMatch: pattern,
    dependencies,
    use: {
      ...baseConfig.use,
      // API tests don't need browser context
      // They use APIRequestContext instead
    },
  };
}

/**
 * Main Playwright configuration
 */
export default defineConfig({
  ...baseConfig,

  // Projects define different test suites
  projects: [
    // =====================================================
    // E2E Test Projects
    // =====================================================

    // Xendit E2E Tests
    createE2EProject('xendit', 'apps/e2e/xendit/**/*.e2e.ts'),

    // =====================================================
    // API Test Projects
    // =====================================================

    // Xendit API Tests
    createAPIProject('xendit', 'apps/api/xendit/**/*.e2e.ts'),

    // =====================================================
    // Multi-Viewport Testing (disabled by default)
    // Set MULTI_VIEWPORT=true to enable these projects
    // =====================================================
    // @ts-expect-error - Spread operator with conditional array
    ...(getMultiViewport()
      ? [
          // Cross-Browser Testing (Chromium-based only by default)
          {
            name: 'cross-browser-chrome',
            testMatch: '**/*.e2e.ts',
            use: {
              ...baseConfig.use,
              ...devices['Desktop Chrome'],
              channel: 'chrome', // Use actual Chrome instead of Chromium
            },
          },

          // Mobile Viewport Testing
          {
            name: 'mobile-viewport',
            testMatch: '**/*.e2e.ts',
            use: {
              ...baseConfig.use,
              ...devices['iPhone 13'],
            },
          },

          // Tablet Viewport Testing
          {
            name: 'tablet-viewport',
            testMatch: '**/*.e2e.ts',
            use: {
              ...baseConfig.use,
              ...devices['iPad Pro'],
            },
          },

          // Dark Mode Testing
          {
            name: 'dark-mode',
            testMatch: '**/*.e2e.ts',
            use: {
              ...baseConfig.use,
              colorScheme: 'dark',
            },
          },
        ]
      : []),
  ],

  // Web server configuration (for local development)
  webServer:
    process.env.START_WEB_SERVER === 'true'
      ? [
          {
            command: 'npm run start',
            url: 'http://localhost:3000',
            timeout: 120000,
            reuseExistingServer: !process.env.CI,
          },
        ]
      : undefined,
});
