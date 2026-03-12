# Xendit v3 API Migration Design

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Migrate tokenized payments to v3 API, keep payment links (invoices) on v2

## Architecture

### New Files

```
src/api/
├── XenditApiV3Client.ts      # New v3 API client
├── v3-types.ts               # v3-specific TypeScript interfaces
├── test-cards-v3.ts          # v3 test card constants
└── utils/
    └── v3-validators.ts      # Response validation helpers

apps/api/xendit/
├── features/
│   ├── payment-requests/
│   │   └── payment-requests.feature
│   └── payment-tokens/
│       └── payment-tokens.feature
└── step-definitions/
    ├── payment-requests/
    │   └── payment_requests.steps.ts
    └── payment-tokens/
        └── payment_tokens.steps.ts
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API Client | Separate `XenditApiV3Client` class | Eliminates v2/v3 confusion |
| Feature Files | Separate files per flow | Easier maintenance and debugging |
| Test Cards | v3-specific constants | Self-documenting, v3-compatible |
| Webhooks | Skip for now | Complex enough for separate migration |
| Status Endpoints | Polling support | Handle async payment flows |
| TC Numbering | TC17-TC30 | No overlap with existing TC01-TC16 |

## API Client Design

### XenditApiV3Client Methods

```typescript
export class XenditApiV3Client {
  // ─── Payment Requests ─────────────────────────────────────────

  // POST /v3/payment_requests
  async createPaymentRequest(payload: CreatePaymentRequestV3): Promise<APIResponse>

  // POST /v3/payment_requests/{id}/simulate
  async simulatePayment(paymentRequestId: string, payload: SimulatePaymentPayload): Promise<APIResponse>

  // POST /v3/payment_requests/{id}/cancel
  async cancelPaymentRequest(paymentRequestId: string): Promise<APIResponse>

  // GET /v3/payment_requests/{id}
  async getPaymentRequest(paymentRequestId: string): Promise<APIResponse>

  // GET /v3/payment_requests/{id} with polling
  async pollPaymentRequestStatus(
    paymentRequestId: string,
    options?: { timeout?: number; interval?: number; terminalStates?: string[] }
  ): Promise<PaymentRequestStatus>

  // ─── Payment Tokens ───────────────────────────────────────────

  // POST /v3/payment_tokens
  async createPaymentToken(payload: CreatePaymentTokenV3): Promise<APIResponse>

  // GET /v3/payment_tokens/{id}
  async getPaymentToken(paymentTokenId: string): Promise<APIResponse>

  // GET /v3/payment_tokens/{id} with polling
  async pollPaymentTokenStatus(
    paymentTokenId: string,
    options?: { timeout?: number; interval?: number; terminalStates?: string[] }
  ): Promise<PaymentTokenStatus>
}
```

### Polling Behavior

- Default timeout: 30 seconds
- Default interval: 1 second
- Terminal states: `['SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED']`
- Throws on timeout with last known status

## TypeScript Types

### Core Types

```typescript
// src/api/v3-types.ts

export interface CreatePaymentRequestV3 {
  amount: number;
  currency: string;
  payment_method: PaymentMethodV3;
  customer?: CustomerV3;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethodV3 {
  type: 'CARD' | 'DIRECT_DEBIT' | 'EWALLET' | 'QR_CODE' | 'VIRTUAL_ACCOUNT';
  reusability: 'ONE_TIME_USE' | 'MULTIPLE_USE';
  card?: CardPaymentMethodV3;
}

export interface CardPaymentMethodV3 {
  channel_properties?: {
    success_return_url?: string;
    failure_return_url?: string;
  };
  card_information: {
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvn: string;
  };
}

export interface PaymentRequestResponse {
  id: string;
  status: 'PENDING' | 'REQUIRES_ACTION' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  payment_method?: { id: string; type: string; status: string };
}

export interface CreatePaymentTokenV3 {
  type: 'CARD';
  reusability: 'MULTIPLE_USE';
  card: CardPaymentMethodV3;
  customer_id?: string;
}

export interface PaymentTokenResponse {
  id: string;
  status: 'PENDING' | 'REQUIRES_ACTION' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  type: string;
  country?: string;
}

export interface SimulatePaymentPayload {
  status: 'SUCCEEDED' | 'FAILED';
}

export interface V3ErrorResponse {
  error_code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}
```

### Error Codes

```typescript
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
```

## Test Cards

```typescript
// src/api/test-cards-v3.ts

export const V3_TEST_CARDS = {
  SUCCESS_NO_3DS: {
    card_number: '4000000000000002',
    expiry_month: '12',
    expiry_year: '2030',
    cvn: '123',
  },
  INSUFFICIENT_FUNDS: {
    card_number: '4000000000000036',
    expiry_month: '12',
    expiry_year: '2030',
    cvn: '123',
  },
  EXPIRED_CARD: {
    card_number: '4000000000000002',
    expiry_month: '01',
    expiry_year: '2020',
    cvn: '123',
  },
  INVALID_CARD_NUMBER: {
    card_number: '4111111111111112',
    expiry_month: '12',
    expiry_year: '2030',
    cvn: '123',
  },
} as const;
```

## Test Cases

### Payment Requests (TC17-TC24)

| TC ID | Scenario | Tags |
|-------|----------|------|
| TC17_API | Create payment request - success | `@v3 @payment-requests @smoke` |
| TC18_API | Create payment request - invalid card | `@v3 @payment-requests @negative` |
| TC19_API | Simulate payment - success | `@v3 @payment-requests @smoke` |
| TC20_API | Simulate payment - insufficient funds | `@v3 @payment-requests @negative` |
| TC21_API | Get payment request status - polling | `@v3 @payment-requests` |
| TC22_API | Cancel payment request - pending | `@v3 @payment-requests` |
| TC23_API | Cancel payment request - already succeeded | `@v3 @payment-requests @negative` |
| TC24_API | Authentication failures | `@v3 @payment-requests @negative` |

### Payment Tokens (TC25-TC30)

| TC ID | Scenario | Tags |
|-------|----------|------|
| TC25_API | Save payment information only (SAVE_ONLY) | `@v3 @payment-tokens @smoke` |
| TC26_API | Pay and save (charge + tokenize) | `@v3 @payment-tokens @smoke` |
| TC27_API | Pay with existing token | `@v3 @payment-tokens @smoke` |
| TC28_API | Get payment token status - polling | `@v3 @payment-tokens` |
| TC29_API | Invalid token usage | `@v3 @payment-tokens @negative` |
| TC30_API | Authentication failures | `@v3 @payment-tokens @negative` |

## Fixtures & Hooks

### App Fixture Update

```typescript
// apps/api/xendit/fixtures/index.ts

import { XenditApiV3Client } from '@/api/XenditApiV3Client';

export const xenditApiTest = base.extend<{
  xenditApi: XenditApiClient;
  xenditApiV3: XenditApiV3Client;
}>({
  xenditApiV3: async ({ request }, use) => {
    const client = new XenditApiV3Client(
      request,
      process.env.XENDIT_SECRET_KEY!,
      process.env.XENDIT_API_URL!
    );
    await use(client);
  },
});
```

### Tag Convention

- `@v3` - All v3 API tests
- `@payment-requests` - Payment request scenarios
- `@payment-tokens` - Payment token scenarios

## Validation Helpers

```typescript
// src/utils/v3-validators.ts

export function expectPaymentRequestSuccess(body: PaymentRequestResponse) {
  expect(body.id).toBeDefined();
  expect(['PENDING', 'REQUIRES_ACTION', 'SUCCEEDED']).toContain(body.status);
}

export function expectPaymentTokenSuccess(body: PaymentTokenResponse) {
  expect(body.id).toBeDefined();
  expect(['PENDING', 'REQUIRES_ACTION', 'SUCCEEDED']).toContain(body.status);
}

export async function expectV3Error(response: APIResponse, expectedCode: string) {
  expect(response.status()).toBeGreaterThanOrEqual(400);
  const body = await response.json();
  expect(body.error_code).toBe(expectedCode);
}
```

## Out of Scope

- Webhook migration (separate effort)
- Payment links (invoices) - remain on v2
- Direct debit, e-wallet, QR code payment methods

## References

- [Create Payment Request](https://docs.xendit.co/apidocs/create-payment-request)
- [Simulate Payment](https://docs.xendit.co/apidocs/simulate-payment-test-mode)
- [Payment Webhook Notification](https://docs.xendit.co/apidocs/payment-webhook-notification)
- [Cancel Payment Request](https://docs.xendit.co/apidocs/cancel-payment-request)
- [Get Payment Request](https://docs.xendit.co/apidocs/get-payment-request)
- [Create Payment Token](https://docs.xendit.co/apidocs/create-payment-token)
- [Get Payment Token](https://docs.xendit.co/apidocs/get-payment-token)
- [Save Payment Information](https://docs.xendit.co/docs/save-payment-information)
- [Pay and Save](https://docs.xendit.co/docs/pay-and-save)
- [Pay with Tokens](https://docs.xendit.co/docs/pay-with-tokens)
