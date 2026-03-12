import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  ITestCaseHookParameter,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import { CustomWorld } from './world.js';

// Playwright UI interactions and Webhook polling can easily exceed the default 5s
setDefaultTimeout(60 * 1000);

// Clean up video directory before all tests
BeforeAll(async function () {
  console.log('🎭 Starting BDD test run...');
});

Before(async function (this: CustomWorld, { pickle }: ITestCaseHookParameter) {
  await this.init();
  console.log(`  → Running: ${pickle.name}`);
});

After(async function (this: CustomWorld, { result, pickle }: ITestCaseHookParameter) {
  // Check if attachments should be captured on passed tests (default: true)
  const attachOnPass = process.env.ATTACH_ON_PASS !== 'false'; // Default: true
  const shouldAttach = result?.status === Status.FAILED || (attachOnPass && result?.status === Status.PASSED);

  // Skip video/screenshot if this is an API test
  const isApiTest = pickle.uri.includes('/api/');

  // Attach screenshot and video for failed tests or when ATTACH_ON_PASS is enabled
  if (shouldAttach && !isApiTest) {
    try {
      // Attach screenshot
      const screenshotLabel = result?.status === Status.FAILED ? 'Failure Screenshot' : 'Test Screenshot';
      await this.attachScreenshot(screenshotLabel);

      // Close context first to finalize video, then attach video
      await this.closeContextForVideo();
    } catch (e) {
      console.log('  ⚠ Failed to capture attachments', e);
    }
  }

  // Log test result
  if (result?.status === Status.FAILED) {
    console.log(`  ✗ Failed: ${pickle.name}`);
  } else if (result?.status === Status.PASSED) {
    console.log(`  ✓ Passed: ${pickle.name}`);
  } else if (result?.status === Status.SKIPPED) {
    console.log(`  ⊘ Skipped: ${pickle.name}`);
  }

  await this.cleanup();
});

AfterAll(async function () {
  console.log('🎭 BDD test run completed.');
});
