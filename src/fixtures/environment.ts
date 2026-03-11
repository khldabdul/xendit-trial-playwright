/**
 * Environment configuration fixtures
 */

import { _baseTest as base } from './base';

const baseAny = base as any;

/**
 * Environment configuration loaded from config files
 */
export const envConfig = baseAny.fixtures.envConfig;

/**
 * Current environment name (dev/staging/production)
 */
export const env = baseAny.fixtures.env;

/**
 * Unique run ID for test history tracking
 */
export const runId = baseAny.fixtures.runId;

/**
 * Re-export base test and expect
 */
export const test = base;
export const expect = base.expect;
