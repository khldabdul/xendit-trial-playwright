@epic:PaymentLinks
Feature: Payment Links
  As a merchant
  I want to create payment links and have customers pay them
  So that I can collect revenue

  Background:
    Given I have a Xendit API client

  @TC01_UI @ui @smoke
  Scenario: Verify standard end-to-end creation and payment completion
    When I create a Payment Link via API with valid amount and description
    And I open the generated checkout URL
    And I expand the Credit/Debit Card accordion
    And I fill card details using test card "SUCCESS_3DS"
    And I click Pay Now
    And I handle 3DS OTP iframe authentication
    Then I should see the success confirmation page

  @TC02_UI @ui
  Scenario: Verify creation of Payment Link with all optional fields
    When I create a Payment Link via API with items, customer details, and a Custom Link ID
    And I open the generated checkout URL
    Then I should see the item name on the checkout page

  @TC03_UI @ui
  Scenario: Verify creation and payment of an Open Amount (Donation) link
    When I create a Payment Link via API without an amount field
    And I open the generated checkout URL
    And I fill in a customer-specified amount of 100000
    And I fill card details using test card "SUCCESS_3DS"
    And I click Pay Now
    And I handle 3DS OTP iframe authentication
    Then I should see the success confirmation page

  @TC04_UI @api @negative
  Scenario: Verify validation on missing mandatory fields
    When I attempt to create a Payment Link via API without an amount but with custom link ID
    Then the API should return a 400 validation error

  @TC05_UI @api @negative
  Scenario Outline: Verify validation on invalid amounts
    When I attempt to create a Payment Link via API with amount <amount>
    Then the API should return a 400 validation error

    Examples:
      | amount        |
      |             0 |
      |         -5000 |
      | 9999999999999 |

  @TC06_UI @api @negative
  Scenario: Verify error when using duplicate Custom Link ID
    Given I have created a Payment Link with a unique Custom Link ID
    When I attempt to create another Payment Link with the exact same Custom Link ID
    Then the API should return a 400 error indicating a duplicate conflict

  @TC07_UI @ui @negative
  Scenario: Verify interaction with an expired Payment Link
    When I create a Payment Link via API with a 1 second expiry
    And I wait for 3 seconds
    And I open the generated checkout URL
    Then I should see an expired link error state on the checkout page

  @TC19_UI @ui @negative
  Scenario: Verify payment decline flow with known-decline test card
    When I create a Payment Link via API with valid amount and description
    And I open the generated checkout URL
    And I expand the Credit/Debit Card accordion
    And I fill card details using test card "DECLINED"
    And I click Pay Now
    Then I should see a payment declined message on the checkout page
