/**
 * Type-safe configuration types for the framework
 */

import type { APIRequestContext, APIResponse } from '@playwright/test';

// Re-export APIResponse for use in clients
export type { APIResponse };

/**
 * Minimal Allure reporter interface
 * Wraps the real allure-playwright API to support returning values from steps
 *
 * Note: Parameters should be included directly in the step name for visibility in reports.
 * For example: await allure.step(`Login with username: ${username}`, async () => {...})
 *
 * The step method returns the result of the callback, unlike the raw allure-playwright API.
 */
export interface MinimalAllureReporter {
  step<T>(name: string, body: () => Promise<T>): Promise<T>;
  attachment(name: string, content: Buffer | string, options: { contentType: string }): void;
  epic(epic: string): void;
  feature(feature: string): void;
  story(story: string): void;
  label(name: string, value: string): void;
  severity(severity: string): void;
  tag(tag: string): void;
  description(description: string): void;
  descriptionHtml(description: string): void;
  link(url: string, options?: { name?: string | undefined; type?: string | undefined }): void;
  parameter(name: string, value: string): void;
}

/**
 * Content type for Allure attachments
 */
export type ContentType =
  | 'text/plain'
  | 'text/html'
  | 'text/xml'
  | 'text/csv'
  | 'application/json'
  | 'application/xml'
  | 'application/pdf'
  | 'application/octet-stream'
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'image/svg+xml'
  | 'video/mp4'
  | 'video/webm'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/zip'
  | 'application/x-rar-compressed';

/**
 * API test fixtures
 */
export interface ApiFixtures {
  /**
   * Allure reporter for step tracking
   */
  allure: MinimalAllureReporter;

  /**
   * API request context for making HTTP requests
   */
  apiRequest: APIRequestContext;

  /**
   * Application configuration
   */
  appConfig: AppConfig;

  /**
   * Current environment (dev, staging, production)
   */
  env: 'dev' | 'staging' | 'production';

  /**
   * Base URL for API requests
   */
  apiBaseUrl: string;

  /**
   * Test data for API tests
   */
  testData?: Record<string, any>;

  /**
   * Xendit API Client for interactions
   */
  xenditApi: import('../api/XenditApiClient.js').XenditApiClient;

  /**
   * Step helper for creating explicit test steps
   */
  step: import('../utils/test-steps.js').StepHelper;
}

/**
 * Environment configuration (dev, staging, production)
 */
export interface EnvironmentConfig {
  name: 'dev' | 'staging' | 'production';
  description: string;
  defaultTimeout: number;
  screenshotOnFailure: boolean;
  video: VideoOption;
  tracing: TraceOption;
  browsers: Record<string, BrowserConfig>;
  viewports: Record<string, ViewportConfig>;
}

/**
 * Video recording options
 */
export type VideoOption = 'on' | 'off' | 'retain-on-failure';

/**
 * Trace recording options
 */
export type TraceOption = 'on' | 'off' | 'retain-on-failure';

/**
 * Browser configuration
 */
export interface BrowserConfig {
  channel?: string;
}

/**
 * Viewport configuration for different screen sizes
 */
export interface ViewportConfig {
  width: number;
  height: number;
}

/**
 * Test data configuration (from config files)
 */
export interface TestDataConfig {
  /** Test data source name or file path */
  name?: string;

  /** Path to test data JSON file (relative to project root) */
  path?: string;

  /** Whether to attach as file reference instead of embedded JSON */
  asFileRef?: boolean;

  /** Whether this is the default test data source */
  default?: boolean;

  /** App-specific test data (for per-app configs) */
  app?: string;
}

/**
 * Test data fixture configuration
 */
export interface TestDataFixture {
  /**
   * Test data configuration
   * Can specify a config name, file path, or use default
   */
  testData: TestDataConfig;
}

/**
 * Application configuration
 */
export interface AppConfig {
  name: string;
  displayName: string;
  type: 'e2e' | 'api';
  description?: string;
  documentationUrl?: string;
  baseUrls: EnvironmentUrls;
  testUsers?: Record<string, TestUser>;
  settings?: AppSettings;
  auth?: AuthConfig;
  apiBaseUrl?: string;
}

/**
 * Environment-specific URLs for an app
 */
export interface EnvironmentUrls {
  dev: string;
  staging: string;
  production: string;
}

/**
 * Test user credentials
 */
export interface TestUser {
  username: string;
  password: string;
  email?: string;
  role?: string;
}

/**
 * App-specific settings
 */
export interface AppSettings {
  defaultTimeout?: number;
  timeout?: number;
  screenshotOnFailure?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
  viewport?: ViewportConfig;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type?: 'basic' | 'bearer' | 'api-key' | 'apikey' | 'custom' | 'none';
  storageStatePath?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  headerName?: string;
}

/**
 * Shared test data
 */
export interface TestData {
  users?: Record<string, any>;
  products?: Record<string, any>;
  [key: string]: any;
}

/**
 * Severity levels for test categorization
 */
export type Severity = 'blocker' | 'critical' | 'high' | 'normal' | 'low' | 'trivial';

/**
 * API app fixtures (base type for API tests)
 */
export interface ApiAppFixtures extends ApiFixtures {
  clients: Record<string, any>;
}
