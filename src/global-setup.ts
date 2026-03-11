/**
 * Global setup for Playwright tests
 *
 * This file runs once before all tests and can be used for:
 * - Starting required services
 * - Setting up test data
 * - Validating environment configuration
 */

import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Validate environment configuration
 *
 * Checks if TEST_ENV or ENV is set and validates the value.
 * If not set, defaults to 'dev' and shows a warning.
 */
function validateEnvironment(): void {
  // Support both ENV and TEST_ENV for flexibility
  const envValue = process.env.TEST_ENV || process.env.ENV;
  const validEnvironments = ['dev', 'development', 'staging', 'stage', 'prod', 'production'];

  // Normalize environment value
  let normalizedEnv = 'dev'; // default
  let source = 'default';

  if (envValue) {
    const lowerEnv = envValue.toLowerCase();
    if (validEnvironments.includes(lowerEnv)) {
      normalizedEnv = lowerEnv;
      source = process.env.TEST_ENV ? 'TEST_ENV' : 'ENV';
    } else {
      console.warn(`\n⚠️  Warning: Invalid environment value "${envValue}"`);
      console.warn(`   Valid values: dev, staging, production (or development, stage, prod)`);
      console.warn(`   Defaulting to "dev"\n`);
    }
  } else {
    console.warn(`\n⚠️  Warning: No environment variable set (TEST_ENV or ENV)`);
    console.warn(`   Defaulting to "dev"`);
    console.warn(`   To set environment: TEST_ENV=staging pnpm run test <app>\n`);
  }

  // Set normalized TEST_ENV for use throughout the framework
  const envMap: Record<string, string> = {
    development: 'dev',
    stage: 'staging',
    prod: 'production',
  };
  process.env.TEST_ENV = envMap[normalizedEnv] || normalizedEnv;

  console.log(`\n✓ Environment: ${process.env.TEST_ENV} (from ${source})`);
  console.log(`✓ Node version: ${process.version}`);
  console.log(`✓ Platform: ${process.platform}\n`);
}

/**
 * Ensure Allure results directory exists
 */
async function ensureAllureDirectory(): Promise<void> {
  const { mkdir } = await import('fs/promises');
  const allureDir = process.env.ALLURE_RESULTS_DIR || 'allure-results';

  try {
    await mkdir(allureDir, { recursive: true });
    console.log(`✓ Allure results directory: ${allureDir}`);
  } catch (error) {
    console.error(`✗ Failed to create Allure directory: ${error}`);
  }
}

/**
 * Generate a unique run ID for this test run
 */
function generateRunId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const random = Math.random().toString(36).substring(2, 8);
  return `run_${timestamp}_${random}`;
}

/**
 * Preload configurations for better performance
 */
async function preloadConfigurations(): Promise<void> {
  try {
    // This will be handled by individual fixtures
    // We just validate the configs exist
    const { access } = await import('fs/promises');
    const { constants } = await import('fs');

    const configFiles = ['src/config/environments.ts', 'src/config/test-data.ts'];

    for (const file of configFiles) {
      try {
        await access(file, constants.R_OK);
      } catch {
        throw new Error(`Required config file not found: ${file}`);
      }
    }

    console.log('✓ Configuration files validated');
  } catch (error) {
    console.error(`✗ Configuration validation failed: ${error}`);
    throw error;
  }
}

/**
 * Check if Docker services are running (if applicable)
 */
async function checkDockerServices(): Promise<void> {
  if (process.env.CI !== 'true') {
    // Skip Docker checks on local dev
    return;
  }

  try {
    // Check if Docker is available
    await execAsync('docker --version');
    console.log('✓ Docker is available');

    // Check if required containers are running
    const { stdout } = await execAsync('docker ps --format "{{.Names}}"');

    const requiredContainers = process.env.REQUIRED_DOCKER_CONTAINERS?.split(',') || [];

    for (const container of requiredContainers) {
      if (stdout.includes(container.trim())) {
        console.log(`✓ Docker container running: ${container}`);
      } else {
        console.warn(`⚠ Docker container not running: ${container}`);
      }
    }
  } catch {
    console.warn('⚠ Docker is not available or not running');
  }
}

/**
 * Create test results directory structure
 */
async function createTestDirectories(): Promise<void> {
  const { mkdir } = await import('fs/promises');

  const directories = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-results/har',
    'playwright-report',
  ];

  for (const dir of directories) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        console.warn(`⚠ Failed to create directory ${dir}: ${error}`);
      }
    }
  }

  console.log('✓ Test directories created');
}

/**
 * Main global setup function
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n==========================================');
  console.log('   Playwright Test Suite - Global Setup');
  console.log('==========================================\n');

  // Generate and store run ID
  const runId = generateRunId();
  process.env.RUN_ID = runId;
  console.log(`✓ Run ID: ${runId}`);

  // Validate environment
  validateEnvironment();

  // Create test directories
  await createTestDirectories();

  // Ensure Allure directory exists
  await ensureAllureDirectory();

  // Preload configurations
  await preloadConfigurations();

  // Check Docker services (CI only)
  await checkDockerServices();

  // Log test configuration
  console.log('\nTest Configuration:');
  console.log(`  Projects: ${config.projects.length}`);
  console.log(`  Workers: ${config.workers || 1}`);
  console.log(`  Fully Parallel: ${config.fullyParallel ? 'Yes' : 'No'}`);
  // @ts-expect-error - retries property exists at runtime but not in FullConfig type
  console.log(`  Retries: ${config.retries || 0}\n`);

  console.log('==========================================');
  console.log('   Global Setup Complete - Starting Tests');
  console.log('==========================================\n');
}

export default globalSetup;
