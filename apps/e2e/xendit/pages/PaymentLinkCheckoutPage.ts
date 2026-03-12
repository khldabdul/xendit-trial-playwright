import { expect, Page } from '@playwright/test';
import { BasePage } from '@/pages/base.page.js';

export interface CardDetails {
  cardNumber: string;
  expiry: string; // MM/YY
  cvn: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
}

export class PaymentLinkCheckoutPage extends BasePage {
  constructor(page: Page, allure: any, baseUrl: string) {
    super(page, allure, baseUrl);
  }

  // ─── Accordion toggle ────────────────────────────────────────────────────────

  /**
   * Expand the Credit / Debit Card accordion if it is not already open.
   * Xendit checkout renders payment methods as collapsed accordion cards;
   * the card form fields are hidden until this button is clicked.
   */
  async expandCreditCardSection(): Promise<void> {
    await this.allure.step('Expand Credit / Debit Card payment section', async () => {
      // The accordion button carries a data-testid, but it might change, so we use fallbacks
      const cardAccordion = this.page.getByTestId('payment-channel-list-credit-card')
        .or(this.page.getByRole('button', { name: /credit.*card/i }))
        .or(this.page.getByText(/credit\/debit card/i))
        .first();
      await cardAccordion.waitFor({ state: 'visible', timeout: 15_000 });

      // Click to expand (we try to click even if aria-expanded isn't strictly 'false' to be safe)
      const isExpanded = await cardAccordion.getAttribute('aria-expanded');
      if (isExpanded !== 'true') {
        await cardAccordion.click();
      }

      // Wait for the card form region to appear
      await this.page
        .getByRole('region', { name: 'Credit / Debit Card' })
        .waitFor({ state: 'visible', timeout: 10_000 });
    });
  }

  // ─── Card field locators (resolved lazily after section is expanded) ─────────

  private get cardNumberInput() {
    return this.page.getByRole('textbox', { name: /card number/i });
  }

  private get expiryInput() {
    return this.page.getByRole('textbox', { name: /card expiry/i });
  }

  private get cvnInput() {
    return this.page.getByRole('textbox', { name: /cvn/i });
  }

  private get firstNameInput() {
    return this.page.getByRole('textbox', { name: /^john$/i });
  }

  private get lastNameInput() {
    return this.page.getByRole('textbox', { name: /^doe$/i });
  }

  private get emailInput() {
    return this.page.getByRole('textbox', { name: /payer@xendit.co/i });
  }

  private get mobileInput() {
    return this.page.getByRole('textbox', { name: /enter mobile number/i });
  }

  private get payButton() {
    return this.page.getByRole('button', { name: /pay now/i });
  }

  private get successMessage() {
    return this.page
      .locator('text=/Payment Successful/i')
      .or(this.page.getByText('Thank you for your payment', { exact: false }));
  }

  // ─── Public actions ───────────────────────────────────────────────────────────

  /**
   * Fill all credit card details (expands the section first).
   *
   * @param card - Card details. firstName / lastName / email / mobile are optional
   *               but should be provided if the checkout form requires them.
   */
  async fillCreditCardDetails(card: CardDetails): Promise<void>;
  /** @deprecated Pass a CardDetails object instead of positional strings. */
  async fillCreditCardDetails(cardNumber: string, expiry: string, cvn: string): Promise<void>;
  async fillCreditCardDetails(
    cardOrNumber: CardDetails | string,
    expiry?: string,
    cvn?: string
  ): Promise<void> {
    // Normalize overload shapes
    const card: CardDetails =
      typeof cardOrNumber === 'string'
        ? { cardNumber: cardOrNumber, expiry: expiry!, cvn: cvn! }
        : cardOrNumber;

    await this.allure.step(`Fill credit card: ${card.cardNumber}`, async () => {
      // Step 1: Make sure the card section is expanded
      await this.expandCreditCardSection();

      // Step 2: Fill the card fields
      await this.fill(this.cardNumberInput, card.cardNumber);
      await this.fill(this.expiryInput, card.expiry);
      await this.fill(this.cvnInput, card.cvn);

      // Step 3: Fill cardholder info if provided
      if (card.firstName) await this.fill(this.firstNameInput, card.firstName);
      if (card.lastName) await this.fill(this.lastNameInput, card.lastName);
      if (card.email) await this.fill(this.emailInput, card.email);
      if (card.mobile) await this.fill(this.mobileInput, card.mobile);
    });
  }

  async submitPayment(): Promise<void> {
    await this.allure.step('Click Pay Now', async () => {
      await this.payButton.waitFor({ state: 'visible', timeout: 10_000 });
      await this.click(this.payButton);
    });

    // After clicking Pay Now, Xendit may trigger 3DS authentication via an iframe.
    // We handle it automatically here so callers don't need to know about it.
    await this.handle3DSAuthentication();
  }

  /**
   * Handle 3DS / OTP iframe authentication if it appears after payment submission.
   *
   * In Xendit staging (test mode) the OTP is always `1234` and is conveniently
   * printed in the iframe message text, e.g. "(OTP: 1234)".
   * We parse the OTP from the text as a safety measure in case it changes.
   */
  async handle3DSAuthentication(): Promise<void> {
    await this.allure.step('Handle 3DS OTP authentication (if presented)', async () => {
      // After payment submission Xendit redirects the 3DS flow through multiple iframes:
      //   page → redirect.xendit.co (outer) → 0merchantacsstag.cardinalcommerce.com (OTP form)
      // We grab the OTP frame directly by URL pattern from page.frames().
      // This is more reliable than frameLocator chaining because frame indices can shift.

      // Wait up to 10 s for the 3DS frame to appear
      const deadline = Date.now() + 10_000;
      let otpFrame: import('@playwright/test').Frame | undefined;

      while (Date.now() < deadline) {
        otpFrame = this.page
          .frames()
          .find((f) => f.url().includes('merchantacsstag.cardinalcommerce.com'));
        if (otpFrame) break;
        await this.page.waitForTimeout(300);
      }

      if (!otpFrame) {
        // 3DS was not triggered — payment succeeded without OTP (valid for some cards)
        return;
      }

      // From here on, any failure is a real automation bug and should propagate.
      const otpInput = otpFrame.getByRole('textbox', { name: /enter code here/i });
      await otpInput.waitFor({ state: 'visible', timeout: 5_000 });

      // Extract OTP from the test-mode message text e.g. "(OTP: 1234)"
      const messageEl = otpFrame.locator('p').filter({ hasText: /OTP/i });
      const messageText = await messageEl.textContent({ timeout: 3_000 }).catch(() => '');
      const otpMatch = messageText?.match(/OTP:\s*(\d+)/i);
      const otp = otpMatch?.[1] ?? '1234'; // staging OTP is always 1234

      await otpInput.fill(otp);
      await otpFrame.getByRole('button', { name: /submit/i }).click();
    });
  }

  async verifySuccess(): Promise<void> {
    await this.allure.step('Verify payment success message', async () => {
      // Xendit checkout shows a "Thank You!" heading on the success page followed by
      // "Your order #<id> has been paid for successfully".
      const thankYouHeading = this.page.getByRole('heading', { name: /thank you/i });
      const paidSuccessfully = this.page.getByText(/has been paid for successfully/i);

      await expect(thankYouHeading.or(paidSuccessfully).first()).toBeVisible({ timeout: 30_000 });
    });
  }

  /**
   * Verifies that a payment failure message is displayed.
   * Used in TC02_UI (decline flow) and similar negative scenarios.
   */
  async verifyFailure(): Promise<void> {
    await this.allure.step('Verify payment failure message', async () => {
      const failureHeading = this.page.getByRole('heading', {
        name: /payment failed|declined|unsuccessful/i,
      });
      const failureText = this.page
        .getByText(/payment was declined/i)
        .or(this.page.getByText(/transaction failed/i))
        .or(this.page.getByText(/could not process/i));

      await expect(failureHeading.or(failureText).first()).toBeVisible({ timeout: 30_000 });
    });
  }

  /**
   * Verifies that the checkout page shows an expired or inactive link state.
   * Used in TC07_UI.
   */
  async verifyExpired(): Promise<void> {
    await this.allure.step('Verify expired / inactive payment link state', async () => {
      // Xendit renders one of these states when a link has expired
      const expiredText = this.page
        .getByText(/expired/i)
        .or(this.page.getByText(/link no longer active/i))
        .or(this.page.getByText(/invalid/i))
        .or(this.page.getByText(/not found/i));

      await expect(expiredText.first()).toBeVisible({ timeout: 15_000 });
    });
  }

  /**
   * Verifies that item details are displayed correctly on the checkout page.
   * Used in TC02_UI to confirm itemized breakdown matches what was set when creating the link.
   *
   * @param itemName - The name of the item to look for on the checkout page.
   */
  async verifyItemDetails(itemName: string): Promise<void> {
    await this.allure.step(`Verify item "${itemName}" is visible on checkout`, async () => {
      const itemText = this.page.getByText(itemName, { exact: false });
      await expect(itemText.first()).toBeVisible({ timeout: 15_000 });
    });
  }

  /**
   * Fills a custom amount on an open-amount (donation) checkout page.
   * Used in TC03_UI where the payer specifies the amount themselves.
   *
   * @param amount - The numeric amount to enter.
   */
  async fillCustomAmount(amount: number): Promise<void> {
    await this.allure.step(`Enter custom amount: ${amount}`, async () => {
      // Open-amount checkouts render a text input for the payer to specify the amount
      const amountInput = this.page
        .getByRole('textbox', { name: /amount/i })
        .or(this.page.locator('input[placeholder*="amount"]'))
        .first();

      await amountInput.waitFor({ state: 'visible', timeout: 10_000 });
      await amountInput.fill(String(amount));
    });
  }
}
