import { Locator, Page } from '@playwright/test';
import { BasePage } from '@/pages/base.page.js';
import { TotpHelper } from '@/utils/totp.js';

export class DashboardLoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly totpInput: Locator;
  readonly submitTotpButton: Locator;
  readonly errorMessage: Locator;

  private totpHelper: TotpHelper;

  constructor(page: Page, allure: any, baseUrl: string) {
    super(page, allure, baseUrl);

    // Initial locators for Xendit Merchant Dashboard login based on typical Auth0/B2B portal setups.
    // NOTE: These may need adjustment depending on actual DOM structure.
    this.emailInput = this.page
      .getByRole('textbox', { name: /email/i })
      .or(this.page.locator('input[type="email"]'));
    this.passwordInput = this.page
      .getByRole('textbox', { name: /password/i })
      .or(this.page.locator('input[type="password"]'));
    this.loginButton = this.getByRole('button', { name: /log in/i, disabled: false });

    // 2FA Locators
    this.totpInput = this.page.locator(
      'input[name="totp"], input[autocomplete="one-time-code"], input[type="text"].auth-code-input'
    );
    this.submitTotpButton = this.getByRole('button', { name: /verify|submit|continue|confirm/i });

    // Error message locator
    this.errorMessage = this.page.locator('form div').filter({
      hasText: /invalid|incorrect|error|failed|wrong|does not match/i,
    });

    this.totpHelper = new TotpHelper();
  }

  async navigateToLogin() {
    await this.allure.step('Navigate to Xendit Merchant Dashboard Login', async () => {
      await this.gotoUrl('/login');
      await this.waitForLoadState('domcontentloaded');
    });
  }

  async enterCredentials(email?: string, password?: string) {
    const defaultEmail = process.env.XENDIT_USERNAME || '';
    const defaultPassword = process.env.XENDIT_PASSWORD || '';

    await this.allure.step('Enter login credentials', async () => {
      await this.fill(this.emailInput, email || defaultEmail);
      await this.fill(this.passwordInput, password || defaultPassword);
      await this.click(this.loginButton);
    });
  }

  async bypass2FA() {
    await this.allure.step('Bypass 2FA using TOTP generation', async () => {
      // Wait for the first 2FA input to appear
      await this.totpInput.first().waitFor({ state: 'visible', timeout: 15000 });

      // Generate the dynamic 6-digit code
      const totpCode = await this.totpHelper.generateCode();

      // Enter the code - Playwright fill on the first input usually distributes in modern React apps,
      // but if not, we sequentially fill each box. Let's try filling the first box or using keyboard types.
      await this.totpInput.first().focus();
      await this.page.keyboard.type(totpCode);

      // Submit (sometimes forms auto-submit when exactly 6 digits are typed)
      if (await this.submitTotpButton.isVisible()) {
        await this.click(this.submitTotpButton);
      }
    });
  }
}
