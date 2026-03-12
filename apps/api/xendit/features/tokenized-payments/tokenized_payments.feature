@epic:TokenizedPayments
Feature: Tokenized Payments
  As a merchant
  I want to use tokenized cards to charge returning customers
  So that they have a seamless checkout experience

  Background:
    Given I have a Xendit API client

  @TC08_API @api @smoke
  Scenario: Verify successful Payment Token creation (PAY_AND_SAVE)
    When I create a tokenized charge with valid card details for PAY_AND_SAVE
    Then the response status should be 200 or 201
    And the response should contain a payment method ID

  @TC09_API @api
  Scenario: Verify successful Payment Request using active Token
    Given I have created a tokenized payment method
    When I make a payment request using the active token
    Then the payment request should succeed

  @TC10_API @api
  Scenario: Verify fetching Token details via GET
    Given I have created a tokenized payment method
    When I fetch the token details via GET
    Then the response should contain the masked PAN and ACTIVE status

  @TC11_API @api @negative
  Scenario: Verify token creation failure with Invalid Card Number
    When I attempt to create a tokenized charge with an invalid card number
    Then the API should return a 400 error for invalid card number

  @TC12_API @api @negative
  Scenario: Verify token creation failure with Expired Card
    When I attempt to create a tokenized charge with an expired card
    Then the API should return a 400 error indicating expired card

  @TC13_API @api @negative
  Scenario Outline: Verify Authentication Failure
    When I send a tokenized payment request "<auth_state>"
    Then the API should return a 401 Unauthorized status

    Examples:
      | auth_state                      |
      | without an Authorization header |
      | with an invalid key header      |

  @TC14_API @api @negative
  Scenario: Verify Payment Request failure - Insufficient Funds
    When I create a tokenized charge using an INSUFFICIENT_FUNDS card
    Then the API should return a failure status indicating insufficient funds

  @TC15_API @api @negative
  Scenario: Verify Payment Request failure - Missing Mandatory Parameters
    Given I have created a tokenized payment method
    When I make a payment request using the token without specifying an amount
    Then the API should return a 400 error indicating missing amount

  @TC16_API @api @negative
  Scenario: Verify Payment Request failure - Invalid Token ID
    When I make a payment request using a fabricated token ID
    Then the API should return a not found or invalid token error
