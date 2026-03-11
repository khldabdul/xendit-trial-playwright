import { faker } from '@faker-js/faker';

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export interface PaymentLinkData {
  external_id: string;
  amount: number;
  description: string;
  payer_email: string;
  items: PaymentItem[];
}

/**
 * Generates test data for a payment link including items, using Faker.
 */
export function generateTestPaymentData(): PaymentLinkData {
  const quantity = faker.number.int({ min: 1, max: 5 });
  // Price between 10,000 and 1,000,000 IDR
  const price = faker.number.int({ min: 10000, max: 1000000 });
  const amount = price * quantity;

  const item: PaymentItem = {
    name: faker.commerce.productName(),
    quantity,
    price,
    category: faker.commerce.department(),
  };

  return {
    external_id: `qa-trial-${faker.string.uuid()}`,
    amount,
    description: faker.commerce.productDescription(),
    payer_email: faker.internet.exampleEmail(),
    items: [item],
  };
}

/**
 * Generates an item for payment
 */
export function generatePaymentItem(): PaymentItem {
  return {
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 10 }),
    price: faker.number.int({ min: 10000, max: 1000000 }),
    category: faker.commerce.department(),
  };
}

/**
 * Generates a description for payment
 */
export function generatePaymentDescription(): string {
  return faker.commerce.productDescription();
}

export interface CreditCardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvn: string;
}

/**
 * Generates random credit card details.
 * Note: These are randomly generated from faker and will likely be declined by the payment gateway in tests.
 * For successful payment simulations, use specific test cards (e.g., '4111111111111111').
 */
export function generateRandomCreditCard(): CreditCardDetails {
  const futureDate = faker.date.future({ years: 5 });
  const expiryMonth = String(futureDate.getMonth() + 1).padStart(2, '0');
  const expiryYear = String(futureDate.getFullYear()).slice(-2);

  return {
    cardNumber: faker.finance.creditCardNumber('################'),
    expiryMonth,
    expiryYear,
    cvn: faker.finance.creditCardCVV(),
  };
}
