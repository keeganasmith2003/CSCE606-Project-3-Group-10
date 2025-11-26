Feature: Bracket Mode Toggle
  As a Visitor
  I want to toggle between Draft and Active Mode
  So that I can switch between Bracket Modes

  @javascript
  Scenario: Bracket mode toggle is rendered in the topbar
    Given I am on the root page
    Then I should see the bracket mode toggle in the topbar
    And the bracket mode toggle should display "Active Mode"

  @javascript
  Scenario: User toggles from Draft Mode to Active Mode
    Given I am on the root page
    And the bracket mode is in Draft Mode
    When I click the bracket mode toggle button
    Then the bracket mode should be Active Mode
    And the bracket mode toggle should display "Draft Mode"

  @javascript
  Scenario: User toggles from Active Mode to Draft Mode
    Given I am on the root page
    And the bracket mode is in Active Mode
    When I click the bracket mode toggle button
    Then the bracket mode should be Draft Mode
    And the bracket mode toggle should display "Active Mode"

  @javascript
  Scenario: Bracket mode toggle is present in mobile menu
    Given I am on the root page
    When I open the mobile menu
    Then I should see the bracket mode toggle in the mobile menu

