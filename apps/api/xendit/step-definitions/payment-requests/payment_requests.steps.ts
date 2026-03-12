import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@/cucumber/world.js';
import {
  qrisChannelProperties,
  invalidCardDetails,
  successCardChannelProperties,
} from '@/api/card-helpers.js';
import { V3_ERROR_CODES } from '@/api/v3-types.js';
import type { PaymentRequestResponse } from '@/api/v3-types.js';

const ref = (prefix: string) => `${prefix}-${Date.now()}`;

const BASE_QRIS_PAYLOAD = {
  country: 'ID',
  currency: 'IDR',
  request_amount: 25000,
  capture_method: 'AUTOMATIC' as const,
  channel_code: 'QRIS',
};

const BASE_CARDS_PAYLOAD = {
  country: 'ID',
  currency: 'IDR',
  request_amount: 25000,
  capture_method: 'AUTOMATIC' as const,
  channel_code: 'CARDS',
};

// ─── Prerequisites ────────────────────────────────────────────────────────────

Given('I have a v3 payment request ID for CARDS', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentRequest({
    ...BASE_CARDS_PAYLOAD,
    reference_id: ref('pr-pre-cards'),
    type: 'PAY',
    channel_properties: successCardChannelProperties(),
  });
  // Note: Will return 403 due to sandbox limits, which intentionally fails the tests.
  expect([200, 201]).toContain(response.status());
  const body: PaymentRequestResponse = await response.json();
  const id = body.id ?? body.payment_request_id;
  this.setData('paymentRequestId', id);
});

Given('I have a v3 payment request ID via QRIS', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentRequest({
    ...BASE_QRIS_PAYLOAD,
    reference_id: ref('pr-pre-qris'),
    type: 'PAY',
    channel_properties: qrisChannelProperties(),
  });
  expect([200, 201]).toContain(response.status());
  const body: PaymentRequestResponse = await response.json();
  const id = body.id ?? body.payment_request_id;
  expect(id).toBeDefined();
  this.setData('paymentRequestId', id);
  this.setData('response', response);
});

// ─── Create PR ────────────────────────────────────────────────────────────────

When('I create a v3 payment request for the CARDS channel', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentRequest({
    ...BASE_CARDS_PAYLOAD,
    reference_id: ref('pr-tc17-cards'),
    type: 'PAY',
    channel_properties: successCardChannelProperties(),
  });
  this.setData('response', response);
});

When('I create a v3 payment request with an invalid card number', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentRequest({
    ...BASE_CARDS_PAYLOAD,
    reference_id: ref('pr-tc18-cards'),
    type: 'PAY',
    channel_properties: {
      ...successCardChannelProperties(),
      card_details: invalidCardDetails(),
    },
  });
  this.setData('response', response);
});

When('I create a v3 payment request via QRIS', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const response = await xenditApi.createPaymentRequest({
    ...BASE_QRIS_PAYLOAD,
    reference_id: ref('pr-tc17-qris'),
    type: 'PAY',
    channel_properties: qrisChannelProperties(),
  });
  this.setData('response', response);
  if (response.status() === 200 || response.status() === 201) {
    const body: PaymentRequestResponse = await response.json();
    this.setData('paymentRequestId', body.id ?? body.payment_request_id);
  }
});

// ─── Status / Errors ──────────────────────────────────────────────────────────

Then('the API should return a {int} error indicating invalid card number', async function (this: CustomWorld, status: number) {
  const response = this.getData('response');
  expect(response.status()).toBe(status);
  const body = await response.json();
  expect(body.error_code).toContain(V3_ERROR_CODES.INVALID_CARD_NUMBER);
});

Then('the API should return a {int} error indicating payment request already succeeded', async function (this: CustomWorld, status: number) {
  const response = this.getData('response');
  expect(response.status()).toBe(status);
  const body = await response.json();
  // We use .toContain to tolerate potential changes in exact error format, but realistically checking status is best.
  expect(body.error_code).toContain(V3_ERROR_CODES.PAYMENT_REQUEST_ALREADY_SUCCEEDED);
});

// ─── Polling / Cancel (Generic IDs) ───────────────────────────────────────────

When('I poll the payment request status until terminal', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const paymentRequestId = this.getData('paymentRequestId');
  const body = await xenditApi.pollPaymentRequestStatus(paymentRequestId, {
    timeout: 30000,
    interval: 2000,
    terminalStates: ['REQUIRES_ACTION', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'CANCELED'],
  });
  expect(['REQUIRES_ACTION', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'CANCELED']).toContain(body.status);
  this.setData('finalStatus', body.status);
});

Then('the final status should be one of SUCCEEDED, FAILED, CANCELLED', async function (this: CustomWorld) {
  const finalStatus = this.getData('finalStatus');
  expect(finalStatus).toBeDefined();
  expect(['SUCCEEDED', 'FAILED', 'CANCELLED', 'CANCELED']).toContain(finalStatus);
});

Then('the final status should be one of REQUIRES_ACTION, SUCCEEDED, FAILED, CANCELLED', async function (this: CustomWorld) {
  const finalStatus = this.getData('finalStatus');
  expect(finalStatus).toBeDefined();
  expect(['REQUIRES_ACTION', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'CANCELED']).toContain(finalStatus);
});

When('I cancel the v3 payment request', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const paymentRequestId = this.getData('paymentRequestId');
  const response = await xenditApi.cancelPaymentRequest(paymentRequestId);
  this.setData('response', response);
});

Then('the response should indicate the payment request was cancelled', async function (this: CustomWorld) {
  const response = this.getData('response');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(['CANCELED', 'CANCELLED']).toContain(body.status);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

When('I send a tokenized payment request {string}', async function (this: CustomWorld, authState: string) {
  const xenditApi = this.getData('xenditApi');
  const payload = {
    reference_id: ref('pr-auth'),
    type: 'PAY' as const,
    ...BASE_QRIS_PAYLOAD,
    channel_properties: qrisChannelProperties(),
  };
  let response;
  if (authState.includes('without')) {
    response = await xenditApi.createPaymentRequestNoAuth(payload);
  } else {
    response = await xenditApi.createPaymentRequestInvalidAuth(payload);
  }
  this.setData('response', response);
});
