export interface CreateInvoiceRequest {
  external_id: string;
  /** Optional for open-amount (donation) links. Required for fixed-amount links. */
  amount?: number;
  description?: string;
  payer_email?: string;
  /** Duration in seconds until the invoice expires. E.g. 1 for 1 second (useful in tests). */
  invoice_duration?: number;
  /** Whether Xendit should send a payment email to payer_email. */
  should_send_email?: boolean;
  /** Custom reference to identify the payment link (unique per account). */
  success_redirect_url?: string;
  items?: {
    name: string;
    quantity: number;
    price: number;
    category?: string;
    url?: string;
  }[];
  customer?: {
    given_names?: string;
    surname?: string;
    email?: string;
    mobile_number?: string;
  };
}

export interface PaymentMethodCard {
  type: 'CREDIT_CARD';
  card_details: {
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvn: string;
  };
}

export interface CustomerDetails {
  id?: string;
  name?: string;
  email?: string;
  mobile_number?: string;
}

export interface CreatePayAndSaveRequest {
  amount: number;
  currency: string;
  payment_method: PaymentMethodCard;
  customer?: CustomerDetails;
  flow: 'PAY_AND_SAVE';
}

export interface CreatePaymentRequestWithToken {
  amount: number;
  currency: string;
  customer_id?: string;
  description?: string;
}

/** Shape of a payment method (tokenized card) returned by GET /v2/payment_methods/{id} */
export interface GetPaymentMethodResponse {
  id: string;
  type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  card?: {
    masked_card_number: string;
    expiry_month: string;
    expiry_year: string;
    card_brand?: string;
  };
  customer_id?: string;
  created?: string;
  updated?: string;
}
