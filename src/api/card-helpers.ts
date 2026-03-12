import { faker } from '@faker-js/faker';
import type { CardDetailsV3 } from '@/api/v3-types.js';
import { V3_TEST_CARDS } from '@/api/test-cards-v3.js';

/**
 * Generates realistic-sounding but fake cardholder details using Faker.
 * Used to satisfy the Xendit v3 API's required `cardholder_*` fields.
 */
export function generateCardholder() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    cardholder_first_name: firstName,
    cardholder_last_name: lastName,
    cardholder_email: faker.internet
      .email({ firstName, lastName, provider: 'test.com' })
      .toLowerCase(),
    cardholder_phone_number: '+6281234567890',
  };
}

/**
 * Returns a complete card_details object for a success (no-3DS) card.
 * Merges static card number/expiry/cvn with Faker-generated cardholder info.
 */
export function successCardDetails(): CardDetailsV3 {
  return {
    ...V3_TEST_CARDS.SUCCESS_NO_3DS,
    ...generateCardholder(),
  };
}

/**
 * Returns card_details for the Mastercard test card (used for PAY_AND_SAVE/save-only flows).
 */
export function mastercardDetails(): CardDetailsV3 {
  return {
    ...V3_TEST_CARDS.SUCCESS_MASTERCARD,
    ...generateCardholder(),
  };
}

/**
 * Returns card_details for an "invalid card number" test scenario.
 */
export function invalidCardDetails(): CardDetailsV3 {
  return {
    ...V3_TEST_CARDS.INVALID_CARD_NUMBER,
    ...generateCardholder(),
  };
}

/**
 * Returns card_details for an "expired card" test scenario.
 */
export function expiredCardDetails(): CardDetailsV3 {
  return {
    ...V3_TEST_CARDS.EXPIRED_CARD,
    ...generateCardholder(),
  };
}

/**
 * Common channel_properties block for a CARDS payment using the success card.
 * Includes skip_three_ds + return URLs + Faker cardholder info.
 */
export function successCardChannelProperties() {
  return {
    mid_label: 'mid_label_acquirer_1',
    card_details: successCardDetails(),
    skip_three_ds: false,
    success_return_url: 'https://webhook.site/success',
    failure_return_url: 'https://webhook.site/failure',
  };
}

/**
 * Channel properties for QRIS.
 * No card data or channel properties required — works without CARDS channel being enabled.
 * Supports the /simulate endpoint in sandbox.
 * Used as the default channel for payment request tests (TC17–TC23).
 */
export function qrisChannelProperties() {
  return {};
}
