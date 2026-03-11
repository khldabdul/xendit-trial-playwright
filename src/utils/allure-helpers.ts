/**
 * Allure helper utilities
 *
 * Provides convenience functions for common Allure reporting tasks
 * including attachments, labels, steps, and test result categorization.
 */

import type { MinimalAllureReporter, ContentType } from '@/types/config.types';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Attach a file as an Allure attachment
 *
 * @param allure - The Allure reporter instance
 * @param filePath - Path to the file to attach
 * @param name - Name for the attachment
 * @param contentType - MIME type of the file
 *
 * @example
 * ```ts
 * await attachFile(allure, '/path/to/screenshot.png', 'Login Screenshot', 'image/png');
 * ```
 */
export async function attachFile(
  allure: MinimalAllureReporter,
  filePath: string,
  name: string,
  contentType: ContentType
): Promise<void> {
  try {
    const buffer = await readFile(filePath);
    allure.attachment(name, buffer, { contentType });
  } catch (error) {
    allure.attachment(
      `${name} (Failed to read)`,
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      { contentType: 'text/plain' }
    );
  }
}

/**
 * Attach a screenshot to Allure
 *
 * @param allure - The Allure reporter instance
 * @param screenshotPath - Path to the screenshot file
 * @param name - Name for the screenshot (default: 'Screenshot')
 *
 * @example
 * ```ts
 * await attachScreenshot(allure, '/path/to/screenshot.png', 'Login Failed');
 * ```
 */
export async function attachScreenshot(
  allure: MinimalAllureReporter,
  screenshotPath: string,
  name = 'Screenshot'
): Promise<void> {
  await attachFile(allure, screenshotPath, name, 'image/png');
}

/**
 * Attach a video recording to Allure
 *
 * @param allure - The Allure reporter instance
 * @param videoPath - Path to the video file
 * @param name - Name for the video (default: 'Video')
 *
 * @example
 * ```ts
 * await attachVideo(allure, '/path/to/video.webm', 'Test Recording');
 * ```
 */
export async function attachVideo(
  allure: MinimalAllureReporter,
  videoPath: string,
  name = 'Video'
): Promise<void> {
  await attachFile(allure, videoPath, name, 'video/webm');
}

/**
 * Attach a trace file to Allure
 *
 * @param allure - The Allure reporter instance
 * @param tracePath - Path to the trace zip file
 * @param name - Name for the trace (default: 'Trace')
 *
 * @example
 * ```ts
 * await attachTrace(allure, '/path/to/trace.zip', 'Network Trace');
 * ```
 */
export async function attachTrace(
  allure: MinimalAllureReporter,
  tracePath: string,
  name = 'Trace'
): Promise<void> {
  await attachFile(allure, tracePath, name, 'application/zip');
}

/**
 * Attach a HAR file with a summary to Allure
 *
 * @param allure - The Allure reporter instance
 * @param harPath - Path to the HAR file
 * @param summary - Optional summary of the HAR content
 * @param name - Name for the HAR (default: 'HAR')
 *
 * @example
 * ```ts
 * await attachHar(allure, '/path/to/network.har', '3 requests, 0 errors');
 * ```
 */
export async function attachHar(
  allure: MinimalAllureReporter,
  harPath: string,
  summary = '',
  name = 'HAR'
): Promise<void> {
  await attachFile(allure, harPath, name, 'application/json');

  // Add summary as a text attachment if provided
  if (summary) {
    allure.attachment(`${name} Summary`, summary, { contentType: 'text/plain' });
  }
}

/**
 * Attach text content to Allure
 *
 * @param allure - The Allure reporter instance
 * @param content - The text content
 * @param name - Name for the attachment
 *
 * @example
 * ```ts
 * await attachText(allure, 'Error: Timeout exceeded', 'Error Message');
 * ```
 */
export function attachText(allure: MinimalAllureReporter, content: string, name = 'Text'): void {
  allure.attachment(name, content, { contentType: 'text/plain' });
}

/**
 * Attach JSON data to Allure
 *
 * @param allure - The Allure reporter instance
 * @param data - The data to attach (will be stringified)
 * @param name - Name for the attachment
 *
 * @example
 * ```ts
 * await attachJson(allure, { user: 'test', id: 123 }, 'User Data');
 * ```
 */
export function attachJson(allure: MinimalAllureReporter, data: unknown, name = 'JSON'): void {
  const content = JSON.stringify(data, null, 2);
  allure.attachment(name, content, { contentType: 'application/json' });
}

/**
 * Attach HTML content to Allure
 *
 * @param allure - The Allure reporter instance
 * @param html - The HTML content
 * @param name - Name for the attachment
 *
 * @example
 * ```ts
 * await attachHtml(allure, '<div>Test Report</div>', 'HTML Report');
 * ```
 */
export function attachHtml(allure: MinimalAllureReporter, html: string, name = 'HTML'): void {
  allure.attachment(name, html, { contentType: 'text/html' });
}

/**
 * Attach multiple files from a directory
 *
 * @param allure - The Allure reporter instance
 * @param directory - Path to the directory
 * @param pattern - Glob pattern for files (default: '*')
 * @param getContentType - Function to determine content type from filename
 *
 * @example
 * ```ts
 * await attachDirectory(allure, '/path/to/artifacts', '*.png', (file) => 'image/png');
 * ```
 */
export async function attachDirectory(
  allure: MinimalAllureReporter,
  directory: string,
  pattern = '*',
  getContentType?: (filename: string) => ContentType
): Promise<void> {
  // @ts-expect-error - Dynamic import for optional glob dependency
  const { glob } = await import('glob');
  const files = await glob(pattern, { cwd: directory });

  for (const file of files) {
    const filePath = path.join(directory, file);
    const contentType = getContentType?.(file) || 'application/octet-stream';
    await attachFile(allure, filePath, file, contentType);
  }
}

/**
 * Create a step with automatic status tracking
 *
 * @param allure - The Allure reporter instance
 * @param name - Step name
 * @param fn - Step function to execute
 * @returns The result of the step function
 *
 * @example
 * ```ts
 * await createStep(allure, 'Login to application', async () => {
 *   await page.goto('/login');
 *   await page.fill('#username', 'user');
 *   await page.fill('#password', 'pass');
 *   await page.click('#login');
 * });
 * ```
 */
export async function createStep<T>(
  allure: MinimalAllureReporter,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return await allure.step(name, fn);
}

/**
 * Create a step with parameters display
 *
 * @param allure - The Allure reporter instance
 * @param name - Step name template (use {} for parameter insertion)
 * @param params - Parameters to insert into name
 * @param fn - Step function to execute
 * @returns The result of the step function
 *
 * @example
 * ```ts
 * await createStepWithParams(
 *   allure,
 *   'Fill {} with {}',
 *   ['Username', 'testuser'],
 *   async () => {
 *     await page.fill('#username', 'testuser');
 *   }
 * );
 * ```
 */
export async function createStepWithParams<T>(
  allure: MinimalAllureReporter,
  name: string,
  params: (string | number)[],
  fn: () => Promise<T>
): Promise<T> {
  let stepName = name;
  params.forEach((param, _index) => {
    stepName = stepName.replace('{}', String(param));
  });

  return await allure.step(stepName, fn);
}

/**
 * Add multiple labels at once
 *
 * @param allure - The Allure reporter instance
 * @param labels - Object of label names to values
 *
 * @example
 * ```ts
 * addLabels(allure, {
 *   epic: 'Authentication',
 *   feature: 'Login',
 *   story: 'User Login',
 * });
 * ```
 */
export function addLabels(allure: MinimalAllureReporter, labels: Record<string, string>): void {
  Object.entries(labels).forEach(([name, value]) => {
    allure.label(name, value);
  });
}

/**
 * Add multiple tags at once
 *
 * @param allure - The Allure reporter instance
 * @param tags - Array of tag names
 *
 * @example
 * ```ts
 * addTags(allure, ['smoke', 'critical', 'auth']);
 * ```
 */
export function addTags(allure: MinimalAllureReporter, tags: string[]): void {
  tags.forEach((tag) => allure.tag(tag));
}

/**
 * Set test severity with category
 *
 * @param allure - The Allure reporter instance
 * @param severity - The severity level
 *
 * @example
 * ```ts
 * setSeverity(allure, 'critical');
 * ```
 */
export function setSeverity(
  allure: MinimalAllureReporter,
  severity: 'blocker' | 'critical' | 'major' | 'minor' | 'trivial'
): void {
  allure.severity(severity);
}

/**
 * Add test owner
 *
 * @param allure - The Allure reporter instance
 * @param owner - The owner name or email
 *
 * @example
 * ```ts
 * setOwner(allure, 'john.doe@example.com');
 * ```
 */
export function setOwner(allure: MinimalAllureReporter, owner: string): void {
  allure.label('owner', owner);
}

/**
 * Add test lead
 *
 * @param allure - The Allure reporter instance
 * @param lead - The lead name or email
 *
 * @example
 * ```ts
 * setLead(allure, 'jane.smith@example.com');
 * ```
 */
export function setLead(allure: MinimalAllureReporter, lead: string): void {
  allure.label('lead', lead);
}

/**
 * Categorize a test failure
 *
 * @param allure - The Allure reporter instance
 * @param category - Pre-defined failure category
 * @param message - Optional failure message
 *
 * @example
 * ```ts
 * categorizeFailure(allure, 'Assertion Error', 'Expected 200 but got 500');
 * ```
 */
export function categorizeFailure(
  allure: MinimalAllureReporter,
  category:
    | 'Assertion Error'
    | 'Network Error'
    | 'Timeout'
    | 'Element Not Found'
    | 'Unexpected Behavior',
  message?: string
): void {
  allure.label('failureCategory', category);
  if (message) {
    allure.label('failureMessage', message);
  }
}

/**
 * Link test to external systems
 *
 * @param allure - The Allure reporter instance
 * @param type - Link type (issue, tms, etc.)
 * @param url - The URL to link to
 * @param name - Optional link name
 *
 * @example
 * ```ts
 * addLink(allure, 'tms', 'https://jira.example.com/TEST-123', 'TEST-123');
 * ```
 */
export function addLink(
  allure: MinimalAllureReporter,
  type: 'issue' | 'tms' | 'link',
  url: string,
  name?: string
): void {
  allure.link(url, { name, type });
}

/**
 * Set Allure description with HTML support
 *
 * @param allure - The Allure reporter instance
 * @param description - The description (supports HTML)
 *
 * @example
 * ```ts
 * setDescription(allure, '<p>This test verifies <strong>login functionality</strong>.</p>');
 * ```
 */
export function setDescription(allure: MinimalAllureReporter, description: string): void {
  allure.descriptionHtml(description);
}

/**
 * Add a test parameter
 *
 * @param allure - The Allure reporter instance
 * @param name - Parameter name
 * @param value - Parameter value
 *
 * @example
 * ```ts
 * addParameter(allure, 'browser', 'chromium');
 * addParameter(allure, 'environment', 'staging');
 * ```
 */
export function addParameter(allure: MinimalAllureReporter, name: string, value: string): void {
  allure.parameter(name, value);
}

/**
 * Add multiple parameters at once
 *
 * @param allure - The Allure reporter instance
 * @param params - Object of parameter names to values
 *
 * @example
 * ```ts
 * addParameters(allure, {
 *   browser: 'chromium',
 *   environment: 'staging',
 *   viewport: '1920x1080',
 * });
 * ```
 */
export function addParameters(allure: MinimalAllureReporter, params: Record<string, string>): void {
  Object.entries(params).forEach(([name, value]) => {
    allure.parameter(name, value);
  });
}

/**
 * Get content type from file extension
 *
 * @param filename - The filename to get content type for
 * @returns The MIME type
 *
 * @example
 * ```ts
 * const type = getContentType('screenshot.png'); // 'image/png'
 * const type = getContentType('trace.zip'); // 'application/zip'
 * ```
 */
export function getContentType(filename: string): ContentType {
  const ext = path.extname(filename).toLowerCase();

  const contentTypes: Record<string, ContentType> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  };

  return contentTypes[ext] || 'application/octet-stream';
}
