/**
 * Xendit v3 sandbox test cards.
 * Cards come from official Xendit documentation for test mode.
 * All cards use skip_three_ds: true for API-only (non-redirect) testing.
 *
 * Docs: https://docs.xendit.co/apidocs/create-payment-request
 */
export const V3_TEST_CARDS = {
  /** Standard test card — no 3DS, auto-succeeds in simulation */
  SUCCESS_NO_3DS: {
    card_number: '4000000000000002',
    expiry_month: '03',
    expiry_year: '2030',
    cvn: '789',
  },

  /** Card that simulates INSUFFICIENT_FUNDS after payment */
  INSUFFICIENT_FUNDS: {
    card_number: '4000000000000036',
    expiry_month: '03',
    expiry_year: '2030',
    cvn: '789',
  },

  /** Mastercard for PAY_AND_SAVE / save-only flows */
  SUCCESS_MASTERCARD: {
    card_number: '5200000000001005',
    expiry_month: '09',
    expiry_year: '2028',
    cvn: '321',
  },

  /** Card that produces INVALID_CARD_NUMBER error (invalid Luhn) */
  INVALID_CARD_NUMBER: {
    card_number: '4111111111111112',
    expiry_month: '03',
    expiry_year: '2030',
    cvn: '789',
  },

  /** Expired card */
  EXPIRED_CARD: {
    card_number: '4000000000000002',
    expiry_month: '01',
    expiry_year: '2020',
    cvn: '789',
  },
} as const;
