/**
 * HAR (HTTP Archive) recording hook
 *
 * Provides utilities for recording and analyzing HTTP traffic during tests.
 * HAR files capture network requests, responses, headers, and timing information.
 */

import type { Page, TestInfo } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types';
import { writeFile, readFile } from 'fs/promises';
import type { HAREntry, HARSummary } from '@/types/har.types';

/**
 * Options for HAR recording
 */
export interface HarRecordOptions {
  /** Path to save the HAR file */
  harPath?: string;
  /** Content types to record (default: all) */
  contentTypes?: string[];
  /** Whether to record binary content */
  recordBinaryContent?: boolean;
  /** Whether to attach HAR to Allure report */
  attachToAllure?: boolean;
  /** Custom HAR filename */
  filename?: string;
}

/**
 * Start HAR recording on a page
 *
 * @param page - The Playwright page instance
 * @param options - Recording options
 * @returns The HAR file path
 *
 * @example
 * ```ts
 * const harPath = await startHarRecording(page, {
 *   contentTypes: ['application/json', 'text/html'],
 *   attachToAllure: true,
 * });
 * // ... perform test actions ...
 * await stopHarRecording(page);
 * ```
 */
export async function startHarRecording(
  page: Page,
  options: HarRecordOptions = {}
): Promise<string> {
  const { contentTypes, recordBinaryContent: _recordBinaryContent = false, filename } = options;

  const harFilename = filename || `recording-${Date.now()}.har`;
  const harPath = options.harPath || harFilename;

  await page.routeFromHAR(harPath, {
    url: '*',
    update: true,
    // @ts-expect-error - updateContent type mismatch
    updateContent: contentTypes || 'none',
    updateMode: 'full',
  });

  // Store HAR path in page context for later retrieval
  await page.context().addInitScript(`
    window.__harPath = ${JSON.stringify(harPath)};
  `);

  return harPath;
}

/**
 * Stop HAR recording and optionally attach to Allure
 *
 * @param page - The Playwright page instance
 * @param testInfo - The test info object
 * @param allure - The Allure reporter instance
 * @param options - Recording options
 *
 * @example
 * ```ts
 * await stopHarRecording(page, testInfo, allure, {
 *   attachToAllure: true,
 *   filename: 'login-flow.har',
 * });
 * ```
 */
export async function stopHarRecording(
  page: Page,
  testInfo?: TestInfo,
  allure?: MinimalAllureReporter,
  options: HarRecordOptions = {}
): Promise<void> {
  const { attachToAllure = false, filename } = options;

  // Get HAR path from page context or use provided filename
  const harPath =
    (await page.evaluate(() => (window as any).__harPath)) ||
    options.harPath ||
    testInfo?.outputPath(filename || `recording-${Date.now()}.har`);

  // Attach to Allure if requested
  if (attachToAllure && allure && testInfo) {
    try {
      const { attachHar, generateHARSummary } = await import('@/hooks/har-hook');
      const summary = await generateHARSummary(harPath);
      await attachHar(allure, harPath, summary, `HAR - ${testInfo.title}`);
    } catch (error) {
      console.error('Failed to attach HAR to Allure:', error);
    }
  }
}

/**
 * Generate a summary of HAR file contents
 *
 * @param harPath - Path to the HAR file
 * @returns Summary of the HAR content
 *
 * @example
 * ```ts
 * const summary = await generateHARSummary('/path/to/recording.har');
 * console.log(summary);
 * // {
 * //   totalRequests: 15,
 * //   failedRequests: 0,
 * //   domains: ['example.com', 'api.example.com'],
 * //   requestTypes: { xhr: 8, document: 2, script: 5 },
 * //   totalSize: 1234567,
 * //   errors: []
 * // }
 * ```
 */
export async function generateHARSummary(harPath: string): Promise<string> {
  try {
    const harContent = await readFile(harPath, 'utf-8');
    const har = JSON.parse(harContent) as { log: { entries: HAREntry[] } };

    const entries = har.log?.entries || [];
    const summary: HARSummary = {
      totalRequests: entries.length,
      failedRequests: 0,
      domains: [],
      requestTypes: {},
      totalSize: 0,
      errors: [],
    };

    // Analyze each entry
    for (const entry of entries) {
      const request = entry.request;
      const response = entry.response;

      // Check for failures
      if (response.status >= 400) {
        summary.failedRequests++;
        summary.errors.push({
          url: request.url,
          method: request.method,
          status: response.status,
          statusText: response.statusText,
        });
      }

      // Collect domains
      try {
        const url = new URL(request.url);
        if (!summary.domains.includes(url.hostname)) {
          summary.domains.push(url.hostname);
        }
      } catch {
        // Invalid URL, skip
      }

      // Count request types
      const type = entry._resourceType || 'unknown';
      summary.requestTypes[type] = (summary.requestTypes[type] || 0) + 1;

      // Add to total size
      summary.totalSize += response.bodySize || 0;
    }

    // Format as readable string
    return formatHARSummary(summary);
  } catch (error) {
    return `Failed to generate HAR summary: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Format HAR summary as a readable string
 *
 * @param summary - The HAR summary object
 * @returns Formatted summary string
 *
 * @example
 * ```ts
 * const formatted = formatHARSummary({
 *   totalRequests: 15,
 *   failedRequests: 0,
 *   domains: ['example.com'],
 *   requestTypes: { xhr: 8, document: 2 },
 *   totalSize: 1234567,
 *   errors: [],
 * });
 * ```
 */
export function formatHARSummary(summary: HARSummary): string {
  const lines = [
    'HAR Recording Summary',
    '=====================',
    `Total Requests: ${summary.totalRequests}`,
    `Failed Requests: ${summary.failedRequests}`,
    `Domains: ${summary.domains.join(', ') || 'None'}`,
    `Request Types: ${
      Object.entries(summary.requestTypes)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ') || 'None'
    }`,
    `Total Size: ${formatBytes(summary.totalSize)}`,
  ];

  if (summary.errors.length > 0) {
    lines.push('', 'Errors:');
    for (const error of summary.errors) {
      lines.push(`  - ${error.method} ${error.url}: ${error.status} ${error.statusText}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format bytes to human-readable size
 *
 * @param bytes - Number of bytes
 * @returns Formatted size string
 *
 * @example
 * ```ts
 * formatBytes(1536); // '1.50 KB'
 * formatBytes(1536000); // '1.46 MB'
 * ```
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extract specific requests from HAR file
 *
 * @param harPath - Path to the HAR file
 * @param filter - Filter function for requests
 * @returns Array of matching entries
 *
 * @example
 * ```ts
 * const apiCalls = await extractFromHar('/path/to/recording.har', (entry) => {
 *   return entry.request.url.includes('/api/');
 * });
 * ```
 */
export async function extractFromHar(
  harPath: string,
  filter: (entry: HAREntry) => boolean
): Promise<HAREntry[]> {
  try {
    const harContent = await readFile(harPath, 'utf-8');
    const har = JSON.parse(harContent) as { log: { entries: HAREntry[] } };

    return (har.log?.entries || []).filter(filter);
  } catch (error) {
    console.error('Failed to extract from HAR:', error);
    return [];
  }
}

/**
 * Get all API requests from HAR file
 *
 * @param harPath - Path to the HAR file
 * @returns Array of API request entries
 *
 * @example
 * ```ts
 * const apiRequests = await getApiRequests('/path/to/recording.har');
 * console.log(`Found ${apiRequests.length} API requests`);
 * ```
 */
export async function getApiRequests(harPath: string): Promise<HAREntry[]> {
  return await extractFromHar(harPath, (entry) => {
    const url = entry.request.url.toLowerCase();
    return url.includes('/api/') || url.includes('/v1/') || url.includes('/v2/');
  });
}

/**
 * Get all failed requests from HAR file
 *
 * @param harPath - Path to the HAR file
 * @returns Array of failed request entries
 *
 * @example
 * ```ts
 * const failures = await getFailedRequests('/path/to/recording.har');
 * for (const failure of failures) {
 *   console.log(`${failure.request.method} ${failure.request.url}: ${failure.response.status}`);
 * }
 * ```
 */
export async function getFailedRequests(harPath: string): Promise<HAREntry[]> {
  return await extractFromHar(harPath, (entry) => entry.response.status >= 400);
}

/**
 * Get request timings from HAR file
 *
 * @param harPath - Path to the HAR file
 * @returns Array of timing information
 *
 * @example
 * ```ts
 * const timings = await getRequestTimings('/path/to/recording.har');
 * for (const timing of timings) {
 *   console.log(`${timing.url}: ${timing.total}ms`);
 * }
 * ```
 */
export async function getRequestTimings(harPath: string): Promise<
  Array<{
    url: string;
    method: string;
    total: number;
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
  }>
> {
  try {
    const harContent = await readFile(harPath, 'utf-8');
    const har = JSON.parse(harContent) as { log: { entries: HAREntry[] } };

    return (har.log?.entries || []).map((entry) => {
      const timings = entry.timings || {};
      return {
        url: entry.request.url,
        method: entry.request.method,
        // @ts-expect-error - Optional chaining with number addition
        total: timings.send || 0 + timings.wait || 0 + timings.receive || 0,
        // @ts-expect-error - Property 'dns' does not exist on type 'HARTimings'
        dns: timings.dns || 0,
        // @ts-expect-error - Property 'connect' does not exist on type 'HARTimings'
        connect: timings.connect || 0,
        // @ts-expect-error - Property 'send' does not exist on type 'HARTimings'
        send: timings.send || 0,
        // @ts-expect-error - Property 'wait' does not exist on type 'HARTimings'
        wait: timings.wait || 0,
        // @ts-expect-error - Property 'receive' does not exist on type 'HARTimings'
        receive: timings.receive || 0,
      };
    });
  } catch (error) {
    console.error('Failed to get request timings:', error);
    return [];
  }
}

/**
 * Attach HAR file to Allure with summary
 *
 * This is a convenience wrapper around the attachHar function from allure-helpers
 *
 * @param allure - The Allure reporter instance
 * @param harPath - Path to the HAR file
 * @param summary - Optional summary string
 * @param name - Name for the attachment
 *
 * @example
 * ```ts
 * await attachHar(allure, '/path/to/recording.har', '3 requests, 0 errors');
 * ```
 */
export async function attachHar(
  allure: MinimalAllureReporter,
  harPath: string,
  summary = '',
  name = 'HAR'
): Promise<void> {
  const { attachHar: attachHarFile } = await import('@/utils/allure-helpers');
  await attachHarFile(allure, harPath, summary, name);
}

/**
 * Mock API responses using HAR file
 *
 * @param page - The Playwright page instance
 * @param harPath - Path to the HAR file to use for mocking
 * @param options - Mock options
 *
 * @example
 * ```ts
 * await mockFromHar(page, '/path/to/recordings/api.har', {
 *   update: false, // Don't update, just replay
 * });
 * ```
 */
export async function mockFromHar(
  page: Page,
  harPath: string,
  options: {
    url?: string;
    update?: boolean;
    noOverride?: boolean;
  } = {}
): Promise<void> {
  const { url = '*', update = false, noOverride = false } = options;

  await page.routeFromHAR(harPath, {
    url,
    update,
    notFound: 'abort',
    // @ts-expect-error - noOverride is not in type definitions
    noOverride,
  });
}

/**
 * Record HAR with automatic cleanup
 *
 * Records HAR during test execution and automatically stops and attaches
 * when the test completes
 *
 * @param page - The Playwright page instance
 * @param testInfo - The test info object
 * @param allure - The Allure reporter instance
 * @param options - Recording options
 * @returns Cleanup function
 *
 * @example
 * ```ts
 * test('my test', async ({ page, testInfo, allure }) => {
 *   const cleanup = await recordHarAuto(page, testInfo, allure, {
 *     attachToAllure: true,
 *   });
 *   // ... perform test ...
 *   await cleanup(); // Automatically called on test end
 * });
 * ```
 */
export async function recordHarAuto(
  page: Page,
  testInfo: TestInfo,
  allure: MinimalAllureReporter,
  options: HarRecordOptions = {}
): Promise<() => Promise<void>> {
  const harPath = await startHarRecording(page, options);

  return async () => {
    await stopHarRecording(page, testInfo, allure, {
      ...options,
      harPath,
    });
  };
}

/**
 * Combine multiple HAR files into one
 *
 * @param harPaths - Array of HAR file paths
 * @param outputPath - Path for the combined HAR file
 *
 * @example
 * ```ts
 * await combineHarFiles([
 *   '/path/to/recording1.har',
 *   '/path/to/recording2.har',
 * ], '/path/to/combined.har');
 * ```
 */
export async function combineHarFiles(harPaths: string[], outputPath: string): Promise<void> {
  const combinedEntries: HAREntry[] = [];

  for (const harPath of harPaths) {
    try {
      const harContent = await readFile(harPath, 'utf-8');
      const har = JSON.parse(harContent) as { log: { entries: HAREntry[] } };
      combinedEntries.push(...(har.log?.entries || []));
    } catch (error) {
      console.error(`Failed to read HAR file ${harPath}:`, error);
    }
  }

  // Create combined HAR
  const combinedHar = {
    log: {
      version: '1.2',
      creator: {
        name: 'Playwright HAR Combiner',
        version: '1.0.0',
      },
      entries: combinedEntries,
    },
  };

  await writeFile(outputPath, JSON.stringify(combinedHar, null, 2));
}
