import { APIRequestContext, APIResponse } from '@playwright/test';
import type { MinimalAllureReporter } from '@/types/config.types.js';
import type {
  CreatePaymentRequestV3,
  CreatePaymentTokenV3,
  SimulatePaymentPayload,
  PaymentRequestResponse,
  PaymentTokenResponse,
  PollingOptions,
} from './v3-types.js';

import { sleep } from '@/utils/sleep.js';

export class XenditApiV3Client {
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

  private getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'api-version': '2024-11-11',
    };
  }

  /**
   * Wraps an API call with Allure request/response attachments for traceability.
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
        this.allure.attachment(`${label} – Request`, JSON.stringify(requestBody ?? null, null, 2), {
          contentType: 'application/json',
        });
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

  // ─── Payment Requests ─────────────────────────────────────────

  /**
   * Creates a Payment Request
   * API: POST /v3/payment_requests
   */
  async createPaymentRequest(payload: CreatePaymentRequestV3): Promise<APIResponse> {
    return this.logApiCall('POST', '/v3/payment_requests', payload, () =>
      this.request.post(`${this.baseUrl}/v3/payment_requests`, {
        headers: this.getAuthHeaders(),
        data: payload,
      })
    );
  }

  /**
   * Simulates a payment in test mode
   * API: POST /v3/payment_requests/{payment_request_id}/simulate
   */
  async simulatePayment(
    paymentRequestId: string,
    payload: SimulatePaymentPayload
  ): Promise<APIResponse> {
    return this.logApiCall(
      'POST',
      `/v3/payment_requests/${paymentRequestId}/simulate`,
      payload,
      () =>
        this.request.post(`${this.baseUrl}/v3/payment_requests/${paymentRequestId}/simulate`, {
          headers: this.getAuthHeaders(),
          data: payload,
        })
    );
  }

  /**
   * Cancels a Payment Request
   * API: POST /v3/payment_requests/{payment_request_id}/cancel
   */
  async cancelPaymentRequest(paymentRequestId: string): Promise<APIResponse> {
    return this.logApiCall('POST', `/v3/payment_requests/${paymentRequestId}/cancel`, null, () =>
      this.request.post(`${this.baseUrl}/v3/payment_requests/${paymentRequestId}/cancel`, {
        headers: this.getAuthHeaders(),
        data: {},
      })
    );
  }

  /**
   * Gets a Payment Request by ID
   * API: GET /v3/payment_requests/{payment_request_id}
   */
  async getPaymentRequest(paymentRequestId: string): Promise<APIResponse> {
    return this.logApiCall('GET', `/v3/payment_requests/${paymentRequestId}`, null, () =>
      this.request.get(`${this.baseUrl}/v3/payment_requests/${paymentRequestId}`, {
        headers: this.getAuthHeaders(),
      })
    );
  }

  /**
   * Polls Payment Request status until terminal state or timeout
   * @param paymentRequestId - Payment Request ID to poll
   * @param options - Polling options (timeout, interval, terminalStates)
   * @returns Payment Request response with terminal status
   * @throws Error if timeout is reached
   */
  async pollPaymentRequestStatus(
    paymentRequestId: string,
    options?: PollingOptions
  ): Promise<PaymentRequestResponse> {
    const {
      timeout = 30000,
      interval = 1000,
      terminalStates = ['SUCCEEDED', 'FAILED', 'CANCELLED'],
    } = options || {};

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await this.getPaymentRequest(paymentRequestId);
      const body: PaymentRequestResponse = await response.json();

      if (terminalStates.includes(body.status)) {
        return body;
      }

      await sleep(interval);
    }

    // Get final status for error message
    const finalResponse = await this.getPaymentRequest(paymentRequestId);
    const finalBody = await finalResponse.json();
    throw new Error(`Polling timeout after ${timeout}ms. Last status: ${finalBody.status}`);
  }

  // ─── Payment Tokens ───────────────────────────────────────────

  /**
   * Creates a Payment Token (SAVE_ONLY flow)
   * API: POST /v3/payment_tokens
   */
  async createPaymentToken(payload: CreatePaymentTokenV3): Promise<APIResponse> {
    return this.logApiCall('POST', '/v3/payment_tokens', payload, () =>
      this.request.post(`${this.baseUrl}/v3/payment_tokens`, {
        headers: this.getAuthHeaders(),
        data: payload,
      })
    );
  }

  /**
   * Gets a Payment Token by ID
   * API: GET /v3/payment_tokens/{payment_token_id}
   */
  async getPaymentToken(paymentTokenId: string): Promise<APIResponse> {
    return this.logApiCall('GET', `/v3/payment_tokens/${paymentTokenId}`, null, () =>
      this.request.get(`${this.baseUrl}/v3/payment_tokens/${paymentTokenId}`, {
        headers: this.getAuthHeaders(),
      })
    );
  }

  /**
   * Polls Payment Token status until terminal state or timeout
   * @param paymentTokenId - Payment Token ID to poll
   * @param options - Polling options (timeout, interval, terminalStates)
   * @returns Payment Token response with terminal status
   * @throws Error if timeout is reached
   */
  async pollPaymentTokenStatus(
    paymentTokenId: string,
    options?: PollingOptions
  ): Promise<PaymentTokenResponse> {
    const {
      timeout = 30000,
      interval = 1000,
      terminalStates = ['SUCCEEDED', 'FAILED', 'CANCELLED'],
    } = options || {};

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await this.getPaymentToken(paymentTokenId);
      const body: PaymentTokenResponse = await response.json();

      if (terminalStates.includes(body.status)) {
        return body;
      }

      await sleep(interval);
    }

    // Get final status for error message
    const finalResponse = await this.getPaymentToken(paymentTokenId);
    const finalBody = await finalResponse.json();
    throw new Error(`Polling timeout after ${timeout}ms. Last status: ${finalBody.status}`);
  }

  // ─── Authentication Helpers ─────────────────────────────────

  /**
   * Creates a Payment Request without authentication
   * Used for testing auth failure scenarios
   */
  async createPaymentRequestNoAuth(payload: CreatePaymentRequestV3): Promise<APIResponse> {
    return this.logApiCall('POST', '/v3/payment_requests (no auth)', payload, () =>
      this.request.post(`${this.baseUrl}/v3/payment_requests`, {
        headers: { 'Content-Type': 'application/json' }, // No Authorization header
        data: payload,
      })
    );
  }

  /**
   * Creates a Payment Request with invalid authentication
   * Used for testing auth failure scenarios
   */
  async createPaymentRequestInvalidAuth(payload: CreatePaymentRequestV3): Promise<APIResponse> {
    const invalidAuthHeader = `Basic ${Buffer.from('invalid_key_abc123:').toString('base64')}`;
    return this.logApiCall('POST', '/v3/payment_requests (invalid auth)', payload, () =>
      this.request.post(`${this.baseUrl}/v3/payment_requests`, {
        headers: {
          Authorization: invalidAuthHeader,
          'Content-Type': 'application/json',
        },
        data: payload,
      })
    );
  }

  /**
   * Creates a Payment Token without authentication
   * Used for testing auth failure scenarios (TC30)
   */
  async createPaymentTokenNoAuth(payload: CreatePaymentTokenV3): Promise<APIResponse> {
    return this.logApiCall('POST', '/v3/payment_tokens (no auth)', payload, () =>
      this.request.post(`${this.baseUrl}/v3/payment_tokens`, {
        headers: { 'Content-Type': 'application/json' }, // No Authorization header
        data: payload,
      })
    );
  }

  /**
   * Creates a Payment Token with invalid authentication
   * Used for testing auth failure scenarios (TC30)
   */
  async createPaymentTokenInvalidAuth(payload: CreatePaymentTokenV3): Promise<APIResponse> {
    const invalidAuthHeader = `Basic ${Buffer.from('invalid_key_abc123:').toString('base64')}`;
    return this.logApiCall('POST', '/v3/payment_tokens (invalid auth)', payload, () =>
      this.request.post(`${this.baseUrl}/v3/payment_tokens`, {
        headers: {
          Authorization: invalidAuthHeader,
          'Content-Type': 'application/json',
        },
        data: payload,
      })
    );
  }
}
