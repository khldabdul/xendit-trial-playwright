@epic:PaymentTokens
Feature: Payment Tokens
  As a merchant
  I want to tokenize payment methods using the v3 API
  So that I can securely store and reuse payment information

  Background:
    Given I have a Xendit v3 API client

  @TC25_API @v3 @payment-tokens @smoke @failing @skip
  Scenario: Save payment information only - success
    # FAILING: 403 INVALID_MERCHANT_SETTINGS — PAN transactions blocked on this sandbox account.
    # See docs/plans/repro-invalid-merchant-settings.md to trace this issue.
    When I create a v3 payment token for saving payment information
    Then the response status should be 200 or 201
    And the response should contain a payment token ID
    And the payment token status should be REQUIRES_ACTION

  @TC25b_API @v3 @payment-tokens @negative @sandbox-restricted
  Scenario: Save payment information - account blocks PAN tokenization
    # This scenario documents a known sandbox account restriction.
    # Error: INVALID_MERCHANT_SETTINGS
    # Message: "Business cannot perform credit card transactions because transaction using pan is blocked"
    # Repro: POST /v3/payment_tokens with channel_code: CARDS
    # Resolution: Contact Xendit support to unblock PAN (card number) tokenization for this sandbox account.
    When I create a v3 payment token for saving payment information
    Then the API should return a 403 error indicating PAN transactions are blocked

  @TC26_API @v3 @payment-tokens @smoke @failing @skip
  Scenario: Pay and save payment method - success
    # FAILING: 403 INVALID_MERCHANT_SETTINGS — CARDS channel not enabled on this sandbox account.
    When I create a v3 payment request with save payment method enabled
    Then the response status should be 200 or 201
    And the response should contain a payment request ID
    And the payment method should be tokenized
    And the payment token status should be REQUIRES_ACTION
    When I simulate the v3 payment with status SUCCEEDED
    Then the response status should be 200
    And the payment request status should be SUCCEEDED
    When I create a v3 payment request using the token
    Then the response status should be 200 or 201
    And the response should contain a payment request ID
    And the payment request status should be PENDING or REQUIRES_ACTION

  @TC27_API @v3 @payment-tokens @smoke @failing @skip
  Scenario: Pay with existing token - success
    # FAILING: prerequisite (Given I have a saved v3 payment token) returns 403.
    Given I have a saved v3 payment token
    When I create a v3 payment request using the token
    Then the response status should be 200 or 201
    And the response should contain a payment request ID
    And the payment request status should be PENDING or REQUIRES_ACTION
    When I simulate the v3 payment with status SUCCEEDED
    Then the response status should be 200
    And the payment request status should be SUCCEEDED

  @TC28_API @v3 @payment-tokens @failing @skip
  Scenario: Get payment token status - polling
    # FAILING: prerequisite (Given I have a v3 payment token ID) returns 403.
    Given I have a v3 payment token ID
    When I poll the payment token status until terminal
    Then the response status should be 200
    And the final token status should be one of SUCCEEDED, FAILED, CANCELLED

  @TC29_API @v3 @payment-tokens @negative
  Scenario: Invalid token usage
    When I create a v3 payment request with an invalid token
    Then the API should return a 400 error indicating invalid token

  @TC30_API @v3 @payment-tokens @negative
  Scenario Outline: Verify Authentication Failure
    When I send a payment token request "<auth_state>"
    Then the API should return a 401 Unauthorized status

    Examples:
      | auth_state                      |
      | without an Authorization header |
      | with an invalid key header      |
