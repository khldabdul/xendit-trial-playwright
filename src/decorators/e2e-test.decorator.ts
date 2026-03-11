/**
 * E2E Test Decorator - Wraps Playwright test with Allure metadata for E2E tests
 *
 * @example
 * ```ts
 * import { e2eTest, expect } from '@/decorators/e2e-test.decorator';
 *
 * export const test = e2eTest({
 *   epic: 'Sauce Demo E2E',
 *   feature: 'Authentication',
 *   story: 'User Login',
 *   testcase: 'TC-SD-001',
 *   app: 'sauce-demo',
 *   severity: 'critical',
 *   critical: true,
 *   smoke: true,
 * });
 *
 * test('successfully logs in', async ({ pages }) => {
 *   await pages.login.goto();
 *   await pages.login.login('standard_user', 'secret_sauce');
 * });
 * ```
 */

import { test, expect } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types';
import type { E2eTestOptions } from '@/types/test.types';

/**
 * Create an E2E test with Allure metadata
 */
export function e2eTest(options: E2eTestOptions) {
  // Create a new test object with Allure integration
  const decoratedTest = {
    ...test,

    /**
     * Define an async test with automatic Allure metadata
     */
    async: (title: string, testFn: (params: any) => Promise<void>) => {
      // Add app marker for Playwright filtering
      const testWithMarker = (test as any).annotate(options.app, {
        description: `App: ${options.app}`,
      });

      return testWithMarker(title, async (params) => {
        const { allure } = params as { allure: MinimalAllureReporter };

        // Apply Allure metadata
        applyE2eTestMetadata(allure, options);

        // Execute the test
        await testFn(params);
      });
    },

    // Preserve other Playwright test methods
    beforeAll: test.beforeAll.bind(test),
    afterAll: test.afterAll.bind(test),
    beforeEach: test.beforeEach.bind(test),
    afterEach: test.afterEach.bind(test),
  };

  return decoratedTest;
}

/**
 * Apply Allure metadata for E2E tests
 */
function applyE2eTestMetadata(allure: MinimalAllureReporter, options: E2eTestOptions): void {
  allure.epic(options.epic);
  allure.feature(options.feature);
  allure.story(options.story);
  allure.label('testcase', options.testcase);

  if (options.requirement) {
    allure.label('requirement', options.requirement);
  }

  if (options.severity) {
    allure.severity(options.severity);
  }

  if (options.description) {
    allure.description(options.description);
  }

  if (options.smoke) {
    allure.tag('smoke');
  }

  options.tags?.forEach((tag) => allure.tag(tag));
  allure.tag('e2e');
  allure.tag(options.app);

  if (options.critical) {
    allure.tag('critical');
  }
}

// Re-export expect for convenience
export { expect };
