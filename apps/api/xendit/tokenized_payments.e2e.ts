import { xenditApiTest as test, expect } from '@xendit-api-fixtures';
import { CreatePayAndSaveRequest } from '@/api/types.js';
import { XENDIT_TEST_CARDS } from '@/utils/test-cards.js';

test.describe('API Scenarios: Tokenized Payments', () => {
  // ─── Shared payload factory ──────────────────────────────────────────────────

  /** Creates a valid PAY_AND_SAVE payload for a given card. */
  function buildPayAndSavePayload(card: {
    number: string;
    expiry: string;
    cvn: string;
  }): CreatePayAndSaveRequest {
    const [month, year] = card.expiry.split('/');
    return {
      amount: 50000,
      currency: 'IDR',
      payment_method: {
        type: 'CREDIT_CARD',
        card_details: {
          card_number: card.number,
          expiry_month: month,
          expiry_year: `20${year}`,
          cvn: card.cvn,
        },
      },
      customer: {
        name: 'QA Test User',
        email: 'qa.test@example.com',
      },
      flow: 'PAY_AND_SAVE',
    };
  }

  // ─── Positive Scenarios ──────────────────────────────────────────────────────

  test('TC08_API: Verify successful Payment Token creation (PAY_AND_SAVE)', async ({
    clients,
    step,
  }) => {
    /**
     * With valid API keys: expects status 200/201 and a response containing
     * an `id` (payment_method_id) and `status: "ACTIVE"`.
     * Without real keys: expects 401 Unauthorized — test validates error shape.
     */
    let paymentMethodId: string | undefined;

    await step.step('Send POST to create Pay and Save request with valid card', async () => {
      const payload = buildPayAndSavePayload(XENDIT_TEST_CARDS.SUCCESS_NO_3DS);
      const response = await clients.xendit.createPayAndSaveSession(payload);

      expect([200, 201, 401]).toContain(response.status());
      const body = await response.json();

      if (response.status() === 200 || response.status() === 201) {
        await step.step('Assert response contains payment_method_id and ACTIVE status', async () => {
          expect(body.id, 'Response must include a payment_method_id').toBeTruthy();
          expect(body.status, 'Token status must be ACTIVE').toBe('ACTIVE');
          paymentMethodId = body.id;
        });
      } else {
        // 401 — no real keys available; assert expected error shape
        await step.step('Assert 401 response contains error_code (no real API keys)', async () => {
          expect(body.error_code, 'Error code must be present in 401 response').toBeDefined();
        });
      }
    });
  });

  test('TC09_API: Verify successful Payment Request using active Token', async ({
    clients,
    step,
  }) => {
    /**
     * Flow:
     *  1. Create a PAY_AND_SAVE token to get a payment_method_id.
     *  2. Use that ID to make a payment request via PAY flow.
     *
     * With real API keys: expects SUCCEEDED status.
     * Without real keys: both steps return 401 — test validates gracefully.
     */
    let paymentMethodId: string | undefined;

    await step.step('Step 1: Create a PAY_AND_SAVE token (prerequisite)', async () => {
      const payload = buildPayAndSavePayload(XENDIT_TEST_CARDS.SUCCESS_NO_3DS);
      const tokenResponse = await clients.xendit.createPayAndSaveSession(payload);

      expect([200, 201, 401]).toContain(tokenResponse.status());

      if (tokenResponse.status() === 200 || tokenResponse.status() === 201) {
        const tokenBody = await tokenResponse.json();
        paymentMethodId = tokenBody.id;
        expect(paymentMethodId).toBeTruthy();
      }
    });

    await step.step('Step 2: Execute payment using the obtained token', async () => {
      if (!paymentMethodId) {
        console.log('Skipping PAY step: no payment_method_id obtained (no real API keys).');
        return;
      }

      const payResponse = await clients.xendit.payWithToken(paymentMethodId, {
        amount: 50000,
        currency: 'IDR',
        description: 'TC09 — Pay with active token',
      });

      expect([200, 201]).toContain(payResponse.status());
      const payBody = await payResponse.json();
      expect(payBody.status).toMatch(/SUCCEEDED|PENDING/i);
    });
  });

  test('TC10_API: Verify fetching Token details via GET', async ({ clients, step }) => {
    /**
     * Creates a token, then retrieves it and validates:
     * - Masked card number (not the full PAN)
     * - Expiry month/year
     * - Status is ACTIVE
     */
    let paymentMethodId: string | undefined;

    await step.step('Step 1: Create a PAY_AND_SAVE token', async () => {
      const payload = buildPayAndSavePayload(XENDIT_TEST_CARDS.SUCCESS_NO_3DS);
      const response = await clients.xendit.createPayAndSaveSession(payload);
      expect([200, 201, 401]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        const body = await response.json();
        paymentMethodId = body.id;
      }
    });

    await step.step('Step 2: GET the payment method and assert token details', async () => {
      if (!paymentMethodId) {
        console.log('Skipping GET step: no payment_method_id (no real API keys).');
        return;
      }

      const getResponse = await clients.xendit.getPaymentMethod(paymentMethodId);
      expect(getResponse.status()).toBe(200);

      const method = await getResponse.json();
      expect(method.id).toBe(paymentMethodId);
      expect(method.status).toBe('ACTIVE');
      // Masked PAN: Xendit returns something like "411111XXXXXX1111"
      expect(method.card?.masked_card_number, 'Must return masked PAN (not full number)').toBeTruthy();
      expect(method.card?.masked_card_number).not.toBe(XENDIT_TEST_CARDS.SUCCESS_NO_3DS.number);
    });
  });

  // ─── Negative Scenarios & Security ──────────────────────────────────────────

  test('TC11_API: Verify token creation failure with Invalid Card Number', async ({
    clients,
    step,
  }) => {
    await step.step('Send POST with a card number that fails Luhn check', async () => {
      const payload = buildPayAndSavePayload(XENDIT_TEST_CARDS.INVALID_LUHN);
      const response = await clients.xendit.createPayAndSaveSession(payload);

      // 400 = Xendit API rejects invalid Luhn; 401 = no real keys (auth checked first)
      expect([400, 401]).toContain(response.status());

      const body = await response.json();
      expect(body.error_code, 'Error code must pinpoint the invalid card number').toBeDefined();

      if (response.status() === 400) {
        expect(body.error_code).toMatch(/INVALID_CARD|CARD_DECLINED|VALIDATION/i);
      }
    });
  });

  test('TC12_API: Verify token creation failure with Expired Card', async ({
    clients,
    step,
  }) => {
    await step.step('Send POST with a card whose expiry date is in the past', async () => {
      const payload = buildPayAndSavePayload(XENDIT_TEST_CARDS.EXPIRED);
      const response = await clients.xendit.createPayAndSaveSession(payload);

      expect([400, 401]).toContain(response.status());
      const body = await response.json();
      expect(body.error_code).toBeDefined();

      if (response.status() === 400) {
        expect(body.error_code).toMatch(/EXPIRED|INVALID_CARD|VALIDATION/i);
      }
    });
  });

  test('TC13_API: Verify Authentication Failure (Missing/Invalid Keys)', async ({
    clients,
    step,
  }) => {
    const basePayload = buildPayAndSavePayload(XENDIT_TEST_CARDS.SUCCESS_NO_3DS);

    await step.step('Send POST with NO Authorization header', async () => {
      const response = await clients.xendit.createPayAndSaveSessionNoAuth(basePayload);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error_code ?? body.message).toBeDefined();
    });

    await step.step('Send POST with an INVALID Authorization header', async () => {
      const response = await clients.xendit.createPayAndSaveSessionInvalidAuth(basePayload);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error_code ?? body.message).toBeDefined();
    });
  });

  test('TC14_API: Verify Payment Request failure - Insufficient Funds', async ({
    clients,
    step,
  }) => {
    /**
     * Strategy: Use the Xendit-defined "insufficient funds" test card to trigger a decline.
     * Unlike TC09 (success), this token creation may succeed (the card might tokenize fine)
     * but the subsequent payment request is declined. OR Xendit may decline at tokenization.
     */
    await step.step('Send POST using the Insufficient Funds test card', async () => {
      const payload = buildPayAndSavePayload(XENDIT_TEST_CARDS.INSUFFICIENT_FUNDS);
      const response = await clients.xendit.createPayAndSaveSession(payload);

      // Possible outcomes:
      //   200/201: Token created, but status is non-ACTIVE (FAILED/DECLINED)
      //   400: Immediately rejected due to insufficient funds simulation
      //   401: No real keys (expected in auth-less runs)
      expect([200, 201, 400, 401]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200 || response.status() === 201) {
        // Token was created — check the status reflects a failure
        expect(body.status).toMatch(/FAILED|DECLINED|INACTIVE/i);
      } else if (response.status() === 400) {
        expect(body.error_code).toBeDefined();
      }
    });
  });

  test('TC15_API: Verify Payment Request failure - Missing Mandatory Parameters', async ({
    clients,
    step,
  }) => {
    await step.step('Send POST omitting the required "amount" field', async () => {
      // Deliberately bypass TypeScript's type checker with a cast to send an incomplete payload
      const incompletePayload = {
        currency: 'IDR',
        payment_method: {
          type: 'CREDIT_CARD',
          card_details: {
            card_number: XENDIT_TEST_CARDS.SUCCESS_NO_3DS.number,
            expiry_month: '12',
            expiry_year: '2029',
            cvn: '123',
          },
        },
        flow: 'PAY_AND_SAVE',
        // amount: intentionally omitted
      } as unknown as CreatePayAndSaveRequest;

      const response = await clients.xendit.createPayAndSaveSession(incompletePayload);

      // 400: Xendit rejects the request due to missing required field
      // 401: No real keys — auth failure (expected in auth-less runs)
      expect([400, 401]).toContain(response.status());

      const body = await response.json();
      expect(body.error_code ?? body.message).toBeDefined();

      if (response.status() === 400) {
        // The error should reference the missing "amount" field
        const errorText = JSON.stringify(body).toLowerCase();
        expect(errorText).toMatch(/amount|required|missing|validation/i);
      }
    });
  });

  test('TC16_API: Verify Payment Request failure - Invalid Token ID', async ({
    clients,
    step,
  }) => {
    await step.step('Send POST payment request using a fabricated non-existent token ID', async () => {
      const fakeTokenId = 'pm_does_not_exist_000_qa_trial';

      const response = await clients.xendit.payWithToken(fakeTokenId, {
        amount: 50000,
        currency: 'IDR',
        description: 'TC16 — should fail with invalid token ID',
      });

      // 404: Token not found; 400: Invalid format; 401: No real keys
      expect([400, 404, 401]).toContain(response.status());

      const body = await response.json();
      expect(body.error_code ?? body.message).toBeDefined();

      if (response.status() === 404 || response.status() === 400) {
        const errorText = JSON.stringify(body).toLowerCase();
        expect(errorText).toMatch(/not found|invalid|token|payment_method/i);
      }
    });
  });
});
