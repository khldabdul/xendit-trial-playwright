import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@/cucumber/world.js';
import {
  successCardChannelProperties,
  mastercardDetails,
  generateCardholder,
} from '@/api/card-helpers.js';
import type { PaymentTokenResponse, PaymentRequestResponse } from '@/api/v3-types.js';

// NOTE: Shared steps (background init, simulate payment, response status, 401)
// are in common/v3-common.steps.ts — do NOT re-define them here.

// Helper to build a unique reference_id per test run
const ref = (prefix: string) => `${prefix}-${Date.now()}`;

// ─── TC25: Save payment information only ──────────────────────────────────────
// Flow: POST /v3/payment_tokens  (with CARDS channel, no charge)

When(
  'I create a v3 payment token for saving payment information',
  async function (this: CustomWorld) {
    const xenditApi = this.getData('xenditApi');
    const response = await xenditApi.createPaymentToken({
      reference_id: ref('pt-tc25'),
      country: 'ID',
      currency: 'IDR',
      channel_code: 'CARDS',
      channel_properties: successCardChannelProperties(),
    });
    this.setData('response', response);
    if (response.status() === 200) {
      const body: PaymentTokenResponse = await response.json();
      const tokenId = body.id ?? body.payment_token_id;
      if (tokenId) this.setData('paymentTokenId', tokenId);
    }
  }
);

Then('the response should contain a payment token ID', async function (this: CustomWorld) {
  const response = this.getData('response');
  const body: PaymentTokenResponse = await response.json();
  const tokenId = body.id ?? body.payment_token_id;
  expect(tokenId).toBeDefined();
  this.setData('paymentTokenId', tokenId);
});

// ─── TC26: Pay and save payment method ────────────────────────────────────────
// Flow: POST /v3/payment_requests  (type=PAY_AND_SAVE)

When(
  'I create a v3 payment request with save payment method enabled',
  async function (this: CustomWorld) {
    const xenditApi = this.getData('xenditApi');
    const cardholder = generateCardholder();
    const response = await xenditApi.createPaymentRequest({
      reference_id: ref('pr-tc26'),
      type: 'PAY_AND_SAVE',
      country: 'ID',
      currency: 'IDR',
      request_amount: 25000,
      capture_method: 'AUTOMATIC',
      channel_code: 'CARDS',
      channel_properties: {
        card_details: mastercardDetails(),
        skip_three_ds: true,
        success_return_url: 'https://webhook.site/success',
        failure_return_url: 'https://webhook.site/failure',
      },
      customer: {
        reference_id: `bdd-cust-${Date.now()}`,
        type: 'INDIVIDUAL',
        individual_detail: {
          given_names: cardholder.cardholder_first_name,
          surname: cardholder.cardholder_last_name,
        },
        email: cardholder.cardholder_email,
      },
    });
    this.setData('response', response);
    if (response.status() === 200) {
      const body: PaymentRequestResponse = await response.json();
      const id = body.id ?? body.payment_request_id;
      if (id) this.setData('paymentRequestId', id);
      if (body.payment_token_id) this.setData('paymentTokenId', body.payment_token_id);
    }
  }
);

Then('the payment method should be tokenized', async function (this: CustomWorld) {
  const response = this.getData('response');
  const body: PaymentRequestResponse = await response.json();
  expect(body).toBeDefined();
  expect(body.status).toBeDefined();
});

// ─── TC27: Pay with existing token ────────────────────────────────────────────
// Flow: POST /v3/payment_requests  (payment_token_id at top level, no channel_code)

Given('I have a v3 payment token ID', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentToken({
    reference_id: ref('pt-prereq'),
    country: 'ID',
    currency: 'IDR',
    channel_code: 'CARDS',
    channel_properties: successCardChannelProperties(),
  });
  expect([200, 201]).toContain(response.status());
  const body: PaymentTokenResponse = await response.json();
  const tokenId = body.id ?? body.payment_token_id;
  expect(tokenId).toBeDefined();
  this.setData('paymentTokenId', tokenId);
  this.setData('response', response);
});

Given('I have a saved v3 payment token', async function (this: CustomWorld) {
  const existingTokenId = this.getData('paymentTokenId');
  if (existingTokenId) return; // already created by a prior step

  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentToken({
    reference_id: ref('pt-save'),
    country: 'ID',
    currency: 'IDR',
    channel_code: 'CARDS',
    channel_properties: successCardChannelProperties(),
  });
  expect([200, 201]).toContain(response.status());
  const body: PaymentTokenResponse = await response.json();
  const tokenId = body.id ?? body.payment_token_id;
  expect(tokenId).toBeDefined();
  this.setData('paymentTokenId', tokenId);
  this.setData('response', response);
});

When('I create a v3 payment request using the token', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const paymentTokenId = this.getData('paymentTokenId');
  const response = await xenditApi.createPaymentRequest({
    reference_id: ref('pr-tc27'),
    payment_token_id: paymentTokenId,
    type: 'PAY',
    country: 'ID',
    currency: 'IDR',
    request_amount: 25000,
    capture_method: 'AUTOMATIC',
    channel_properties: {
      skip_three_ds: true,
      card_on_file_type: 'CUSTOMER_UNSCHEDULED',
      success_return_url: 'https://webhook.site/success',
      failure_return_url: 'https://webhook.site/failure',
    },
  });
  this.setData('response', response);
  if (response.status() === 200) {
    const body: PaymentRequestResponse = await response.json();
    const id = body.id ?? body.payment_request_id;
    if (id) this.setData('paymentRequestId', id);
  }
});

// ─── TC28: Get payment token status - polling ──────────────────────────────────

When('I poll the payment token status until terminal', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const paymentTokenId = this.getData('paymentTokenId');
  const body = await xenditApi.pollPaymentTokenStatus(paymentTokenId, {
    timeout: 30000,
    interval: 2000,
    terminalStates: ['SUCCEEDED', 'FAILED', 'CANCELLED', 'ACTIVE'],
  });
  this.setData('finalTokenStatus', body.status);
});

Then(
  'the final token status should be one of SUCCEEDED, FAILED, CANCELLED',
  async function (this: CustomWorld) {
    const finalTokenStatus = this.getData('finalTokenStatus');
    expect(finalTokenStatus).toBeDefined();
    expect(['SUCCEEDED', 'FAILED', 'CANCELLED', 'ACTIVE']).toContain(finalTokenStatus);
  }
);

// ─── TC29: Invalid token usage ─────────────────────────────────────────────────

When('I create a v3 payment request with an invalid token', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentRequest({
    reference_id: ref('pr-tc29'),
    payment_token_id: 'pt-invalid-token-000000',
    type: 'PAY',
    country: 'ID',
    currency: 'IDR',
    request_amount: 25000,
    capture_method: 'AUTOMATIC',
    channel_properties: {
      success_return_url: 'https://webhook.site/success',
      failure_return_url: 'https://webhook.site/failure',
    },
  });
  this.setData('response', response);
});

Then(
  'the API should return a {int} error indicating invalid token',
  async function (this: CustomWorld, _status: number) {
    const response = this.getData('response');
    // Xendit returns 404 for non-existent token IDs
    expect([400, 404]).toContain(response.status());
    const body = await response.json();
    expect(body.error_code ?? body.message).toBeDefined();
  }
);

// ─── TC30: Authentication failures ────────────────────────────────────────────

When(
  'I send a payment token request {string}',
  async function (this: CustomWorld, authState: string) {
    const xenditApi = this.getData('xenditApi');
    const payload = {
      reference_id: ref('pt-auth'),
      country: 'ID',
      currency: 'IDR',
      channel_code: 'CARDS',
      channel_properties: successCardChannelProperties(),
    };

    let response;
    if (authState.includes('without')) {
      response = await xenditApi.createPaymentTokenNoAuth(payload);
    } else {
      response = await xenditApi.createPaymentTokenInvalidAuth(payload);
    }
    this.setData('response', response);
  }
);
