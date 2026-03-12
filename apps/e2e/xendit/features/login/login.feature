@login
Feature: Merchant Dashboard Login
  As a merchant
  I want to log in to the Xendit Dashboard
  So that I can manage my payment links and settings

  Background:
    Given I navigate to the Xendit Merchant Dashboard login page

  @TC01_AUTH @ui @smoke
  Scenario: Successful login with valid credentials and TOTP
    When I enter my valid credentials
    And I enter my 2FA code generated via TOTP
    Then I should be successfully logged in
    And I should see the Dashboard page

  @TC02_AUTH @ui @negative
  Scenario: Failed login with invalid credentials
    When I enter invalid credentials
    Then I should see an error message indicating invalid login

  @TC03_AUTH @ui @negative
  Scenario: Failed login with invalid TOTP code
    When I enter my valid credentials
    And I enter an invalid 2FA code
    Then I should see an error message indicating invalid verification code
