@epic:PaymentRequests
Feature: Payment Requests
  As a merchant
  I want to create payment requests using the v3 API
  So that I can accept various payment methods

  Background:
    Given I have a Xendit v3 API client
  # ─── SECTION 1: CARDS Channel (Currently Blocked in Sandbox) ─────────────────
  # These tests require the sandbox account to have PAN transactions enabled.
  # See docs/plans/repro-invalid-merchant-settings.md for details.

  @TC17_API @v3 @payment-requests @cards @smoke @failing
  Scenario: Create payment request - success
    When I create a v3 payment request for the CARDS channel
    Then the response status should be 200 or 201
    And the response should contain a payment request ID
    And the payment request status should be PENDING or REQUIRES_ACTION

  @TC17b_API @v3 @payment-requests @cards @negative
  Scenario: Create payment request - account not configured for CARDS
    # This scenario documents the known sandbox account 403 response.
    When I create a v3 payment request for the CARDS channel
    Then the API should return a 403 error indicating merchant not configured for CARDS

  @TC18_API @v3 @payment-requests @cards @negative @failing
  Scenario: Create payment request - invalid card number
    When I create a v3 payment request with an invalid card number
    Then the API should return a 400 error indicating invalid card number

  @TC19_API @v3 @payment-requests @cards @smoke @failing
  Scenario: Simulate payment - success
    Given I have a v3 payment request ID for CARDS
    When I simulate the v3 payment with status SUCCEEDED
    Then the response status should be 200
    And the payment request status should be SUCCEEDED

  @TC20_API @v3 @payment-requests @cards @negative @failing
  Scenario: Simulate payment - insufficient funds
    Given I have a v3 payment request ID for CARDS
    When I simulate the v3 payment with status FAILED
    Then the response status should be 200
    And the payment request status should be FAILED

  @TC21_API @v3 @payment-requests @cards @failing
  Scenario: Get payment request status - polling (CARDS)
    Given I have a v3 payment request ID for CARDS
    When I poll the payment request status until terminal
    Then the response status should be 200
    And the final status should be one of SUCCEEDED, FAILED, CANCELLED

  @TC22_API @v3 @payment-requests @cards @failing
  Scenario: Cancel payment request - pending (CARDS)
    Given I have a v3 payment request ID for CARDS
    When I cancel the v3 payment request
    Then the response status should be 200
    And the response should indicate the payment request was cancelled

  @TC23_API @v3 @payment-requests @cards @negative @failing
  Scenario: Cancel payment request - already succeeded (CARDS)
    Given I have a v3 payment request ID for CARDS
    When I simulate the v3 payment with status SUCCEEDED
    And I cancel the v3 payment request
    Then the API should return a 400 error indicating payment request already succeeded
  # ─── SECTION 2: QRIS Channel (Works in Sandbox) ──────────────────────────────

  @TC17q_API @v3 @payment-requests @qris @smoke
  Scenario: Create payment request via QRIS
    When I create a v3 payment request via QRIS
    Then the response status should be 200 or 201
    And the response should contain a payment request ID
    And the payment request status should be PENDING or REQUIRES_ACTION

  @TC19q_API @v3 @payment-requests @qris @smoke
  Scenario: Simulate QRIS payment - success
    Given I have a v3 payment request ID via QRIS
    When I simulate the v3 payment with status SUCCEEDED
    Then the response status should be 200
    And the payment request status should be SUCCEEDED

  @TC20q_API @v3 @payment-requests @qris @negative @failing
  Scenario: Simulate QRIS payment - invalid status
    # QRIS simulate only accepts amount, not status. Simulating 1 IDR fails logic.
    Given I have a v3 payment request ID via QRIS
    When I simulate the v3 payment with status FAILED
    Then the response status should be 200
    # Note: Xendit might handle "FAILED" simulation differently; generic test logic for this
    And the payment request status should be FAILED

  @TC21q_API @v3 @payment-requests @qris
  Scenario: Get payment request status - polling (QRIS)
    Given I have a v3 payment request ID via QRIS
    When I poll the payment request status until terminal
    Then the response status should be 200 or 201
    And the final status should be one of REQUIRES_ACTION, SUCCEEDED, FAILED, CANCELLED

  @TC22q_API @v3 @payment-requests @qris
  Scenario: Cancel payment request - pending (QRIS)
    Given I have a v3 payment request ID via QRIS
    When I cancel the v3 payment request
    Then the response status should be 200
    And the response should indicate the payment request was cancelled
  # ─── SECTION 3: Authentication (Agnostic) ────────────────────────────────────

  @TC24_API @v3 @payment-requests @negative
  Scenario Outline: Verify Authentication Failure
    When I send a tokenized payment request "<auth_state>"
    Then the API should return a 401 Unauthorized status

    Examples:
      | auth_state                      |
      | without an Authorization header |
      | with an invalid key header      |
