/**
 * Test-related type definitions
 */

import type { Page, BrowserContext, APIRequestContext } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types';
import type { Severity } from './config.types';

/**
 * Test fixture interfaces
 */
export interface BaseFixtures {
  envConfig: import('./config.types').EnvironmentConfig;
  env: 'dev' | 'staging' | 'production';
  runId: string;
}

/**
 * Allure reporter fixture
 */
export interface AllureFixtures {
  allure: MinimalAllureReporter;
}

/**
 * Playwright core fixtures
 */
export interface PlaywrightFixtures {
  page: Page;
  context: BrowserContext;
  request: APIRequestContext;
}

/**
 * E2E test options for decorators
 */
export interface E2eTestOptions {
  epic: string;
  feature: string;
  story: string;
  testcase: string;
  requirement?: string;
  severity?: Severity;
  description?: string;
  smoke?: boolean;
  tags?: string[];
  app: string;
  critical?: boolean;
}

/**
 * API test options for decorators
 */
export interface ApiTestOptions {
  epic: string;
  feature: string;
  story: string;
  testcase: string;
  requirement?: string;
  severity?: Severity;
  description?: string;
  smoke?: boolean;
  tags?: string[];
}

/**
 * Test result information
 */
export interface TestResultInfo {
  status: 'passed' | 'failed' | 'skipped' | 'timedout';
  duration: number;
  error?: Error;
  attachments: TestAttachment[];
}

/**
 * Test attachment for Allure
 */
export interface TestAttachment {
  name: string;
  type: string;
  content: Buffer | string;
}
