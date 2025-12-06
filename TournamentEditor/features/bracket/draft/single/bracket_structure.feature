Feature: Bracket Structure and Layout
  As a Tournament Organizer
  I want brackets to be created with correct structure
  So that all competitors are placed uniquely in Round 1

  Background:
    Given I am on the root page
    And the bracket mode is in Draft Mode

  @javascript
  Scenario: 4 competitor balanced bracket structure
    When I enter "4" in the competitor count field
    And I press Enter in the competitor count field
    Then the bracket should have this structure:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
      | 2     | 1     | 1        |              |
      | 2     | 1     | 2        |              |
    And no competitor should face themselves

  @javascript
  Scenario: 8 competitor balanced bracket uses all unique competitors
    When I enter "8" in the competitor count field
    And I press Enter in the competitor count field
    Then the bracket should have this structure:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
      | 1     | 3     | 1        | Competitor 5 |
      | 1     | 3     | 2        | Competitor 6 |
      | 1     | 4     | 1        | Competitor 7 |
      | 1     | 4     | 2        | Competitor 8 |
      | 2     | 1     | 1        |              |
      | 2     | 1     | 2        |              |
      | 2     | 2     | 1        |              |
      | 2     | 2     | 2        |              |
      | 3     | 1     | 1        |              |
      | 3     | 1     | 2        |              |
    And each competitor appears exactly once
    And no competitor should face themselves

  @javascript
  Scenario: 6 competitor unbalanced bracket with BYE slots
    When I enter "6" in the competitor count field
    And I press Enter in the competitor count field
    Then the bracket should have this structure:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
      | 1     | 3     | 1        | Competitor 5 |
      | 1     | 3     | 2        | Competitor 6 |
      | 1     | 4     | 1        | BYE          |
      | 1     | 4     | 2        | BYE          |
      | 2     | 1     | 1        |              |
      | 2     | 1     | 2        |              |
      | 2     | 2     | 1        |              |
      | 2     | 2     | 2        |              |
      | 3     | 1     | 1        |              |
      | 3     | 1     | 2        |              |
    And Round 2 and 3 should have no competitor names

  @javascript
  Scenario: 3 competitor unbalanced bracket structure
    When I enter "3" in the competitor count field
    And I press Enter in the competitor count field
    Then the bracket should have this structure:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | BYE          |
      | 2     | 1     | 1        |              |
      | 2     | 1     | 2        |              |
    And Round 2 should have no competitor names

  @javascript
  Scenario: 2 competitor balanced bracket structure
    When I enter "2" in the competitor count field
    And I press Enter in the competitor count field
    Then the bracket should have rounds:
      | Final |

  @javascript
  Scenario: 3 competitor balanced bracket structure
    When I enter "3" in the competitor count field
    And I press Enter in the competitor count field
    Then the bracket should have rounds:
      | Round 1 | Final |

  @javascript
  Scenario: 8 competitor balanced bracket structure
    When I enter "8" in the competitor count field
    And I press Enter in the competitor count field
    Then the bracket should have rounds:
      | Round 1 | Round 2 | Final |
