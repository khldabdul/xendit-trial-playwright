/**
 * Global teardown for Playwright tests
 *
 * This file runs once after all tests and can be used for:
 * - Cleanup of test data
 * - Stopping services
 * - Generating reports
 * - Uploading artifacts
 */

import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Generate Allure report if tests ran
 */
async function generateAllureReport(): Promise<void> {
  const allureResultsDir = process.env.ALLURE_RESULTS_DIR || 'allure-results';

  try {
    // Check if Allure results exist
    const { access } = await import('fs/promises');
    const { constants } = await import('fs');

    try {
      await access(allureResultsDir, constants.F_OK);
    } catch {
      console.log('⚠ No Allure results found, skipping report generation');
      return;
    }

    // Generate Allure report
    console.log('\nGenerating Allure report...');

    // Only generate on CI or if explicitly requested
    if (process.env.CI === 'true' || process.env.GENERATE_ALLURE_REPORT === 'true') {
      try {
        await execAsync('npx allure generate allure-results -o allure-report --clean');
        console.log('✓ Allure report generated: allure-report/index.html');
      } catch (error) {
        console.warn(`⚠ Failed to generate Allure report: ${error}`);
      }
    } else {
      console.log('  (Skipped - Set GENERATE_ALLURE_REPORT=true to generate)');
    }
  } catch (error) {
    console.error(`✗ Allure report generation failed: ${error}`);
  }
}

/**
 * Generate test summary
 */
async function generateTestSummary(_config: FullConfig): Promise<void> {
  try {
    // Read test results if available
    const { readFile } = await import('fs/promises');
    const resultsPath = 'playwright-report/results.json';

    try {
      const results = JSON.parse(await readFile(resultsPath, 'utf-8'));

      console.log('\n==========================================');
      console.log('           Test Execution Summary');
      console.log('==========================================');

      const stats = results.stats || {};

      console.log(`  Total: ${stats.expected || 0}`);
      console.log(`  Passed: ${stats.expected ? stats.expected - stats.failed : 'N/A'}`);
      console.log(`  Failed: ${stats.failed || 0}`);
      console.log(`  Skipped: ${stats.skipped || 0}`);
      console.log(`  Flaky: ${stats.flaky || 0}`);
      console.log(
        `  Duration: ${stats.duration ? `${(stats.duration / 1000).toFixed(2)}s` : 'N/A'}`
      );

      console.log('==========================================\n');
    } catch {
      console.log('\n⚠ Test results not available for summary');
    }
  } catch (error) {
    console.error(`✗ Failed to generate test summary: ${error}`);
  }
}

/**
 * Cleanup old test artifacts
 */
async function cleanupOldArtifacts(): Promise<void> {
  const maxAgeDays = Number.parseInt(process.env.MAX_ARTIFACT_AGE_DAYS || '7', 10);

  if (maxAgeDays <= 0) {
    return; // Don't cleanup
  }

  try {
    console.log(`\nCleaning up artifacts older than ${maxAgeDays} days...`);

    // This is a placeholder - actual implementation would depend on your needs
    // You might use a library like 'del' or implement custom logic
    console.log('  (Cleanup not implemented - set MAX_ARTIFACT_AGE_DAYS=0 to disable message)');
  } catch (error) {
    console.warn(`⚠ Artifact cleanup failed: ${error}`);
  }
}

/**
 * Upload artifacts to external storage (if configured)
 */
async function uploadArtifacts(): Promise<void> {
  const uploadUrl = process.env.ARTIFACT_UPLOAD_URL;

  if (!uploadUrl) {
    return; // No upload configured
  }

  try {
    console.log('\nUploading artifacts...');

    // This is a placeholder - actual implementation depends on your storage solution
    // Examples: AWS S3, Azure Blob Storage, Google Cloud Storage
    console.log(`  (Upload to ${uploadUrl} not implemented)`);

    // Example AWS S3 upload with aws-sdk:
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    // const s3 = new S3Client({ region: process.env.AWS_REGION });
    // await s3.send(new PutObjectCommand({ ... }));
  } catch (error) {
    console.error(`✗ Artifact upload failed: ${error}`);
  }
}

/**
 * Send test notifications (if configured)
 */
async function sendNotifications(): Promise<void> {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

  if (!webhookUrl) {
    return; // No notifications configured
  }

  try {
    console.log('\nSending test notifications...');

    // This is a placeholder - actual implementation depends on your notification service
    // Examples: Slack, Microsoft Teams, Discord, Email
    console.log(`  (Notification to ${webhookUrl} not implemented)`);

    // Example Slack notification:
    // const response = await fetch(webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     text: 'Test execution complete',
    //     attachments: [{ text: 'View results: https://...' }],
    //   }),
    // });
  } catch (error) {
    console.error(`✗ Notification sending failed: ${error}`);
  }
}

/**
 * Calculate test coverage statistics
 */
async function calculateCoverage(): Promise<void> {
  if (process.env.ENABLE_COVERAGE !== 'true') {
    return;
  }

  try {
    console.log('\nCalculating code coverage...');

    // This is a placeholder - use a coverage library like 'nyc' or 'c8'
    console.log('  (Coverage calculation not implemented)');
    console.log('  Install and configure nyc or c8 to enable coverage');

    // Example with nyc:
    // await execAsync('npx nyc report --reporter=text --reporter=lcov');
  } catch (error) {
    console.error(`✗ Coverage calculation failed: ${error}`);
  }
}

/**
 * Main global teardown function
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('\n==========================================');
  console.log('  Playwright Test Suite - Global Teardown');
  console.log('==========================================\n');

  // Generate Allure report
  await generateAllureReport();

  // Generate test summary
  await generateTestSummary(config);

  // Calculate coverage if enabled
  await calculateCoverage();

  // Cleanup old artifacts
  await cleanupOldArtifacts();

  // Upload artifacts if configured
  await uploadArtifacts();

  // Send notifications if configured
  await sendNotifications();

  console.log('\n==========================================');
  console.log('       Global Teardown Complete');
  console.log('==========================================\n');

  // Display run ID for reference
  console.log(`Run ID: ${process.env.RUN_ID || 'unknown'}`);
  console.log(`Environment: ${process.env.TEST_ENV || 'unknown'}\n`);
}

export default globalTeardown;
