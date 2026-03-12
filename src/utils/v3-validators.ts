// src/utils/v3-validators.ts

import { expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';
import type { PaymentRequestResponse, PaymentTokenResponse, V3ErrorResponse } from '@/api/v3-types';

/**
 * Validates that a payment request response is successful
 * Checks for ID presence and valid status values
 */
export function expectPaymentRequestSuccess(body: PaymentRequestResponse) {
  expect(body.id).toBeDefined();
  expect(['PENDING', 'REQUIRES_ACTION', 'SUCCEEDED']).toContain(body.status);
}

/**
 * Validates that a payment token response is successful
 * Checks for ID presence and valid status values
 */
export function expectPaymentTokenSuccess(body: PaymentTokenResponse) {
  expect(body.id).toBeDefined();
  expect(['PENDING', 'REQUIRES_ACTION', 'SUCCEEDED']).toContain(body.status);
}

/**
 * Validates that an API response contains a specific error code
 * Useful for testing negative scenarios
 */
export async function expectV3Error(response: APIResponse, expectedCode: string) {
  expect(response.status()).toBeGreaterThanOrEqual(400);
  const body: V3ErrorResponse = await response.json();
  expect(body.error_code).toBe(expectedCode);
}

/**
 * Validates that a payment request response contains a payment token ID
 * (returned for PAY_AND_SAVE flows)
 */
export function expectPaymentMethodPresent(body: PaymentRequestResponse) {
  // In v3, PAY_AND_SAVE responses include payment_token_id at the top level
  expect(body.payment_token_id).toBeDefined();
}

/**
 * Validates that a payment request has a terminal status
 */
export function expectTerminalStatus(body: PaymentRequestResponse | PaymentTokenResponse) {
  expect(['SUCCEEDED', 'FAILED', 'CANCELLED']).toContain(body.status);
}

/**
 * Validates response status code is 200 or 201
 */
export function expectSuccessStatus(response: APIResponse) {
  expect([200, 201]).toContain(response.status());
}

/**
 * Validates response contains an ID field
 */
export function expectIdPresent(body: { id?: string }) {
  expect(body.id).toBeDefined();
  expect(typeof body.id).toBe('string');
}
