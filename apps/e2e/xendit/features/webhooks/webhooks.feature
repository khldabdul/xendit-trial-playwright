@epic:Webhooks
Feature: Webhooks
  As a Xendit integration
  I want to receive and process webhooks
  So that I can react to payment events

  Background:
    Given I have a Xendit API client

  @TC17_WH @api @webhook
  Scenario: Verify PAID webhook after successful VA payment
    When I create an invoice via API
    And I simulate a VA payment for that invoice
    And I poll webhook.site for incoming "PAID" webhook matching the external ID
    Then the webhook payload should contain the correct status and ID

  @TC18_WH @api @webhook
  Scenario: Verify webhook is NOT fired for a PENDING invoice
    When I create an invoice via API
    And I poll webhook.site for 30 seconds
    Then no webhook should be received
