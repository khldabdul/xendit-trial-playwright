/**
 * Base fixtures for the framework
 *
 * NOTE: These are building blocks for app-specific fixtures.
 * Tests should import from app-specific fixtures (e.g., @sauce-demo-fixtures)
 * rather than using these base fixtures directly.
 */

import { test as base } from '@playwright/test';
import type { EnvironmentConfig, MinimalAllureReporter } from '@/types/config.types';
import { createStepHelper, type StepHelper } from '@/utils/test-steps';

// Re-export types for convenience
export type { MinimalAllureReporter };

/**
 * Allure wrapper that matches MinimalAllureReporter interface
 * Mock implementation to avoid dependency on allure-js-commons
 */
class AllureWrapper implements MinimalAllureReporter {
  async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    return await body();
  }

  attachment(): void {}
  epic(): void {}
  feature(): void {}
  story(): void {}
  label(): void {}
  severity(): void {}
  tag(): void {}
  description(): void {}
  descriptionHtml(): void {}
  link(): void {}
  parameter(): void {}
}

// Create a singleton instance
const allureWrapper = new AllureWrapper();

/**
 * Base fixtures interface
 * Uses the AllureWrapper which implements MinimalAllureReporter
 */
export interface BaseFixtures {
  envConfig: EnvironmentConfig;
  env: 'dev' | 'staging' | 'production';
  runId: string;
  allure: MinimalAllureReporter;
  step: StepHelper;
}

/**
 * Base test object - prefixed with _ to discourage direct use
 * Tests should use app-specific fixtures instead
 */
export const _baseTest = base.extend<BaseFixtures>({
  /**
   * Allure reporter wrapper
   *
   * Provides step reporting for E2E operations using the real allure-playwright reporter.
   */
  allure: async ({}, use) => {
    await use(allureWrapper);
  },

  /**
   * Step helper for creating explicit test steps
   *
   * Provides `step()` and `section()` methods for creating clear test steps
   * that mimic Python's `with allure.step():` pattern.
   *
   * @example
   * ```ts
   * await step('Navigate to login page', async () => {
   *   await pages.login.goto();
   * });
   * ```
   */
  step: async ({ allure }, use) => {
    await use(createStepHelper(allure));
  },

  /**
   * Environment configuration fixture
   * Loads the appropriate environment configuration (dev/staging/production)
   */
  envConfig: async ({}, use) => {
    const env = getEnvironment();
    const config = await import(`@/config/environments`).then((m) => m.environments[env]);
    await use(config);
  },

  /**
   * Current environment name
   */
  env: async ({}, use) => {
    const env = getEnvironment();
    await use(env);
  },

  /**
   * Unique run ID for this test session
   * Used for test history tracking in Allure
   */
  runId: async ({}, use) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    await use(`run_${timestamp}`);
  },
});

/**
 * Get current environment from ENV variable or default to 'dev'
 */
function getEnvironment(): 'dev' | 'staging' | 'production' {
  const env = process.env.ENV ?? 'dev';
  if (env === 'dev' || env === 'staging' || env === 'production') {
    return env;
  }
  return 'dev';
}

// Re-export expect for convenience
export const _baseExpect = _baseTest.expect;
