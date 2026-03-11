/**
 * Data loader utility for dynamic configuration loading
 *
 * Provides type-safe functions to load configurations at runtime,
 * with support for environment-specific overrides and caching.
 */

import type { AppConfig, EnvironmentConfig, TestDataConfig, TestUser } from '@/types/config.types';
import { getTestEnvironment } from '@/utils/env';

/**
 * Cache for loaded configurations
 */
const configCache = new Map<string, unknown>();

/**
 * Load an app configuration by name
 *
 * @param appName - The application name (e.g., 'sauce-demo', 'petstore')
 * @param env - The environment (default: from process.env)
 * @returns The app configuration
 *
 * @example
 * ```ts
 * const sauceDemoConfig = await loadAppConfig('sauce-demo');
 * const baseUrl = sauceDemoConfig.baseUrls[env];
 * ```
 */
export async function loadAppConfig<T extends AppConfig = AppConfig>(
  appName: string,
  env?: string
): Promise<T> {
  const environment = env || getTestEnvironment();
  const cacheKey = `app-${appName}-${environment}`;

  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey) as T;
  }

  try {
    // Dynamic import based on app name
    const configModule = await import(`@/config/apps/${appName}.ts`);
    const config = configModule.default as T;

    // Cache the result
    configCache.set(cacheKey, config);

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config for app "${appName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load environment configuration
 *
 * @param env - The environment name (default: from process.env)
 * @returns The environment configuration
 *
 * @example
 * ```ts
 * const envConfig = await loadEnvironmentConfig('staging');
 * console.log(envConfig.defaultTimeout); // 45000
 * ```
 */
export async function loadEnvironmentConfig(env?: string): Promise<EnvironmentConfig> {
  const environment = env || getTestEnvironment();
  const cacheKey = `env-${environment}`;

  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey) as EnvironmentConfig;
  }

  try {
    const envModule = await import('@/config/environments');
    const config = envModule.environments[environment];

    if (!config) {
      throw new Error(`Environment "${environment}" not found`);
    }

    // Cache the result
    configCache.set(cacheKey, config);

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load environment config for "${environment}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load test data configuration
 *
 * @returns The test data configuration
 *
 * @example
 * ```ts
 * const testData = await loadTestData();
 * const user = testData.users.standard;
 * ```
 */
export async function loadTestData(): Promise<TestDataConfig> {
  const cacheKey = 'test-data';

  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey) as TestDataConfig;
  }

  try {
    const testDataModule = await import('@/config/test-data');
    const data = testDataModule.testData;

    // Cache the result
    configCache.set(cacheKey, data);

    return data as TestDataConfig;
  } catch (error) {
    throw new Error(
      `Failed to load test data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load a specific test user for an app
 *
 * @param appName - The application name
 * @param userType - The user type (e.g., 'standard', 'locked', 'admin')
 * @returns The test user credentials
 *
 * @example
 * ```ts
 * const user = await loadTestUser('sauce-demo', 'standard');
 * console.log(user.username); // 'standard_user'
 * ```
 */
export async function loadTestUser(appName: string, userType: string): Promise<TestUser> {
  const appConfig = await loadAppConfig(appName);

  if (!appConfig.testUsers || !appConfig.testUsers[userType]) {
    throw new Error(`Test user "${userType}" not found for app "${appName}"`);
  }

  return appConfig.testUsers[userType];
}

/**
 * Get the base URL for an app in the current environment
 *
 * @param appName - The application name
 * @param env - The environment (default: from process.env)
 * @returns The base URL
 *
 * @example
 * ```ts
 * const baseUrl = await getBaseUrl('sauce-demo', 'production');
 * console.log(baseUrl); // 'https://www.saucedemo.com'
 * ```
 */
export async function getBaseUrl(appName: string, env?: string): Promise<string> {
  const environment = env || getTestEnvironment();
  const appConfig = await loadAppConfig(appName);
  const url = appConfig.baseUrls[environment as keyof typeof appConfig.baseUrls];

  if (!url) {
    throw new Error(`Base URL not found for app "${appName}" in environment "${environment}"`);
  }

  return url;
}

/**
 * Clear the configuration cache
 *
 * Useful for testing or when configs need to be reloaded
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Preload multiple configurations at once
 *
 * @param options - Options for what to preload
 * @returns A promise that resolves when all configs are loaded
 *
 * @example
 * ```ts
 * await preloadConfigs({
 *   apps: ['sauce-demo', 'petstore'],
 *   environments: ['dev', 'staging'],
 *   includeTestData: true,
 * });
 * ```
 */
export async function preloadConfigs(options: {
  apps?: string[];
  environments?: string[];
  includeTestData?: boolean;
}): Promise<void> {
  const promises: Promise<unknown>[] = [];

  // Preload app configs
  if (options.apps) {
    for (const app of options.apps) {
      promises.push(loadAppConfig(app));
    }
  }

  // Preload environment configs
  if (options.environments) {
    for (const env of options.environments) {
      promises.push(loadEnvironmentConfig(env));
    }
  }

  // Preload test data
  if (options.includeTestData) {
    promises.push(loadTestData());
  }

  await Promise.all(promises);
}
