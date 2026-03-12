import { Given } from '@cucumber/cucumber';
import { CustomWorld } from '@/cucumber/world.js';
import { createXenditApiClients } from '@xendit-api-fixtures';
import { createCucumberReporter } from '@/cucumber/mock-allure.js';

/**
 * Shared step definitions used across both E2E and API tests.
 * This file is imported by all cucumber profiles via src/cucumber globs.
 */

Given('I have a Xendit API client', async function (this: CustomWorld) {
  const reporter = createCucumberReporter(this);
  const clients = await createXenditApiClients(this.apiContext, reporter as any);
  this.setData('xenditApi', clients.xendit);
});
