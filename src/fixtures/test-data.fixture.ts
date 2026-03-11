/**
 * Enhanced Test Data Fixture
 *
 * Provides test data files for tests with opt-in loading.
 * Supports multiple data sources (local files, JSON fixtures).
 *
 * @example
 * ```typescript
 * import { test } from '@/decorators';
 *
 * class MyTests {
 *   @test.withTestData({ username: 'standard_user' })
 *   async loginTest() {
 *     const { username, password } = this.testData;
 *     await this.login(username, password);
 *   }
 * }
 * ```
 */

import { test as base } from '@playwright/test';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import type { TestData } from '@/types/config.types';

/**
 * Test data file configuration for fixture
 */
export interface FixtureTestDataConfig {
  /** Name for the test data in Allure report */
  name?: string;

  /** Path to test data JSON file (relative to project root) */
  path?: string;

  /** Whether to attach as file reference instead of embedded JSON */
  asFileRef?: boolean;

  /** Whether this is the default test data source */
  default?: boolean;
}

/**
 * Test data fixture options
 */
export interface TestDataFixture {
  /**
   * Test data configuration
   * Can specify a config name, file path, or use default
   */
  testData: TestData;
}

/**
 * Test data fixture
 *
 * Loads test data from JSON files and makes it available to tests.
 * Data is cached per test worker to avoid repeated file reads.
 */
export const testData = base.extend<TestDataFixture>({
  /**
   * Test data provider
   *
   * Loads test data from configured JSON files.
   * Usage:
   * ```typescript
   * const { testData } = test.use('testData');
   * const user = testData.users?.standardUser;
   * ```
   */
  testData: async ({}, use) => {
    const config = resolveTestDataConfig();

    if (!config) {
      // No test data configured
      await use({});
      return;
    }

    // Resolve absolute file path
    let filePath: string;
    if (config.path) {
      filePath = path.resolve(process.cwd(), config.path);
    } else if (config.name) {
      // Try to find in test-data directory
      const testDataDir = path.resolve(process.cwd(), 'test-data');
      filePath = path.join(testDataDir, `${config.name}.json`);
    } else {
      throw new Error(`Invalid testData config: ${JSON.stringify(config)}`);
    }

    // Load and cache test data
    const data = await loadTestData(filePath);

    // Make data available to test
    await use(data);
  },
});

/**
 * Resolve test data configuration from test use or environment
 */
function resolveTestDataConfig(): FixtureTestDataConfig | null {
  // Check environment variable
  const envVar = process.env.TEST_DATA;
  if (envVar) {
    try {
      return JSON.parse(envVar) as FixtureTestDataConfig;
    } catch {
      console.warn(`Invalid TEST_DATA environment variable, using defaults: ${envVar}`);
      return { name: 'default' };
    }
  }

  // Check for suite config (from file-level decorators)
  const currentSuite = getCurrentSuite();
  if (currentSuite) {
    return { name: currentSuite, default: true };
  }

  // Default fallback
  return { name: 'default' };
}

/**
 * Get current suite from file-level decorators
 * Uses a simple heuristic based on test file path
 */
function getCurrentSuite(): string | null {
  // Get test file path from environment or use a default
  const testPath = process.env.TEST_FILE_PATH || '';

  if (testPath.includes('apps/e2e/')) {
    const match = testPath.match(/apps\/e2e\/([^/]+)\//);
    if (match) {
      // Convert to hyphenated format (e.g., "sauce-demo" → "sauce-demo")
      return match[1];
    }
  }

  if (testPath.includes('apps/api/')) {
    const match = testPath.match(/apps\/api\/([^/]+)\//);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Load test data from JSON file with caching
 */
async function loadTestData(filePath: string): Promise<TestData> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse JSON
    const data = JSON.parse(fileContent) as TestData;

    // Validate structure
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid test data file: ${filePath}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to load test data from ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Find test data files in project
 */
export async function findTestDataFiles(): Promise<string[]> {
  const testDataDir = path.resolve(process.cwd(), 'test-data');

  try {
    await fs.mkdir(testDataDir, { recursive: true });
  } catch {
    // Directory might exist, that's ok
  }

  const entries = await fs.readdir(testDataDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.name.endsWith('.json') && entry.isFile())
    .map((entry) => path.join(testDataDir, entry.name));
}
