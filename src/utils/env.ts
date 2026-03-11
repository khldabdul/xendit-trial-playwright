/**
 * Environment variable utility
 *
 * Provides type-safe access to environment variables with validation
 * and default values.
 */

/**
 * Get a required environment variable
 *
 * @param key - The environment variable name
 * @returns The environment variable value
 *
 * @example
 * ```ts
 * const apiKey = getRequiredEnv('API_KEY');
 * ```
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable "${key}" is not set`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 *
 * @param key - The environment variable name
 * @param defaultValue - The default value if not set
 * @returns The environment variable value or default
 *
 * @example
 * ```ts
 * const timeout = getEnvWithDefault('TIMEOUT', '5000');
 * const port = getEnvWithDefault('PORT', '3000');
 * ```
 */
export function getEnvWithDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get an environment variable as a number
 *
 * @param key - The environment variable name
 * @param defaultValue - The default value if not set or invalid
 * @returns The environment variable value as a number
 *
 * @example
 * ```ts
 * const timeout = getEnvAsNumber('TIMEOUT_MS', 5000);
 * const port = getEnvAsNumber('PORT', 3000);
 * ```
 */
export function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return defaultValue;
  }
  return num;
}

/**
 * Get an environment variable as a boolean
 *
 * Accepts: 'true', '1', 'yes' (case-insensitive) as true
 *
 * @param key - The environment variable name
 * @param defaultValue - The default value if not set
 * @returns The environment variable value as a boolean
 *
 * @example
 * ```ts
 * const debug = getEnvAsBoolean('DEBUG', false);
 * const enableTracing = getEnvAsBoolean('ENABLE_TRACING', true);
 * ```
 */
export function getEnvAsBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]?.toLowerCase();
  if (!value) {
    return defaultValue;
  }
  return ['true', '1', 'yes'].includes(value);
}

/**
 * Get an environment variable as an array
 *
 * Splits on commas and trims whitespace
 *
 * @param key - The environment variable name
 * @param defaultValue - The default value if not set
 * @returns The environment variable value as an array
 *
 * @example
 * ```ts
 * // Given ALLOWED_HOSTS=example.com,test.com
 * const hosts = getEnvAsArray('ALLOWED_HOSTS', []);
 * // ['example.com', 'test.com']
 * ```
 */
export function getEnvAsArray(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Valid environment values
 */
export const VALID_ENVIRONMENTS = ['dev', 'staging', 'production'] as const;
export type ValidEnvironment = (typeof VALID_ENVIRONMENTS)[number];

/**
 * Get the current test environment
 *
 * Uses TEST_ENV environment variable. Defaults to 'dev' if not set.
 * Throws an error if TEST_ENV is set to an invalid value.
 *
 * Case-insensitive with multiple aliases supported:
 * - dev: dev, DEV, development, DEVELOPMENT
 * - staging: staging, STAGING, stg, STG, stage, STAGE
 * - production: production, PRODUCTION, prod, PROD
 *
 * @returns The environment name (dev, staging, or production)
 *
 * @example
 * ```ts
 * const env = getTestEnvironment();
 * console.log(env); // 'dev' | 'staging' | 'production'
 * ```
 *
 * @throws {Error} If TEST_ENV is set to an invalid value
 */
export function getTestEnvironment(): 'dev' | 'staging' | 'production' {
  const envValue = process.env['TEST_ENV'];

  // If not set, default to dev
  if (!envValue) {
    return 'dev';
  }

  // Normalize to lowercase for case-insensitive comparison
  const env = envValue.toLowerCase();

  // Map all aliases to canonical environment names
  // Development aliases
  if (['dev', 'development'].includes(env)) {
    return 'dev';
  }

  // Staging aliases
  if (['staging', 'stg', 'stage'].includes(env)) {
    return 'staging';
  }

  // Production aliases
  if (['production', 'prod'].includes(env)) {
    return 'production';
  }

  // Invalid value - throw error with helpful message
  throw new Error(
    `Invalid TEST_ENV value: "${envValue}". ` +
      `Valid values are: dev (or development), staging (or stg, stage), production (or prod). ` +
      `Usage: TEST_ENV=dev pnpm test`
  );
}

/**
 * Get an base URL for a specific app and environment
 *
 * This is a convenience wrapper around process.env
 *
 * @param appName - The application name
 * @param envOverride - Optional environment override (defaults to current test env)
 * @returns The base URL
 *
 * @example
 * ```ts
 * const baseUrl = await getBaseUrl('sauce-demo');
 * const stagingUrl = await getBaseUrl('sauce-demo', 'staging');
 * ```
 *
 * Falls back to configured base URLs if env-specific vars are not set.
 * This requires dynamic import to avoid circular dependencies.
 */
export async function getBaseUrl(appName: string, envOverride?: string): Promise<string> {
  const env = envOverride || getTestEnvironment();
  const key = `${appName.toUpperCase().replace(/-/g, '_')}_${env.toUpperCase()}_URL`;

  // Try environment-specific URL variable first
  const envUrl = process.env[key];
  if (envUrl) {
    return envUrl;
  }

  // Fall back to app config if env var not set
  // Load the app configuration dynamically
  const configModule = await import(`@/config/apps/${appName}.ts`);
  const appConfig = (configModule as any).default || (configModule as any)[appName];

  if (appConfig?.baseUrls?.[env]) {
    return appConfig.baseUrls[env];
  }

  throw new Error(
    `Environment variable "${key}" not set. ` +
      `Either set ${key} or ensure app config for "${appName}" has baseUrls.${env} configured.`
  );
}

/**
 * Validate that all required environment variables are set
 *
 * @param requiredKeys - Array of required environment variable names
 * @returns Object with isValid flag and missing variables
 *
 * @example
 * ```ts
 * const validation = validateEnv(['API_KEY', 'DB_URL']);
 * if (!validation.isValid) {
 *   console.error('Missing env vars:', validation.missing);
 * }
 * ```
 */
export function validateEnv(requiredKeys: string[]): {
  isValid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Get all environment-related configuration
 *
 * @returns Object with common environment settings
 *
 * @example
 * ```ts
 * const envConfig = getEnvConfig();
 * console.log(envConfig);
 * // {
 * //   environment: 'dev',
 * //   debug: false,
 * //   headless: true,
 * //   timeout: 30000,
 * //   browser: 'chromium'
 * // }
 * ```
 */
export function getEnvConfig(): {
  environment: 'dev' | 'staging' | 'production';
  debug: boolean;
  headless: boolean;
  timeout: number;
  browser: 'chromium' | 'firefox' | 'webkit';
  retries: number;
  workers: number;
} {
  return {
    environment: getTestEnvironment(),
    debug: getEnvAsBoolean('DEBUG', false),
    headless: getEnvAsBoolean('HEADLESS', true),
    timeout: getEnvAsNumber('TEST_TIMEOUT', 30000),
    browser: getEnvWithDefault('BROWSER', 'chromium') as 'chromium' | 'firefox' | 'webkit',
    retries: getEnvAsNumber('RETRIES', 0),
    workers: getEnvAsNumber('WORKERS', 1),
  };
}

/**
 * Set an environment variable (for testing purposes)
 *
 * @param key - The environment variable name
 * @param value - The value to set
 *
 * @example
 * ```ts
 * setEnv('API_KEY', 'test-key');
 * ```
 */
export function setEnv(key: string, value: string): void {
  process.env[key] = value;
}

/**
 * Delete an environment variable (for testing purposes)
 *
 * @param key - The environment variable name
 *
 * @example
 * ```ts
 * deleteEnv('API_KEY');
 * ```
 */
export function deleteEnv(key: string): void {
  delete process.env[key];
}
