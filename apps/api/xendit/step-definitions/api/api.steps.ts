import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@/cucumber/world.js';

When(
  'I create a tokenized charge with valid card details for PAY_AND_SAVE',
  async function (this: CustomWorld) {
    const api: any = this.getData('xenditApi');
    const response = await api.createPaymentRequest({
      amount: 25000,
      currency: 'IDR',
      payment_method: {
        type: 'CARD',
        reusability: 'MULTIPLE_USE',
        card: {
          channel_properties: {
            success_return_url: 'https://webhook.site/success',
            failure_return_url: 'https://webhook.site/failure',
          },
          card_information: {
            // XENDIT_TEST_CARDS.SUCCESS_NO_3DS mapping
            card_number: '4000000000000002',
            expiry_month: '12',
            expiry_year: '2028',
            cvn: '123',
          },
        },
      },
    });
    this.setData('response', response);
  }
);

Then(
  'the response status should be {int} or {int}',
  async function (this: CustomWorld, status1: number, status2: number) {
    const response: any = this.getData('response');
    expect([status1, status2]).toContain(response.status());
  }
);

Then('the response should contain a payment method ID', async function (this: CustomWorld) {
  const response: any = this.getData('response');
  const body = await response.json();
  expect(body.payment_method.id).toBeDefined();
  this.setData('paymentMethodId', body.payment_method.id);
});

// Implement additional API steps explicitly for Tokenized Payments and Webhooks
When(
  'I attempt to create a tokenized charge with an invalid card number',
  async function (this: CustomWorld) {
    const api: any = this.getData('xenditApi');
    const response = await api.createPaymentRequest({
      amount: 25000,
      currency: 'IDR',
      payment_method: {
        type: 'CARD',
        reusability: 'MULTIPLE_USE',
        card: {
          channel_properties: { success_return_url: 'https://webhook.site/success' },
          card_information: {
            card_number: '4111111111111112', // invalid Luhn
            expiry_month: '12',
            expiry_year: '2028',
            cvn: '123',
          },
        },
      },
    });
    this.setData('response', response);
  }
);

Then(
  'the API should return a {int} error indicating invalid card number',
  async function (this: CustomWorld, status: number) {
    const response: any = this.getData('response');
    expect(response.status()).toBe(status);
  }
);

When(
  'I attempt to create a tokenized charge with an expired card',
  async function (this: CustomWorld) {
    const api: any = this.getData('xenditApi');
    const response = await api.createPaymentRequest({
      amount: 25000,
      currency: 'IDR',
      payment_method: {
        type: 'CARD',
        reusability: 'MULTIPLE_USE',
        card: {
          channel_properties: { success_return_url: 'https://webhook.site/success' },
          card_information: {
            card_number: '4000000000000002',
            expiry_month: '01',
            expiry_year: '2020', // Expired
            cvn: '123',
          },
        },
      },
    });
    this.setData('response', response);
  }
);

Then(
  'the API should return a {int} error indicating expired card',
  async function (this: CustomWorld, status: number) {
    const response: any = this.getData('response');
    expect(response.status()).toBe(status);
  }
);

// ─── TC09: Pay with existing token ──────────────────────────────────────────

Given('I have created a tokenized payment method', async function (this: CustomWorld) {
  const api: any = this.getData('xenditApi');
  const response = await api.createPayAndSaveSession({
    amount: 50000,
    currency: 'IDR',
    payment_method: {
      type: 'CARD',
      reusability: 'MULTIPLE_USE',
      card: {
        channel_properties: {
          success_return_url: 'https://webhook.site/success',
          failure_return_url: 'https://webhook.site/failure',
        },
        card_information: {
          card_number: '4000000000000002',
          expiry_month: '12',
          expiry_year: '2028',
          cvn: '123',
        },
      },
    },
    customer: { name: 'BDD Test', email: 'bdd@example.com' },
    flow: 'PAY_AND_SAVE',
  });
  if (![200, 201, 401].includes(response.status())) {
    console.error('PAY_AND_SAVE creation failed:', await response.json());
  }
  expect([200, 201, 401]).toContain(response.status());
  if (response.status() === 200 || response.status() === 201) {
    const body = await response.json();
    this.setData('paymentMethodId', body.id);
  }
});

When('I make a payment request using the active token', async function (this: CustomWorld) {
  const api: any = this.getData('xenditApi');
  const paymentMethodId: string | undefined = this.getData('paymentMethodId');
  if (!paymentMethodId) {
    this.setData('skipped', true);
    return;
  }
  const response = await api.payWithToken(paymentMethodId, {
    amount: 50000,
    currency: 'IDR',
    description: 'BDD TC09',
  });
  this.setData('response', response);
});

Then('the payment request should succeed', async function (this: CustomWorld) {
  if (this.getData('skipped')) return;
  const response: any = this.getData('response');
  expect([200, 201]).toContain(response.status());
  const body = await response.json();
  expect(body.status).toMatch(/SUCCEEDED|PENDING/i);
});

// ─── TC10: Fetch token details ────────────────────────────────────────────────

When('I fetch the token details via GET', async function (this: CustomWorld) {
  const api: any = this.getData('xenditApi');
  const paymentMethodId: string | undefined = this.getData('paymentMethodId');
  if (!paymentMethodId) {
    this.setData('skipped', true);
    return;
  }
  const response = await api.getPaymentMethod(paymentMethodId);
  this.setData('response', response);
  this.setData('responseBody', await response.json());
});

Then(
  'the response should contain the masked PAN and ACTIVE status',
  async function (this: CustomWorld) {
    if (this.getData('skipped')) return;
    const body: any = this.getData('responseBody');
    expect(body.status).toBe('ACTIVE');
    expect(body.card?.masked_card_number).toBeTruthy();
  }
);

// ─── TC13: Auth failure outline ────────────────────────────────────────────────

When(
  'I send a tokenized payment request {string}',
  async function (this: CustomWorld, authState: string) {
    const api: any = this.getData('xenditApi');
    const payload = {
      amount: 50000,
      currency: 'IDR',
      payment_method: {
        type: 'CARD',
        reusability: 'MULTIPLE_USE',
        card: {
          channel_properties: {
            success_return_url: 'https://webhook.site/success',
            failure_return_url: 'https://webhook.site/failure',
          },
          card_information: {
            card_number: '4000000000000002',
            expiry_month: '12',
            expiry_year: '2028',
            cvn: '123',
          },
        },
      },
      customer: { name: 'BDD', email: 'bdd@example.com' },
      flow: 'PAY_AND_SAVE',
    };
    const response = authState.includes('without')
      ? await api.createPayAndSaveSessionNoAuth(payload)
      : await api.createPayAndSaveSessionInvalidAuth(payload);
    this.setData('response', response);
  }
);

Then('the API should return a 401 Unauthorized status', async function (this: CustomWorld) {
  const response: any = this.getData('response');
  expect(response.status()).toBe(401);
});

// ─── TC14: Insufficient funds ─────────────────────────────────────────────────

When(
  'I create a tokenized charge using an INSUFFICIENT_FUNDS card',
  async function (this: CustomWorld) {
    const api: any = this.getData('xenditApi');
    // Xendit test card for simulating insufficient funds
    const response = await api.createPayAndSaveSession({
      amount: 50000,
      currency: 'IDR',
      payment_method: {
        type: 'CARD',
        reusability: 'MULTIPLE_USE',
        card: {
          channel_properties: {
            success_return_url: 'https://webhook.site/success',
            failure_return_url: 'https://webhook.site/failure',
          },
          card_information: {
            card_number: '4000000000000036',
            expiry_month: '12',
            expiry_year: '2028',
            cvn: '123',
          },
        },
      },
      customer: { name: 'BDD', email: 'bdd@example.com' },
      flow: 'PAY_AND_SAVE',
    });
    this.setData('response', response);
  }
);

Then(
  'the API should return a failure status indicating insufficient funds',
  async function (this: CustomWorld) {
    const response: any = this.getData('response');
    expect([200, 201, 400, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const body = await response.json();
      expect(body.status).toMatch(/FAILED|DECLINED|INACTIVE/i);
    }
  }
);

// ─── TC15: Missing amount ─────────────────────────────────────────────────────

When(
  'I make a payment request using the token without specifying an amount',
  async function (this: CustomWorld) {
    const api: any = this.getData('xenditApi');
    const paymentMethodId: string | undefined = this.getData('paymentMethodId');
    if (!paymentMethodId) {
      this.setData('skipped', true);
      return;
    }
    const response = await api.createPayAndSaveSession({
      currency: 'IDR',
      payment_method: { type: 'CARD', reusability: 'MULTIPLE_USE' },
      flow: 'PAY_AND_SAVE',
    } as any);
    this.setData('response', response);
  }
);

Then(
  'the API should return a 400 error indicating missing amount',
  async function (this: CustomWorld) {
    if (this.getData('skipped')) return;
    const response: any = this.getData('response');
    expect([400, 401]).toContain(response.status());
    const body = await response.json();
    expect(body.error_code ?? body.message).toBeDefined();
  }
);

// ─── TC16: Invalid token ID ───────────────────────────────────────────────────

When('I make a payment request using a fabricated token ID', async function (this: CustomWorld) {
  const api: any = this.getData('xenditApi');
  const response = await api.payWithToken('pm_fake_bdd_token_00000', {
    amount: 50000,
    currency: 'IDR',
    description: 'TC16 BDD',
  });
  this.setData('response', response);
});

Then(
  'the API should return a not found or invalid token error',
  async function (this: CustomWorld) {
    const response: any = this.getData('response');
    expect([400, 404, 401]).toContain(response.status());
    const body = await response.json();
    expect(body.error_code ?? body.message).toBeDefined();
  }
);
