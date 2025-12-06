Feature: Draft Mode Controls and Functionality
  As a Tournament Organizer
  I want to use the complete Draft Mode interface
  So that I can efficiently create and manage tournament brackets

  Background:
    Given I am on the root page
    And the bracket mode is in Draft Mode

  @javascript
  Scenario: Competitor count input creates bracket
    When I enter "4" in the competitor count field
    And I press Enter in the competitor count field
    Then I should see the bracket viewer
    And the bracket should have this structure:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
    And the Draft icon should be visible
    And the competitor count input should be visible
    And the Reset button should be visible
    And the Validate button should be visible
    And the Confirm button should be visible

  @javascript
  Scenario: Reset button clears bracket to Round 1
    Given I enter "4" in the competitor count field
    And I press Enter in the competitor count field
    When I drag "Competitor 1" from Round 1 Match 1 position 1 to Round 2 Match 1 position 1
    And I click the Reset button
    Then the bracket should be reset to Round 1
    And "Competitor 1" should appear only once in Round 1

  @javascript
  Scenario: Competitor list is visible in Draft Mode
    When I enter "4" in the competitor count field
    And I press Enter in the competitor count field
    Then the competitor list should be visible

  @javascript
  Scenario: BYE is displayed for unbalanced brackets
    When I enter "3" in the competitor count field
    And I press Enter in the competitor count field
    Then Round 1 Match 2 position 2 should display "BYE"

  @javascript
  Scenario: Empty slots display dash
    When I enter "4" in the competitor count field
    And I press Enter in the competitor count field
    Then Round 2 Match 1 position 1 should display "-"
    And Round 2 Match 1 position 2 should display "-"

  @javascript
  Scenario: Forward drag shows W for auto-wins
    Given I enter "8" in the competitor count field
    And I press Enter in the competitor count field
    When I drag "Competitor 1" from Round 1 Match 1 position 1 to Round 3 Match 1 position 1
    Then "Competitor 1" should show "W" for all previous rounds

  @javascript
  Scenario: Opponent gets L when competitor gets auto-win
    Given I enter "8" in the competitor count field
    And I press Enter in the competitor count field
    When I drag "Competitor 1" from Round 1 Match 1 position 1 to Round 2 Match 1 position 1
    Then "Competitor 2" should display "L" in their score

