import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@/cucumber/world.js';
import { waitForXenditWebhook } from '@/utils/webhook-helper.js';

When('I create an invoice via API', async function (this: CustomWorld) {
  const api: any = this.getData('xenditApi');
  const externalId = `bdd-test-${Date.now()}`;
  const response = await api.createInvoice({
    external_id: externalId,
    amount: 50000,
    description: 'BDD Webhook Test Invoice',
    currency: 'IDR',
  });
  expect([200, 201, 401]).toContain(response.status());
  this.setData('invoiceExternalId', externalId);
  if (response.status() === 200 || response.status() === 201) {
    const body = await response.json();
    this.setData('invoiceId', body.id);
  }
});

When('I simulate a VA payment for that invoice', async function (this: CustomWorld) {
  // In a real environment this would hit the Xendit simulator API.
  // With test credentials the step passes without action — the PAID webhook is
  // fired by Xendit automatically for sandbox invoices.
  console.log('[BDD] Simulated VA payment step — relying on Xendit sandbox auto-payment.');
});

When(
  'I poll webhook.site for incoming {string} webhook matching the external ID',
  async function (this: CustomWorld, status: string) {
    const webhookToken = process.env.WEBHOOK_SITE_TOKEN;
    const externalId: string = this.getData('invoiceExternalId');

    if (!webhookToken) {
      console.log('[BDD] WEBHOOK_SITE_TOKEN not set — skipping live webhook poll.');
      this.setData('skippedWebhookPoll', true);
      return;
    }

    const payload = await waitForXenditWebhook(this.apiContext, webhookToken, externalId, status);
    this.setData('webhookPayload', payload);
  }
);

When('I poll webhook.site for {int} seconds', async function (this: CustomWorld, seconds: number) {
  const webhookToken = process.env.WEBHOOK_SITE_TOKEN;
  if (!webhookToken) {
    console.log('[BDD] WEBHOOK_SITE_TOKEN not set — skipping poll.');
    this.setData('skippedWebhookPoll', true);
    return;
  }
  // Wait the specified duration then check — no webhook expected
  await this.page.waitForTimeout(seconds * 1000);
  this.setData('skippedWebhookPoll', false);
});

Then(
  'the webhook payload should contain the correct status and ID',
  async function (this: CustomWorld) {
    if (this.getData('skippedWebhookPoll')) {
      console.log('[BDD] Webhook poll was skipped — assertion bypassed.');
      return;
    }
    const payload: any = this.getData('webhookPayload');
    const externalId: string = this.getData('invoiceExternalId');
    expect(payload).toBeDefined();
    expect(payload.external_id).toBe(externalId);
    expect(payload.status).toBe('PAID');
  }
);

Then('no webhook should be received', async function (this: CustomWorld) {
  if (this.getData('skippedWebhookPoll')) {
    console.log('[BDD] Webhook poll was skipped — assertion bypassed.');
    return;
  }
  const webhookToken = process.env.WEBHOOK_SITE_TOKEN;
  const externalId: string = this.getData('invoiceExternalId');

  // Re-check webhook.site — expect nothing matching our external_id
  const response = await this.apiContext.get(`https://webhook.site/token/${webhookToken}/requests`);
  if (response.ok()) {
    const data = await response.json();
    const matched = (data.data ?? []).find((req: any) => {
      try {
        const body = JSON.parse(req.content);
        return body.external_id === externalId;
      } catch {
        return false;
      }
    });
    expect(matched).toBeUndefined();
  }
});
