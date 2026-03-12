import { test as baseTest, expect } from '@/fixtures/e2e-fixtures.js';
import * as Pages from '../pages/index.js';

// Define the pages fixture type
type XenditPages = {
  paymentLinkCheckout: Pages.PaymentLinkCheckoutPage;
  dashboard: Pages.DashboardPage;
  dashboardLogin: Pages.DashboardLoginPage;
};

// Define the full fixture type for the Xendit app
type XenditE2EFixtures = {
  pages: XenditPages;
};

// App-specific base URL (can be overridden by env vars)
const XENDIT_APP_URL = process.env.XENDIT_APP_URL || 'https://dashboard.xendit.co';

/**
 * Helper to instantiate all Xendit E2E Page Objects
 * Abstracted to support reuse across native Playwright and BDD frameworks.
 */
export function createXenditPages(page: any, allure: any, baseUrl: string): XenditPages {
  return {
    paymentLinkCheckout: new Pages.PaymentLinkCheckoutPage(page, allure, baseUrl),
    dashboard: new Pages.DashboardPage(page, allure, baseUrl),
    dashboardLogin: new Pages.DashboardLoginPage(page, allure, baseUrl),
  };
}

export const test = baseTest.extend<XenditE2EFixtures>({
  // Configure Allure metadata for this app
  allure: async ({ allure }, use) => {
    if (typeof allure.epic === 'function') {
      allure.epic('Xendit Dashboard');
      allure.feature('Core Flows');
    }
    await use(allure);
  },

  // Inject all page objects
  pages: async ({ page, allure }, use) => {
    const pages = createXenditPages(page, allure, XENDIT_APP_URL);
    await use(pages);
  },
});

export { expect };

export const xenditSmokeTest = test.extend({
  allure: async ({ allure }, use) => {
    if (typeof allure.epic === 'function') {
      allure.epic('Xendit Dashboard');
      allure.feature('Smoke Tests');
      allure.tag('smoke');
    }
    await use(allure);
  },
});

export const xenditAuthTest = test.extend({
  allure: async ({ allure }, use) => {
    if (typeof allure.epic === 'function') {
      allure.epic('Xendit Dashboard');
      allure.feature('Authentication');
      allure.tag('auth');
    }
    await use(allure);
  },
});
