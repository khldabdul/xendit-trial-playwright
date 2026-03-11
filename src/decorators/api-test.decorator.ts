/**
 * API Test Decorator - Wraps Playwright test with Allure metadata
 *
 * @example
 * ```ts
 * import { apiTest, expect } from '@/decorators/api-test.decorator';
 *
 * export const test = apiTest({
 *   epic: 'Petstore API',
 *   feature: 'Pet Management',
 *   story: 'Create Pet',
 *   testcase: 'TC-PS-001',
 *   requirement: 'US-PET-001',
 *   severity: 'critical',
 *   smoke: true,
 * });
 *
 * test('creates a new pet', async ({ clients }) => {
 *   const response = await clients.petstore.addPet({...});
 *   expect(response.id).toBeGreaterThan(0);
 * });
 * ```
 */

import { test, expect } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types';
import type { ApiTestOptions } from '@/types/test.types';

/**
 * Create an API test with Allure metadata
 */
export function apiTest(options: ApiTestOptions) {
  // Create a new test object with Allure integration
  const decoratedTest = {
    ...test,

    /**
     * Define an async test with automatic Allure metadata
     */
    async: (title: string, testFn: (params: any) => Promise<void>) => {
      // eslint-disable-next-line playwright/valid-title
      return test(title, async (params) => {
        // @ts-expect-error - params type assertion for custom allure property
        const { allure } = params as { allure: MinimalAllureReporter };

        // Apply Allure metadata
        applyApiTestMetadata(allure, options);

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
 * Apply Allure metadata for API tests
 */
function applyApiTestMetadata(allure: MinimalAllureReporter, options: ApiTestOptions): void {
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
  allure.tag('api');
}

// Re-export expect for convenience
export { expect };
