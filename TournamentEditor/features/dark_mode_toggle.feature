Feature: Dark Mode Toggle
  As a user
  I want to toggle dark mode on the style guide page
  So that I can view the page in different color themes

  @javascript
  Scenario: User toggles dark mode on
    Given I am on the style guide page
    When I click the dark mode toggle button
    Then the page should be in dark mode
    When I click the dark mode toggle button again
    Then the page should be in light mode

