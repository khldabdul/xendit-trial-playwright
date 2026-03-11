/**
 * API Base Fixtures
 *
 * Provides base fixtures for API testing that extend the base test fixture.
 * API tests use APIRequestContext instead of browser Page.
 */

import { test as base } from '@playwright/test';
import type { ApiFixtures, AppConfig } from '@/types/config.types';
import { getTestEnvironment } from '@/utils/env';

/**
 * Minimal allure reporter for API steps
 * This is a no-op placeholder for when allureplaywright is not installed
 */
class MinimalAllureReporter {
  async step(name: string, body: () => Promise<unknown>): Promise<unknown> {
    return body();
  }
}

/**
 * Base API test fixture
 *
 * Extends base fixture with API-specific functionality.
 * Prefixed with _ to discourage direct use - tests should use app-specific fixtures.
 */
export const _baseApiTest = base.extend<ApiFixtures>({
  /**
   * Allure reporter (minimal implementation)
   *
   * Provides step reporting for API operations.
   */
  allure: async ({}, use) => {
    await use(new MinimalAllureReporter() as ApiFixtures['allure']);
  },

  /**
   * API Request Context
   *
   * Provides methods for making HTTP requests without a browser.
   * This is the main fixture for API testing.
   */
  apiRequest: async ({ request }, use) => {
    await use(request);
  },

  /**
   * App configuration
   *
   * Dynamically loads configuration for the specified app.
   * This fixture should be overridden in app-specific fixtures.
   */
  appConfig: async ({}, use) => {
    // Default implementation - should be overridden
    const config = {
      name: 'default',
      displayName: 'Default App',
      type: 'api' as const,
      baseUrls: {
        dev: '',
        staging: '',
        production: '',
      },
    } as AppConfig;
    await use(config);
  },

  /**
   * Current environment
   *
   * Returns 'dev', 'staging', or 'production' based on TEST_ENV.
   */
  env: async ({}, use) => {
    const env = getTestEnvironment();
    await use(env);
  },

  /**
   * Base URL for API requests
   *
   * Returns the appropriate base URL for the current environment.
   */
  apiBaseUrl: async ({ appConfig, env }, use) => {
    const baseUrl = appConfig.baseUrls[env] || appConfig.baseUrls.dev || '';
    await use(baseUrl);
  },

  /**
   * Xendit API Client instantiated automatically
   */
  xenditApi: async ({ apiRequest, allure }, use) => {
    // Import here to avoid early evaluation before project builds
    const { XenditApiClient } = await import('../api/XenditApiClient.js');
    const secretKey = process.env.XENDIT_SECRET_KEY || 'MISSING_SECRET_KEY';
    const apiUrl = process.env.XENDIT_API_URL || 'https://api.xendit.co';
    const client = new XenditApiClient(apiRequest, secretKey, apiUrl, allure);
    await use(client);
  },

  /**
   * Step helper for creating explicit test steps in API tests
   */
  step: async ({ allure }, use) => {
    const { createStepHelper } = await import('@/utils/test-steps.js');
    await use(createStepHelper(allure));
  },
});

/**
 * Create an API client factory
 *
 * Returns a function that creates an API client with the base URL
 * and optional authentication headers.
 *
 * @param apiRequest - The Playwright API request context
 * @param baseUrl - The base URL for API requests
 * @param options - Optional client configuration
 * @returns A configured API client object
 *
 * @example
 * ```ts
 * const petstoreClient = createApiClient(apiRequest, apiBaseUrl, {
 *   headers: {
 *     'api_key': 'special-key',
 *   },
 * });
 *
 * // Make requests
 * const response = await petstoreClient.get('/pet/1');
 * ```
 */
export function createApiClient(
  apiRequest: ApiFixtures['apiRequest'],
  baseUrl: string,
  options: {
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
) {
  const { headers = {}, timeout = 30000 } = options;

  return {
    /**
     * Make a GET request
     *
     * @param endpoint - The API endpoint (e.g., '/pet/1')
     * @param params - Optional query parameters
     * @returns The API response
     */
    async get(endpoint: string, params?: Record<string, string | number>) {
      const url = new URL(endpoint, baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
      }

      return await apiRequest.get(url.toString(), {
        headers,
        timeout,
      });
    },

    /**
     * Make a POST request
     *
     * @param endpoint - The API endpoint
     * @param data - The request body data
     * @returns The API response
     */
    async post(endpoint: string, data?: unknown) {
      return await apiRequest.post(`${baseUrl}${endpoint}`, {
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout,
      });
    },

    /**
     * Make a PUT request
     *
     * @param endpoint - The API endpoint
     * @param data - The request body data
     * @returns The API response
     */
    async put(endpoint: string, data?: unknown) {
      return await apiRequest.put(`${baseUrl}${endpoint}`, {
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout,
      });
    },

    /**
     * Make a PATCH request
     *
     * @param endpoint - The API endpoint
     * @param data - The request body data
     * @returns The API response
     */
    async patch(endpoint: string, data?: unknown) {
      return await apiRequest.patch(`${baseUrl}${endpoint}`, {
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout,
      });
    },

    /**
     * Make a DELETE request
     *
     * @param endpoint - The API endpoint
     * @returns The API response
     */
    async delete(endpoint: string) {
      return await apiRequest.delete(`${baseUrl}${endpoint}`, {
        headers,
        timeout,
      });
    },

    /**
     * Make a request with custom options
     *
     * @param method - The HTTP method
     * @param endpoint - The API endpoint
     * @param options - Custom request options
     * @returns The API response
     */
    async request(
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      endpoint: string,
      options: {
        data?: unknown;
        params?: Record<string, string | number>;
        headers?: Record<string, string>;
      } = {}
    ) {
      const url = new URL(endpoint, baseUrl);

      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
      }

      return await apiRequest.fetch(url.toString(), {
        method,
        data: options.data,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers,
        },
        timeout,
      });
    },

    /**
     * Get the base URL
     *
     * @returns The base URL for this client
     */
    getBaseUrl() {
      return baseUrl;
    },

    /**
     * Set a default header
     *
     * @param key - The header name
     * @param value - The header value
     */
    setHeader(key: string, value: string) {
      headers[key] = value;
    },

    /**
     * Remove a default header
     *
     * @param key - The header name
     */
    removeHeader(key: string) {
      delete headers[key];
    },
  };
}

/**
 * Create an authenticated API client
 *
 * Similar to createApiClient but automatically includes authentication.
 *
 * @param apiRequest - The Playwright API request context
 * @param baseUrl - The base URL for API requests
 * @param auth - Authentication configuration
 * @returns A configured API client with authentication
 *
 * @example
 * ```ts
 * const authenticatedClient = createAuthenticatedClient(
 *   apiRequest,
 *   apiBaseUrl,
 *   { type: 'bearer', token: 'your-token' }
 * );
 * ```
 */
export function createAuthenticatedClient(
  apiRequest: ApiFixtures['apiRequest'],
  baseUrl: string,
  auth: {
    type: 'bearer' | 'basic' | 'apikey' | 'custom';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    headerName?: string;
    customHeaders?: Record<string, string>;
  }
) {
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (auth.type) {
    case 'bearer':
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      break;

    case 'basic':
      if (auth.username && auth.password) {
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;

    case 'apikey':
      if (auth.apiKey) {
        const headerName = auth.headerName || 'X-API-Key';
        headers[headerName] = auth.apiKey;
      }
      break;

    case 'custom':
      headers = { ...headers, ...auth.customHeaders };
      break;
  }

  return createApiClient(apiRequest, baseUrl, { headers });
}

/**
 * Wait for a condition with polling
 *
 * Useful for waiting for async operations to complete.
 *
 * @param condition - Function that returns true when condition is met
 * @param options - Wait options
 * @returns Promise that resolves when condition is met
 *
 * @example
 * ```ts
 * await waitForCondition(async () => {
 *   const response = await client.get('/order/123');
 *   const data = await response.json();
 *   return data.status === 'complete';
 * }, { timeout: 30000, interval: 1000 });
 * ```
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 30000,
    interval = 1000,
    message = 'Condition not met within timeout',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(message);
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns The result of the function
 *
 * @example
 * ```ts
 * const response = await retryRequest(
 *   () => client.get('/pet/1'),
 *   { maxRetries: 3, delay: 1000 }
 * );
 * ```
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
    retryIf?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2, retryIf } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (retryIf && !retryIf(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(backoff, attempt);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}
