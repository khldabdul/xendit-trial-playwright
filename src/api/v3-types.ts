// src/api/v3-types.ts
// Aligned with Xendit v3 API docs:
// - POST /v3/payment_requests
// - POST /v3/payment_tokens
// - POST /v3/payment_requests/{id}/simulate

// ─── Payment Requests ─────────────────────────────────────────

/**
 * Request body for POST /v3/payment_requests
 * Docs: https://docs.xendit.co/apidocs/create-payment-request
 */
export interface CreatePaymentRequestV3 {
  reference_id: string;
  type: 'PAY' | 'PAY_AND_SAVE';
  country: string;
  currency: string;
  request_amount: number;
  capture_method?: 'AUTOMATIC' | 'MANUAL';
  channel_code?: string;
  channel_properties?: ChannelPropertiesV3;
  /** Top-level field for pay-with-token flows */
  payment_token_id?: string;
  customer?: CustomerV3;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ChannelPropertiesV3 {
  card_details?: CardDetailsV3;
  skip_three_ds?: boolean;
  success_return_url?: string;
  failure_return_url?: string;
  mid_label?: string;
  card_on_file_type?: 'CUSTOMER_UNSCHEDULED' | 'MERCHANT_UNSCHEDULED' | 'RECURRING';
  statement_descriptor?: string;
}

export interface CardDetailsV3 {
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvn: string;
  cardholder_first_name?: string;
  cardholder_last_name?: string;
  cardholder_email?: string;
  cardholder_phone_number?: string;
}

export interface CustomerV3 {
  reference_id?: string;
  type?: 'INDIVIDUAL';
  individual_detail?: {
    given_names: string;
    surname?: string;
  };
  email?: string;
  mobile_number?: string;
}

export interface PaymentRequestResponse {
  id?: string;
  payment_request_id?: string;
  reference_id?: string;
  payment_token_id?: string;
  type?: string;
  status: 'PENDING' | 'REQUIRES_ACTION' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'CANCELED';
  channel_code?: string;
  request_amount?: number;
  currency?: string;
  created?: string;
  updated?: string;
  actions?: Array<{ type: string; descriptor: string; value: string }>;
}

// ─── Payment Tokens ───────────────────────────────────────────

/**
 * Request body for POST /v3/payment_tokens
 * Docs: https://docs.xendit.co/apidocs/create-payment-token
 */
export interface CreatePaymentTokenV3 {
  reference_id: string;
  country: string;
  currency: string;
  channel_code: string;
  channel_properties: ChannelPropertiesV3;
  customer?: CustomerV3;
  customer_id?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentTokenResponse {
  id?: string;
  payment_token_id?: string;
  reference_id?: string;
  status: 'PENDING' | 'REQUIRES_ACTION' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'CANCELED' | 'ACTIVE' | 'EXPIRED';
  channel_code?: string;
  country?: string;
  currency?: string;
  created?: string;
  updated?: string;
  actions?: Array<{ type: string; descriptor: string; value: string }>;
}

// ─── Simulate Payment ─────────────────────────────────────────

/**
 * Request body for POST /v3/payment_requests/{id}/simulate
 * Docs: https://docs.xendit.co/apidocs/simulate-payment-test-mode
 * NOTE: Simulate response always returns status=PENDING.
 * The actual SUCCEEDED/FAILED update is sent asynchronously via webhook.
 * Use getPaymentRequest polling to observe the final state.
 */
export interface SimulatePaymentPayload {
  amount?: number;
}

// ─── Error Handling ───────────────────────────────────────────

export interface V3ErrorResponse {
  error_code: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ─── Error Codes ──────────────────────────────────────────────

export const V3_ERROR_CODES = {
  INVALID_CARD_NUMBER: 'INVALID_CARD_NUMBER',
  CARD_EXPIRED: 'CARD_EXPIRED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PAYMENT_REQUEST_NOT_FOUND: 'PAYMENT_REQUEST_NOT_FOUND',
  PAYMENT_REQUEST_ALREADY_SUCCEEDED: 'PAYMENT_REQUEST_ALREADY_SUCCEEDED',
  PAYMENT_REQUEST_ALREADY_CANCELLED: 'PAYMENT_REQUEST_ALREADY_CANCELLED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_API_KEY: 'INVALID_API_KEY',
} as const;

// ─── Polling Options ──────────────────────────────────────────

export interface PollingOptions {
  timeout?: number; // milliseconds, default 30000
  interval?: number; // milliseconds, default 1000
  terminalStates?: string[];
}
