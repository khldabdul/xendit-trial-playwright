import { Locator, Page } from '@playwright/test';
import { BasePage } from '@/pages/base.page.js';

export class DashboardPage extends BasePage {
  readonly createPaymentLinkButton: Locator;

  constructor(page: Page, allure: any, baseUrl: string) {
    super(page, allure, baseUrl);

    this.createPaymentLinkButton = this.page.getByText('Set up a payment link', { exact: false }).first();
  }

  async navigateToPaymentLinks() {
    await this.allure.step('Navigate to Payment Links module', async () => {
      // Depending on actual implementation:
      await this.gotoUrl('/payment-links');
      await this.waitForLoadState('domcontentloaded');
    });
  }
}
