/**
 * Fixtures barrel export
 *
 * IMPORTANT: Tests should import from app-specific fixtures
 * (e.g., @sauce-demo-fixtures, @petstore-fixtures)
 * NOT from this base fixtures module
 */

export * from './base';
export { envConfig, env, runId, test, expect } from './environment';
