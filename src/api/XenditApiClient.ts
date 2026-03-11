import { APIRequestContext, APIResponse } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types.js';
import {
  CreateInvoiceRequest,
  CreatePayAndSaveRequest,
  CreatePaymentRequestWithToken,
} from './types.js';

export class XenditApiClient {
  private request: APIRequestContext;
  private secretKey: string;
  private baseUrl: string;
  private allure?: MinimalAllureReporter;

  constructor(
    request: APIRequestContext,
    secretKey: string,
    baseUrl: string,
    allure?: MinimalAllureReporter
  ) {
    if (!baseUrl) {
      throw new Error('XENDIT_API_URL is not defined in environment variables.');
    }
    this.request = request;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
    this.allure = allure;
  }

  private getAuthHeaders() {
    return {
      Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Wraps an API call with Allure request/response attachments for traceability.
   *
   * Attaches:
   * - Request body as JSON  → "[METHOD] <path> – Request"
   * - Response (status + body) as JSON → "[METHOD] <path> – Response"
   *
   * Falls back gracefully when allure is not injected (e.g. standalone usage).
   */
  private async logApiCall<T extends APIResponse>(
    method: string,
    endpointPath: string,
    requestBody: unknown,
    fn: () => Promise<T>
  ): Promise<T> {
    const label = `${method} ${endpointPath}`;

    // Attach request body
    if (this.allure) {
      try {
        this.allure.attachment(
          `${label} – Request`,
          JSON.stringify(requestBody ?? null, null, 2),
          { contentType: 'application/json' }
        );
      } catch {
        // Non-blocking; never fail a test because of a logging error
      }
    }

    // Execute the request
    const response = await fn();

    // Attach response body
    if (this.allure) {
      try {
        let responseBody: unknown;
        try {
          // Clone the buffer so callers can still call response.json() later
          const rawBody = await response.body();
          responseBody = JSON.parse(rawBody.toString());
        } catch {
          responseBody = '<non-JSON or empty response body>';
        }

        this.allure.attachment(
          `${label} – Response`,
          JSON.stringify(
            {
              status: response.status(),
              statusText: response.statusText(),
              body: responseBody,
            },
            null,
            2
          ),
          { contentType: 'application/json' }
        );
      } catch {
        // Non-blocking
      }
    }

    return response;
  }

  /**
   * Creates a Payment Link (Invoice)
   * API: /v2/invoices
   */
  async createPaymentLink(payload: CreateInvoiceRequest): Promise<APIResponse> {
    return this.logApiCall('POST', '/v2/invoices', payload, () =>
      this.request.post(`${this.baseUrl}/v2/invoices`, {
        headers: this.getAuthHeaders(),
        data: payload,
      })
    );
  }

  /**
   * Explores the Pay and Save behavior using Tokenization
   * API: /payment_requests (flow = PAY_AND_SAVE)
   */
  async createPayAndSaveSession(payload: CreatePayAndSaveRequest): Promise<APIResponse> {
    return this.logApiCall('POST', '/payment_requests', payload, () =>
      this.request.post(`${this.baseUrl}/payment_requests`, {
        headers: this.getAuthHeaders(),
        data: payload,
      })
    );
  }

  /**
   * Executes a payment using a saved token
   * API: /payment_requests?token={payment_token_id}&flow=PAY
   */
  async payWithToken(
    tokenId: string,
    payload: CreatePaymentRequestWithToken
  ): Promise<APIResponse> {
    return this.logApiCall('POST', `/payment_requests?token=${tokenId}&flow=PAY`, payload, () =>
      this.request.post(`${this.baseUrl}/payment_requests`, {
        headers: this.getAuthHeaders(),
        params: {
          token: tokenId,
          flow: 'PAY',
        },
        data: payload,
      })
    );
  }

  /**
   * Simulates a Virtual Account payment in Xendit's sandbox environment.
   * This triggers Xendit to send a webhook to the configured callback URL.
   * API: /pool_virtual_accounts/simulate_payment
   */
  async simulateVAPayment(
    bankCode: string,
    bankAccountNumber: string,
    amount: number
  ): Promise<APIResponse> {
    const body = { bank_code: bankCode, bank_account_number: bankAccountNumber, amount };
    return this.logApiCall('POST', '/pool_virtual_accounts/simulate_payment', body, () =>
      this.request.post(`${this.baseUrl}/pool_virtual_accounts/simulate_payment`, {
        headers: this.getAuthHeaders(),
        data: body,
      })
    );
  }

  /**
   * Fetches a payment method (tokenized card) by its ID.
   * Used to verify token details post-creation (masked PAN, expiry, status).
   * API: GET /v2/payment_methods/{paymentMethodId}
   *
   * TC10_API: Verify fetching Token details via GET
   */
  async getPaymentMethod(paymentMethodId: string): Promise<APIResponse> {
    return this.logApiCall('GET', `/v2/payment_methods/${paymentMethodId}`, null, () =>
      this.request.get(`${this.baseUrl}/v2/payment_methods/${paymentMethodId}`, {
        headers: this.getAuthHeaders(),
      })
    );
  }

  /**
   * Attempts to create a Pay-and-Save session with NO Authorization header.
   * Used to verify TC13_API: Authentication failure — missing key.
   */
  async createPayAndSaveSessionNoAuth(payload: CreatePayAndSaveRequest): Promise<APIResponse> {
    return this.logApiCall('POST', '/payment_requests (no auth)', payload, () =>
      this.request.post(`${this.baseUrl}/payment_requests`, {
        headers: { 'Content-Type': 'application/json' }, // No Authorization header
        data: payload,
      })
    );
  }

  /**
   * Attempts to create a Pay-and-Save session with an INVALID Authorization header.
   * Used to verify TC13_API: Authentication failure — invalid key.
   */
  async createPayAndSaveSessionInvalidAuth(payload: CreatePayAndSaveRequest): Promise<APIResponse> {
    const invalidAuthHeader = `Basic ${Buffer.from('invalid_key_abc123:').toString('base64')}`;
    return this.logApiCall('POST', '/payment_requests (invalid auth)', payload, () =>
      this.request.post(`${this.baseUrl}/payment_requests`, {
        headers: {
          Authorization: invalidAuthHeader,
          'Content-Type': 'application/json',
        },
        data: payload,
      })
    );
  }
}
