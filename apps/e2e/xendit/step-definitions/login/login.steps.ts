import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@/cucumber/world.js';
import { createXenditPages } from '@xendit-fixtures';
import { mockAllure } from '@/cucumber/mock-allure.js';

function getPages(world: CustomWorld) {
  const baseUrl = process.env.XENDIT_APP_URL || 'https://dashboard.xendit.co';
  return createXenditPages(world.page, mockAllure, baseUrl);
}

Given('I navigate to the Xendit Merchant Dashboard login page', async function (this: CustomWorld) {
  const pages = getPages(this);
  await pages.dashboardLogin.navigateToLogin();
});

When('I enter my valid credentials', async function (this: CustomWorld) {
  const pages = getPages(this);
  await pages.dashboardLogin.enterCredentials();
});

When('I enter my 2FA code generated via TOTP', async function (this: CustomWorld) {
  const pages = getPages(this);
  await pages.dashboardLogin.bypass2FA();
});

Then('I should be successfully logged in', async function (this: CustomWorld) {
  // Validate successful login indicator via URL redirect
  await this.page.waitForLoadState('domcontentloaded');
  await expect(this.page).toHaveURL(/.*dashboard\.xendit\.co.*/, { timeout: 30000 });
});

Then('I should see the Dashboard page', async function (this: CustomWorld) {
  const pages = getPages(this);
  // Check the Create Payment Link button is visible on the actual dashboard
  await expect(pages.dashboard.createPaymentLinkButton).toBeVisible();
});

// TC02_AUTH: Failed login with invalid credentials
When('I enter invalid credentials', async function (this: CustomWorld) {
  const pages = getPages(this);
  await pages.dashboardLogin.enterCredentials('invalid@email.com', 'wrongpassword');
});

Then('I should see an error message indicating invalid login', async function (this: CustomWorld) {
  const pages = getPages(this);
  // Wait for error message to appear
  await expect(pages.dashboardLogin.errorMessage.nth(1)).toBeVisible({ timeout: 10000 });
});

// TC03_AUTH: Failed login with invalid TOTP code
When('I enter an invalid 2FA code', async function (this: CustomWorld) {
  const pages = getPages(this);
  // Enter invalid TOTP code manually
  await pages.dashboardLogin.totpInput.first().focus();
  await this.page.keyboard.type('000000');

  // Try to submit if button is visible
  if (await pages.dashboardLogin.submitTotpButton.isVisible()) {
    await pages.dashboardLogin.submitTotpButton.click();
  }
});

Then('I should see an error message indicating invalid verification code', async function (this: CustomWorld) {
  const pages = getPages(this);
  // Wait for error message to appear
  await expect(pages.dashboardLogin.errorMessage).toBeVisible({ timeout: 10000 });
});
