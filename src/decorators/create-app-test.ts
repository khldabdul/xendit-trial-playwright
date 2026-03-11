/**
 * Helper to combine decorators with app-specific fixtures
 *
 * This prevents using wrong fixtures with wrong decorators
 * and provides a cleaner API for test files by automatically
 * applying Allure metadata to all tests.
 *
 * @example
 * ```ts
 * import { sauceDemoTest } from '@sauce-demo-fixtures';
 * import { createE2ETest } from '@/decorators/create-app-test';
 *
 * export const test = createE2ETest(sauceDemoTest, {
 *   epic: 'Sauce Demo',
 *   feature: 'Authentication',
 *   app: 'sauce-demo',
 *   testcase: 'TC-001',
 * });
 *
 * test('my test', async ({ pages, allure }) => {
 *   // Allure metadata is automatically applied before this test runs
 *   await pages.login.goto();
 * });
 * ```
 */

import type { ApiTestOptions, E2eTestOptions } from '@/types/test.types';

/**
 * Apply Allure metadata from options to the allure reporter
 */
function applyAllureMetadata(allure: any, options: E2eTestOptions | ApiTestOptions): void {
  // Apply standard Allure labels
  if (allure.epic) allure.epic(options.epic);
  if (allure.feature) allure.feature(options.feature);
  if (allure.story) allure.story(options.story);
  if (allure.label) allure.label('testcase', options.testcase);

  // Apply optional labels
  if (options.requirement && allure.label) {
    allure.label('requirement', options.requirement);
  }

  // Apply severity
  if (options.severity && allure.severity) {
    allure.severity(options.severity);
  }

  // Apply description
  if (options.description && allure.description) {
    allure.description(options.description);
  }

  // Apply smoke tag
  if (options.smoke && allure.tag) {
    allure.tag('smoke');
  }

  // Apply custom tags
  if (options.tags && allure.tag) {
    for (const tag of options.tags) {
      allure.tag(tag);
    }
  }

  // Apply E2E-specific metadata
  if ('app' in options && allure.label) {
    allure.label('app', (options as E2eTestOptions).app);
    allure.tag('e2e');

    if ((options as E2eTestOptions).critical) {
      allure.tag('critical');
    }
  } else if (allure.tag) {
    allure.tag('api');
  }
}

/**
 * Wrap a test function to apply Allure metadata before execution
 */
function wrapTestFn<T extends (...args: any[]) => any>(
  testFn: T,
  options: E2eTestOptions | ApiTestOptions
): T {
  return (async (...args: any[]) => {
    // Extract allure from test arguments
    const allure = args[0]?.allure;

    // Apply Allure metadata if available
    if (allure) {
      applyAllureMetadata(allure, options);
    }

    // Run the original test function
    return await testFn(...args);
  }) as T;
}

/**
 * Create a wrapped test object that applies Allure metadata
 *
 * Uses a Proxy to intercept and wrap test function calls while
 * preserving all other properties and methods.
 */
function createTestProxy<T extends Record<string, any>>(
  appTest: T,
  options: E2eTestOptions | ApiTestOptions
): T {
  return new Proxy(appTest, {
    get(target, prop) {
      const value = target[prop as keyof T];

      // If it's not a function, return as-is
      if (typeof value !== 'function') {
        return value;
      }

      // Wrap test registration functions
      if (prop === 'test' || prop === 'it' || prop === 'only' || prop === 'skip') {
        return function (title: string, testFn: (...args: any[]) => any) {
          if (typeof testFn === 'function') {
            const wrappedFn = wrapTestFn(testFn, options);
            return value.call(target, title, wrappedFn);
          }
          return value.call(target, title);
        };
      }

      // For all other methods (describe, beforeEach, etc.), return as-is
      // but bind to the target so they work correctly
      return value.bind(target);
    },
  }) as T;
}

/**
 * Create an E2E test with both decorator metadata and app-specific fixtures
 *
 * Returns a wrapped test object that automatically applies Allure metadata
 * to all tests created with it.
 */
export function createE2ETest<T extends Record<string, any>>(
  appTest: T,
  options: E2eTestOptions
): T {
  return createTestProxy(appTest, options);
}

/**
 * Create an API test with both decorator metadata and app-specific fixtures
 *
 * Returns a wrapped test object that automatically applies Allure metadata
 * to all tests created with it.
 */
export function createAPITest<T extends Record<string, any>>(
  appTest: T,
  options: ApiTestOptions
): T {
  return createTestProxy(appTest, options);
}
