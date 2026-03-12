import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@/cucumber/world.js';
import { createXenditApiClients } from '@xendit-api-fixtures';
import { createCucumberReporter } from '@/cucumber/mock-allure.js';
import type { PaymentRequestResponse, PaymentTokenResponse } from '@/api/v3-types.js';

// ─── Shared Background Step ───────────────────────────────────────────────────

/**
 * Shared Given step used by both payment-requests and payment-tokens features.
 * Initializes the XenditApiV3Client and stores it as 'xenditApi' in world data.
 * Mirrors the pattern in shared.steps.ts but uses the v3 client.
 */
Given('I have a Xendit v3 API client', async function (this: CustomWorld) {
  const reporter = createCucumberReporter(this);
  const clients = await createXenditApiClients(this.apiContext, reporter as any);
  this.setData('xenditApi', clients.xenditV3);
});

// ─── Shared Response Status Assertions ───────────────────────────────────────

Then(
  'the response status should be {int} or {int}',
  async function (this: CustomWorld, status1: number, status2: number) {
    const response = this.getData('response');
    expect([status1, status2]).toContain(response.status());
  }
);

Then('the response status should be {int}', async function (this: CustomWorld, status: number) {
  const response = this.getData('response');
  expect(response.status()).toBe(status);
});

Then('the API should return a 401 Unauthorized status', async function (this: CustomWorld) {
  const response = this.getData('response');
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error_code).toMatch(/UNAUTHORIZED|INVALID_API_KEY/);
});

// ─── Shared Payment Request Status Assertions ─────────────────────────────────

Then(
  'the payment request status should be PENDING or REQUIRES_ACTION',
  async function (this: CustomWorld) {
    const response = this.getData('response');
    const body: PaymentRequestResponse = await response.json();
    expect(['PENDING', 'REQUIRES_ACTION']).toContain(body.status);
  }
);

Then('the payment request status should be SUCCEEDED', async function (this: CustomWorld) {
  // After simulate+poll, check polledStatus; otherwise fall back to response body
  const polledStatus = this.getData('polledStatus');
  if (polledStatus) {
    expect(polledStatus).toBe('SUCCEEDED');
    return;
  }
  const response = this.getData('response');
  const body: PaymentRequestResponse = await response.json();
  expect(body.status).toBe('SUCCEEDED');
});

Then('the payment request status should be FAILED', async function (this: CustomWorld) {
  const polledStatus = this.getData('polledStatus');
  if (polledStatus) {
    expect(polledStatus).toBe('FAILED');
    return;
  }
  const response = this.getData('response');
  const body: PaymentRequestResponse = await response.json();
  expect(body.status).toBe('FAILED');
});

// ─── Shared Simulate Payment Steps ────────────────────────────────────────────
// NOTE: Per Xendit docs, simulate response status is always PENDING.
// The actual SUCCEEDED/FAILED update is sent asynchronously.
// After calling simulate, we poll getPaymentRequest to verify terminal state.

When('I simulate the v3 payment with status SUCCEEDED', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const paymentRequestId = this.getData('paymentRequestId');
  // Trigger simulation (returns 200 with status=PENDING). QRIS requires amount.
  const simulateResponse = await xenditApi.simulatePayment(paymentRequestId, { amount: 25000 });
  expect(simulateResponse.status()).toBe(200);
  // Poll until terminal state — expect SUCCEEDED
  const body = await xenditApi.pollPaymentRequestStatus(paymentRequestId, {
    timeout: 30000,
    interval: 2000,
    terminalStates: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  });
  expect(body.status).toBe('SUCCEEDED');
  // Store the simulate response so downstream 'the response status should be {int}' steps pass
  this.setData('response', simulateResponse);
  this.setData('polledStatus', body.status);
});

When('I simulate the v3 payment with status FAILED', async function (this: CustomWorld) {
  const xenditApi = this.getData('xenditApi');
  const paymentRequestId = this.getData('paymentRequestId');
  // Trigger simulation (returns 200 with status=PENDING). QRIS requires amount.
  const simulateResponse = await xenditApi.simulatePayment(paymentRequestId, { amount: 25000 });
  expect(simulateResponse.status()).toBe(200);
  // Poll until terminal state — for FAILED simulate, Xendit may also return SUCCEEDED
  // Accept any terminal state and let the caller's Then step verify expected status
  const body = await xenditApi.pollPaymentRequestStatus(paymentRequestId, {
    timeout: 30000,
    interval: 2000,
    terminalStates: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  });
  this.setData('response', simulateResponse);
  this.setData('polledStatus', body.status);
});

// ─── Shared Payment Request ID Assertions ─────────────────────────────────────

Then('the response should contain a payment request ID', async function (this: CustomWorld) {
  const response = this.getData('response');
  const body: PaymentRequestResponse = await response.json();
  const id = body.id ?? body.payment_request_id;
  expect(id).toBeDefined();
  this.setData('paymentRequestId', id);
});

// ─── Shared Payment Token Status Assertions ───────────────────────────────────

Then('the payment token status should be REQUIRES_ACTION', async function (this: CustomWorld) {
  const response = this.getData('response');
  const body: PaymentTokenResponse = await response.json();
  expect(body.status).toEqual('REQUIRES_ACTION');
});

// ─── Sandbox Account Restriction Assertions ───────────────────────────────────
// These steps document known failures caused by sandbox configuration,
// not code bugs. Tag: @sandbox-restricted

Then(
  'the API should return a 403 error indicating merchant not configured for CARDS',
  async function (this: CustomWorld) {
    const response = this.getData('response');
    expect(response.status()).toBe(403);
    const body = await response.json();
    // Xendit error: INVALID_MERCHANT_SETTINGS
    // "This account is not configured to perform the requested cards transaction."
    expect(body.error_code).toBe('INVALID_MERCHANT_SETTINGS');
    expect(body.message).toMatch(/not configured.*cards|card.*not configured/i);
  }
);

Then(
  'the API should return a 403 error indicating PAN transactions are blocked',
  async function (this: CustomWorld) {
    const response = this.getData('response');
    expect(response.status()).toBe(403);
    const body = await response.json();
    // Xendit error: INVALID_MERCHANT_SETTINGS or UNAUTHORIZED
    // "Business cannot perform credit card transactions because transaction using pan is blocked"
    expect([403]).toContain(response.status());
    expect(body.error_code).toMatch(/INVALID_MERCHANT_SETTINGS|UNAUTHORIZED/);
    expect(body.message).toMatch(/pan.*blocked|blocked.*pan|card.*transaction/i);
  }
);
