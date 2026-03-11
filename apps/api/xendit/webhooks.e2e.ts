import { xenditApiTest as test, expect } from '@xendit-api-fixtures';
import { generateTestPaymentData } from '@/utils/test-data.js';
import { waitForXenditWebhook } from '@/utils/webhook-helper.js';

/**
 * Webhook Tests — Xendit Invoice (Payment Link) Flow
 *
 * Prerequisites:
 *  1. WEBHOOK_SITE_TOKEN env var must be set (from https://webhook.site)
 *  2. The webhook.site URL must be registered in the Xendit Dashboard under:
 *     Settings → Developers → Webhooks → Invoice Paid
 *
 * Flow:
 *  1. Create an Invoice (Payment Link) via the Xendit API.
 *  2. Simulate a Virtual Account payment via the Xendit sandbox API.
 *  3. Poll webhook.site to capture the incoming webhook from Xendit.
 *  4. Assert the webhook payload matches the expected transaction data.
 */
test.describe('API Scenarios: Webhook Delivery', () => {
  const webhookSiteToken = process.env.WEBHOOK_SITE_TOKEN || '';

  test.beforeAll(() => {
    if (!webhookSiteToken) {
      throw new Error(
        'WEBHOOK_SITE_TOKEN is not set. ' +
          'Visit https://webhook.site, copy your token, and add it to .env as WEBHOOK_SITE_TOKEN.'
      );
    }
  });

  test('TC17_WH: Xendit sends a PAID webhook after a successful VA payment simulation', async ({
    clients,
    apiRequest,
    allure,
    step,
  }) => {
    const paymentData = generateTestPaymentData();

    // ── Step 1: Create Invoice ─────────────────────────────────────────────────
    const invoiceResponse = await step.step(
      `Create invoice with external_id: ${paymentData.external_id}`,
      async () => {
        const res = await clients.xendit.createPaymentLink({
          external_id: paymentData.external_id,
          amount: paymentData.amount,
          description: paymentData.description,
          payer_email: paymentData.payer_email,
        });

        expect(res.status(), 'Invoice creation should succeed with 200').toBe(200);
        return res;
      }
    );

    const invoice = await invoiceResponse.json();

    expect(invoice.id, 'Invoice should have an id').toBeTruthy();
    expect(invoice.status, 'Invoice should initially be PENDING').toBe('PENDING');

    // Pick the first available bank for VA payment simulation
    const bank = invoice.available_banks?.[0];
    expect(bank, 'Invoice must contain at least one Virtual Account bank option').toBeTruthy();

    // ── Step 2: Simulate VA Payment ────────────────────────────────────────────
    await step.step(
      `Simulate VA payment via ${bank.bank_code} account ${bank.bank_account_number}`,
      async () => {
        const simRes = await clients.xendit.simulateVAPayment(
          bank.bank_code,
          bank.bank_account_number,
          paymentData.amount
        );

        // Sandbox simulate endpoint returns 200 on success
        // 400 is acceptable if the account has already been paid (idempotency)
        expect(
          [200, 400],
          'Simulation should succeed or indicate the VA is already paid'
        ).toContain(simRes.status());
      }
    );

    // ── Step 3: Wait for Webhook ───────────────────────────────────────────────
    const webhookPayload = await step.step(
      `Poll webhook.site for PAID webhook with external_id: ${paymentData.external_id}`,
      async () => {
        return waitForXenditWebhook(apiRequest, webhookSiteToken, paymentData.external_id, 'PAID', allure);
      }
    );

    // ── Step 4: Assert Webhook Payload ─────────────────────────────────────────
    await step.step('Validate webhook payload fields', async () => {
      expect(webhookPayload.status, 'Webhook status should be PAID').toBe('PAID');
      expect(webhookPayload.external_id, 'external_id must match the created invoice').toBe(
        paymentData.external_id
      );
      expect(webhookPayload.amount, 'Webhook amount must match invoice amount').toBe(
        paymentData.amount
      );
      expect(webhookPayload.id, 'Webhook must contain a Xendit invoice id').toBeTruthy();
      expect(webhookPayload.paid_at, 'Webhook must include a paid_at timestamp').toBeTruthy();
    });
  });

  test('TC18_WH: Webhook is NOT fired for a PENDING (unpaid) invoice', async ({
    clients,
    apiRequest,
    allure,
    step,
  }) => {
    const paymentData = generateTestPaymentData();

    // Create the invoice but do NOT simulate payment
    await step.step(`Create invoice with external_id: ${paymentData.external_id}`, async () => {
      const res = await clients.xendit.createPaymentLink({
        external_id: paymentData.external_id,
        amount: paymentData.amount,
        description: paymentData.description,
        payer_email: paymentData.payer_email,
      });
      expect(res.status()).toBe(200);
    });

    // Attempt to find a webhook — expect a timeout error (no payment was triggered)
    await step.step(
      'Confirm no PAID webhook is received for the unpaid invoice (expect timeout)',
      async () => {
        await expect(
          waitForXenditWebhook(apiRequest, webhookSiteToken, paymentData.external_id, 'PAID', allure)
        ).rejects.toThrow(/never received/i);
      }
    );
  });
});
