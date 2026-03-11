/**
 * Test hooks for managing test lifecycle
 *
 * Provides reusable hook functions that can be used across
 * different test files and fixtures.
 */

import type { Page, TestInfo } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types';
import path from 'path';

/**
 * Run actions before each test
 *
 * @param page - The Playwright page instance
 * @param testInfo - The test info object
 * @param options - Optional configuration
 *
 * @example
 * ```ts
 * test.beforeEach(async ({ page, testInfo }) => {
 *   await beforeEachHook(page, testInfo, {
 *     clearCookies: true,
 *     clearStorage: true,
 *   });
 * });
 * ```
 */
export async function beforeEachHook(
  page: Page,
  testInfo: TestInfo,
  options: {
    clearCookies?: boolean;
    clearStorage?: boolean;
    setViewport?: { width: number; height: number };
    defaultTimeout?: number;
  } = {}
): Promise<void> {
  const { clearCookies = false, clearStorage = false, setViewport, defaultTimeout } = options;

  // Set default timeout if specified
  if (defaultTimeout) {
    page.setDefaultTimeout(defaultTimeout);
  }

  // Clear cookies if requested
  if (clearCookies) {
    await page.context().clearCookies();
  }

  // Clear storage if requested
  if (clearStorage) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  // Set viewport if specified
  if (setViewport) {
    await page.setViewportSize(setViewport);
  }
}

/**
 * Run actions after each test
 *
 * @param page - The Playwright page instance
 * @param testInfo - The test info object
 * @param allure - The Allure reporter instance
 * @param options - Optional configuration
 *
 * @example
 * ```ts
 * test.afterEach(async ({ page, testInfo, allure }) => {
 *   await afterEachHook(page, testInfo, allure, {
 *     attachScreenshot: true,
 *     attachVideo: true,
 *     attachTrace: true,
 *   });
 * });
 * ```
 */
export async function afterEachHook(
  page: Page,
  testInfo: TestInfo,
  allure: MinimalAllureReporter,
  options: {
    attachScreenshot?: boolean | 'on-failure';
    attachVideo?: boolean | 'on-failure';
    attachTrace?: boolean | 'on-failure';
    screenshotName?: string;
  } = {}
): Promise<void> {
  const {
    attachScreenshot = 'on-failure',
    attachVideo = 'on-failure',
    attachTrace = 'on-failure',
    screenshotName,
  } = options;

  const shouldAttach = (setting: boolean | 'on-failure') =>
    setting === true || (setting === 'on-failure' && testInfo.status !== 'passed');

  // Attach screenshot
  if (shouldAttach(attachScreenshot)) {
    try {
      const screenshotPath = testInfo.outputPath(screenshotName || `screenshot-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const { attachFile } = await import('@/utils/allure-helpers');
      await attachFile(
        allure,
        screenshotPath,
        screenshotName || `Screenshot - ${testInfo.title}`,
        'image/png'
      );
    } catch (error) {
      console.error('Failed to attach screenshot:', error);
    }
  }

  // Attach video
  if (shouldAttach(attachVideo)) {
    try {
      const videoPath = testInfo.outputPath(`video-${Date.now()}.webm`);
      const { attachVideo: attachVideoFile } = await import('@/utils/allure-helpers');
      await attachVideoFile(allure, videoPath, `Video - ${testInfo.title}`);
    } catch (error) {
      console.error('Failed to attach video:', error);
    }
  }

  // Attach trace
  if (shouldAttach(attachTrace)) {
    try {
      const tracePath = testInfo.outputPath(`trace-${Date.now()}.zip`);
      const { attachTrace: attachTraceFile } = await import('@/utils/allure-helpers');
      await attachTraceFile(allure, tracePath, `Trace - ${testInfo.title}`);
    } catch (error) {
      console.error('Failed to attach trace:', error);
    }
  }

  // Add test status label
  allure.label('status', testInfo.status);
}

/**
 * Run actions before all tests in a suite
 *
 * @param testInfo - The test info object
 * @param actions - Optional setup actions
 *
 * @example
 * ```ts
 * test.beforeAll(async ({ testInfo }) => {
 *   await beforeAllHook(testInfo, {
 *     description: 'Testing Sauce Demo authentication',
 *     epic: 'Sauce Demo',
 *     feature: 'Authentication',
 *   });
 * });
 * ```
 */
export async function beforeAllHook(
  testInfo: TestInfo,
  actions: {
    description?: string;
    epic?: string;
    feature?: string;
    tags?: string[];
  } = {}
): Promise<void> {
  const { description: _description, epic, feature, tags } = actions;

  // Log suite start
  console.log(`\n=== Starting Test Suite: ${testInfo.title} ===`);
  console.log(`File: ${testInfo.file}`);
  console.log(`Line: ${testInfo.line}\n`);

  if (epic) {
    console.log(`Epic: ${epic}`);
  }
  if (feature) {
    console.log(`Feature: ${feature}`);
  }
  if (tags) {
    console.log(`Tags: ${tags.join(', ')}`);
  }
}

/**
 * Run actions after all tests in a suite
 *
 * @param testInfo - The test info object
 * @param actions - Optional teardown actions
 *
 * @example
 * ```ts
 * test.afterAll(async ({ testInfo }) => {
 *   await afterAllHook(testInfo, {
 *     summary: true,
 *   });
 * });
 * ```
 */
export async function afterAllHook(
  testInfo: TestInfo,
  actions: {
    summary?: boolean;
  } = {}
): Promise<void> {
  const { summary = false } = actions;

  console.log(`\n=== Completed Test Suite: ${testInfo.title} ===\n`);

  if (summary) {
    console.log(`Status: ${testInfo.status}`);
    console.log(`Duration: ${testInfo.duration}ms\n`);
  }
}

/**
 * Handle test failure with custom actions
 *
 * @param page - The Playwright page instance
 * @param testInfo - The test info object
 * @param allure - The Allure reporter instance
 * @param error - The error that caused the failure
 * @param options - Optional configuration
 *
 * @example
 * ```ts
 * test.afterEach(async ({ page, testInfo, allure }) => {
 *   if (testInfo.status !== 'passed') {
 *     await handleFailure(page, testInfo, allure, testInfo.error, {
 *       attachConsoleLogs: true,
 *       attachPageSource: true,
 *     });
 *   }
 * });
 * ```
 */
export async function handleFailure(
  page: Page,
  testInfo: TestInfo,
  allure: MinimalAllureReporter,
  error: unknown,
  options: {
    attachConsoleLogs?: boolean;
    attachPageSource?: boolean;
    attachScreenshot?: boolean;
    customMessage?: string;
  } = {}
): Promise<void> {
  const {
    attachConsoleLogs = true,
    attachPageSource = false,
    attachScreenshot = true,
    customMessage,
  } = options;

  // Add failure details
  const errorMessage = error instanceof Error ? error.message : String(error);
  const _errorStack = error instanceof Error ? error.stack : '';

  allure.label('failureType', error instanceof Error ? error.name : 'Unknown');
  allure.label('failureMessage', errorMessage);

  // Attach custom message if provided
  if (customMessage) {
    const { attachText } = await import('@/utils/allure-helpers');
    attachText(allure, customMessage, 'Failure Context');
  }

  // Attach console logs
  if (attachConsoleLogs) {
    try {
      const logs = await page.evaluate(() => {
        // Get console logs (limited implementation)
        return JSON.stringify({
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });
      const { attachText: attachTextContent } = await import('@/utils/allure-helpers');
      attachTextContent(allure, logs, 'Console Context');
    } catch (error) {
      console.error('Failed to attach console logs:', error);
    }
  }

  // Attach page source
  if (attachPageSource) {
    try {
      const html = await page.content();
      const { attachHtml } = await import('@/utils/allure-helpers');
      attachHtml(allure, html, 'Page Source');
    } catch (error) {
      console.error('Failed to attach page source:', error);
    }
  }

  // Attach screenshot
  if (attachScreenshot) {
    try {
      const screenshotPath = testInfo.outputPath(`failure-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const { attachFile } = await import('@/utils/allure-helpers');
      await attachFile(
        allure,
        screenshotPath,
        `Failure Screenshot - ${testInfo.title}`,
        'image/png'
      );
    } catch (error) {
      console.error('Failed to attach failure screenshot:', error);
    }
  }

  // Log failure
  console.error(`\n❌ Test Failed: ${testInfo.title}`);
  console.error(`   Error: ${errorMessage}\n`);
}

/**
 * Retry a test with delay between attempts
 *
 * @param testFn - The test function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delay - Delay between retries in milliseconds
 * @returns The test result
 *
 * @example
 * ```ts
 * test('flaky test', async ({ page }) => {
 *   await retryTest(async () => {
 *     await page.goto('/flaky-page');
 *     await expect(page.locator('.content')).toBeVisible();
 *   }, 3, 1000);
 * });
 * ```
 */
export async function retryTest<T>(
  testFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await testFn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed, retrying...`);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wait for condition with timeout
 *
 * @param condition - Function that returns true when condition is met
 * @param timeout - Timeout in milliseconds
 * @param interval - Check interval in milliseconds
 * @returns Promise that resolves when condition is met or rejects on timeout
 *
 * @example
 * ```ts
 * await waitForCondition(async () => {
 *   return await page.locator('.loaded').isVisible();
 * }, 10000, 500);
 * ```
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeout = 10000,
  interval = 500
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate a unique test ID
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID
 *
 * @example
 * ```ts
 * const testId = generateTestId('test');
 * // 'test_20250209_123456_789'
 * ```
 */
export function generateTestId(prefix = 'test'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, -5).replace(/[-T]/g, '_');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Parse test tags from test title or file path
 *
 * @param testInfo - The test info object
 * @returns Array of parsed tags
 *
 * @example
 * ```ts
 * const tags = parseTestTags(testInfo);
 * // ['@smoke', '@auth', '@critical']
 * ```
 */
export function parseTestTags(testInfo: TestInfo): string[] {
  const tags: string[] = [];
  const { title, file } = testInfo;

  // Parse tags from title (@tag format)
  const titleTags = title.match(/@[\w-]+/g);
  if (titleTags) {
    tags.push(...titleTags.map((tag) => tag.replace('@', '')));
  }

  // Parse tags from file path
  if (file) {
    const pathParts = file.split(path.sep);
    const tagsDir = pathParts.indexOf('__tags__');
    if (tagsDir !== -1 && pathParts[tagsDir + 1]) {
      tags.push(pathParts[tagsDir + 1]);
    }
  }

  return tags;
}
