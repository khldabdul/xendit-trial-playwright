/**
 * Base fixtures for the framework
 *
 * NOTE: These are building blocks for app-specific fixtures.
 * Tests should import from app-specific fixtures (e.g., @sauce-demo-fixtures)
 * rather than using these base fixtures directly.
 */

import { test as base } from '@playwright/test';
import * as allureApi from 'allure-js-commons';
import type { EnvironmentConfig, MinimalAllureReporter } from '@/types/config.types';
import { createStepHelper, type StepHelper } from '@/utils/test-steps';

// Re-export types for convenience
export type { MinimalAllureReporter };

/**
 * Allure wrapper that matches MinimalAllureReporter interface
 * Uses allure-js-commons directly (recommended approach for allure-playwright v3+)
 *
 * Migration note: The 'allure' export from 'allure-playwright' is deprecated.
 * Import individual functions from 'allure-js-commons' instead.
 */
class AllureWrapper implements MinimalAllureReporter {
  async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    // Execute the body and store result
    let result: T;
    await allureApi.step(name, async () => {
      result = await body();
    });
    return result as T;
  }

  attachment(name: string, content: Buffer | string, options: { contentType: string }): void {
    allureApi.attachment(name, content, options.contentType);
  }

  epic(epic: string): void {
    allureApi.epic(epic);
  }

  feature(feature: string): void {
    allureApi.feature(feature);
  }

  story(story: string): void {
    allureApi.story(story);
  }

  label(name: string, value: string): void {
    allureApi.label(name, value);
  }

  severity(severity: string): void {
    allureApi.severity(severity);
  }

  tag(tag: string): void {
    allureApi.tag(tag);
  }

  description(description: string): void {
    allureApi.description(description);
  }

  descriptionHtml(description: string): void {
    allureApi.descriptionHtml(description);
  }

  link(url: string, options?: { name?: string | undefined; type?: string | undefined }): void {
    if (options?.type && options?.name) {
      allureApi.link(options.type, url, options.name);
    } else {
      allureApi.link('link', url);
    }
  }

  parameter(name: string, value: string): void {
    allureApi.parameter(name, value);
  }
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
