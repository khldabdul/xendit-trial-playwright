/**
 * Xendit Test Cards
 *
 * These card numbers are used exclusively in Xendit's sandbox/test environment.
 * Reference: https://docs.xendit.co/credit-cards/integrations/test-scenarios
 *
 * DO NOT use in production. All numbers trigger specific simulated states.
 */

export interface TestCard {
  number: string;
  expiry: string; // MM/YY format
  cvn: string;
  description: string;
}

export const XENDIT_TEST_CARDS = {
  /** Xendit staging success card — triggers 3DS OTP flow with OTP = 1234 */
  SUCCESS_3DS: {
    number: '4000000000001091',
    expiry: '12/29',
    cvn: '123',
    description: 'Visa — Success with 3DS authentication',
  } as TestCard,

  /** Basic success card — no 3DS, straight approval */
  SUCCESS_NO_3DS: {
    number: '4111111111111111',
    expiry: '12/29',
    cvn: '123',
    description: 'Visa — Success without 3DS',
  } as TestCard,

  /** Card that is declined by the issuer */
  DECLINED: {
    number: '4000000000000002',
    expiry: '12/29',
    cvn: '123',
    description: 'Visa — Declined by issuer',
  } as TestCard,

  /** Card that triggers insufficient funds response */
  INSUFFICIENT_FUNDS: {
    number: '4000000000009995',
    expiry: '12/29',
    cvn: '123',
    description: 'Visa — Insufficient funds',
  } as TestCard,

  /** Card with invalid Luhn checksum (fails locally before hitting the network) */
  INVALID_LUHN: {
    number: '4111111111111112',
    expiry: '12/29',
    cvn: '123',
    description: 'Visa — Invalid card number (Luhn check fails)',
  } as TestCard,

  /** Card with a past expiry date */
  EXPIRED: {
    number: '4111111111111111',
    expiry: '01/20',
    cvn: '123',
    description: 'Visa — Expired card (past expiry date)',
  } as TestCard,
} as const;
