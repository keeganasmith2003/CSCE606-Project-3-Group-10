Feature: Drag and Drop with Auto-Win
  As a Tournament Organizer
  I want to drag competitors to different rounds
  So that I can manually adjust the bracket with automatic win propagation

  Background:
    Given I am on the root page
    And the bracket mode is in Draft Mode
    And I enter "8" in the competitor count field
    And I press Enter in the competitor count field

  @javascript
  Scenario: Dragging within same round swaps positions
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 1 Match 2 position 1
    Then the bracket should show:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 3 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 1 |
      | 1     | 2     | 2        | Competitor 4 |
      | 1     | 3     | 1        | Competitor 5 |
      | 1     | 3     | 2        | Competitor 6 |
      | 1     | 4     | 1        | Competitor 7 |
      | 1     | 4     | 2        | Competitor 8 |
    And "Competitor 1" should appear only once in Round 1
    And Round 1 Match 1 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "-" in position 2
    And Round 1 Match 2 should show "Competitor 1" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "-" with result "-" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Competitor cannot be placed against themselves
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
    When I drag "Competitor 1" to Round 1 Match 1 position 2
    Then the bracket should show:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 2 |
      | 1     | 1     | 2        | Competitor 1 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
      | 1     | 3     | 1        | Competitor 5 |
      | 1     | 3     | 2        | Competitor 6 |
      | 1     | 4     | 1        | Competitor 7 |
      | 1     | 4     | 2        | Competitor 8 |
    And "Competitor 1" should not face themselves in any match
    And Round 1 Match 1 should show "Competitor 2" with result "-" in position 1
    And Round 1 Match 1 should show "Competitor 1" with result "-" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "-" with result "-" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Swap within same match
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
    When I drag "Competitor 1" to Round 1 Match 1 position 2
    Then the bracket should show:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 2 |
      | 1     | 1     | 2        | Competitor 1 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
      | 1     | 3     | 1        | Competitor 5 |
      | 1     | 3     | 2        | Competitor 6 |
      | 1     | 4     | 1        | Competitor 7 |
      | 1     | 4     | 2        | Competitor 8 |
    And Round 1 Match 1 should show "Competitor 2" with result "-" in position 1
    And Round 1 Match 1 should show "Competitor 1" with result "-" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "-" with result "-" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Cross-match swap in same round
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
      | 1     | 3     | 1        | Competitor 5 |
      | 1     | 3     | 2        | Competitor 6 |
    When I drag "Competitor 3" to Round 1 Match 3 position 1
    Then the bracket should show:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 5 |
      | 1     | 2     | 2        | Competitor 4 |
      | 1     | 3     | 1        | Competitor 3 |
      | 1     | 3     | 2        | Competitor 6 |
      | 1     | 4     | 1        | Competitor 7 |
      | 1     | 4     | 2        | Competitor 8 |
    And Round 1 Match 1 should show "Competitor 1" with result "-" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "-" in position 2
    And Round 1 Match 2 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 1 Match 3 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2

  @javascript
  Scenario: Forward propagation with win assignment
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
    When I drag "Competitor 1" to Round 3 Match 1 position 1
    Then "Competitor 1" should have wins in Round 1 Match 1 and Round 2 Match 1
    And "Competitor 1" should appear in Round 1 Match 1 and Round 2 Match 1
    And Round 1 Match 1 should show "Competitor 1" with result "W" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "L" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "Competitor 1" with result "W" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "Competitor 1" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Second forward propagation
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 4     | 1        | Competitor 7 |
      | 1     | 4     | 2        | Competitor 8 |
    When I drag "Competitor 8" to Round 3 Match 1 position 2
    Then "Competitor 8" should have wins in Round 1 Match 4 and Round 2 Match 2
    And Round 1 Match 4 should show "Competitor 8" with result "W" in position 1
    And Round 1 Match 4 should show "Competitor 7" with result "L" in position 2
    And Round 1 Match 1 should show "Competitor 1" with result "-" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "-" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 2 Match 1 should show "-" with result "-" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 2 Match 2 should show "Competitor 8" with result "W" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "Competitor 8" with result "-" in position 2

  @javascript
  Scenario: Win reassignment within same branch
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
    When I drag "Competitor 1" to Round 2 Match 1 position 1
    Then "Competitor 1" should appear in Round 1 Match 1 and Round 2 Match 1
    And Round 1 Match 1 should show "Competitor 1" with result "W" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "L" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "Competitor 1" with result "-" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Multiple swaps and propagations
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 2 Match 1 position 1
    And I drag "Competitor 3" to Round 2 Match 1 position 2
    Then each competitor should appear exactly once in Round 1
    And no competitor should face themselves in any match
    And Round 1 Match 1 should show "Competitor 1" with result "W" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "L" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "W" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "L" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "Competitor 1" with result "-" in position 1
    And Round 2 Match 1 should show "Competitor 3" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Drag competitors to round 2 and verify results
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 2 Match 1
    And I drag "Competitor 3" to Round 2 Match 1
    Then Round 1 Match 1 should show "Competitor 1" with result "W" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "L" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "W" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "L" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "Competitor 1" with result "-" in position 1
    And Round 2 Match 1 should show "Competitor 3" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Drag competitor 1 to final and competitor 3 to round 2
    Given the initial bracket has:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 3 Match 1 position 1
    And I drag "Competitor 3" to Round 2 Match 1 position 2
    Then Round 1 Match 1 should show "Competitor 1" with result "W" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "L" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "W" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "L" in position 2
    And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
    And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
    And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
    And Round 2 Match 1 should show "Competitor 1" with result "W" in position 1
    And Round 2 Match 1 should show "Competitor 3" with result "L" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "Competitor 1" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Drag Competitor 1 to Round 2 Match 1, then Competitor 3 to Round 2 Match 1, then Compeitor 2 to Round 2 Match 1
    Given the initial bracket has:
        | round | match | position | competitor   |
        | 1     | 1     | 1        | Competitor 1 |
        | 1     | 1     | 2        | Competitor 2 |
        | 1     | 2     | 1        | Competitor 3 |
        | 1     | 2     | 2        | Competitor 4 |
      When I drag "Competitor 1" to Round 2 Match 1 position 1
      And I drag "Competitor 3" to Round 2 Match 1 position 2
      And I drag "Competitor 2" to Round 2 Match 1 position 1
      Then Round 1 Match 1 should show "Competitor 2" with result "W" in position 1
      And Round 1 Match 1 should show "Competitor 1" with result "L" in position 2
      And Round 1 Match 2 should show "Competitor 3" with result "W" in position 1
      And Round 1 Match 2 should show "Competitor 4" with result "L" in position 2
      And Round 2 Match 1 should show "Competitor 2" with result "-" in position 1
      And Round 2 Match 1 should show "Competitor 3" with result "-" in position 2
      And Round 1 Match 3 should show "Competitor 5" with result "-" in position 1
      And Round 1 Match 3 should show "Competitor 6" with result "-" in position 2
      And Round 1 Match 4 should show "Competitor 7" with result "-" in position 1
      And Round 1 Match 4 should show "Competitor 8" with result "-" in position 2
      And Round 2 Match 2 should show "-" with result "-" in position 1
      And Round 2 Match 2 should show "-" with result "-" in position 2
      And Round 3 Match 1 should show "-" with result "-" in position 1
      And Round 3 Match 1 should show "-" with result "-" in position 2
  
  @javascript
  Scenario: Drag Competitor to another match where its Round 1 position is not in the same branch
    Given the initial bracket has:
        | round | match | position | competitor   |
        | 1     | 1     | 1        | Competitor 1 |
        | 1     | 1     | 2        | Competitor 2 |
        | 1     | 2     | 1        | Competitor 3 |
        | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 3 Match 1 position 1
    And I drag "Competitor 1" to Round 1 Match 4 position 2
    Then Round 1 Match 1 should show "Competitor 8" with result "-" in position 1
    And Round 1 Match 1 should show "Competitor 2" with result "-" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 4 should show "Competitor 1" with result "-" in position 2
    And Round 2 Match 1 should show "-" with result "-" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 2 Match 2 should show "-" with result "-" in position 1
    And Round 2 Match 2 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Drag Competitors to Final Round that can't be in the Final Round
    Given the initial bracket has:
        | round | match | position | competitor   |
        | 1     | 1     | 1        | Competitor 1 |
        | 1     | 1     | 2        | Competitor 2 |
        | 1     | 2     | 1        | Competitor 3 |
        | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 3 Match 1 position 1
    And I drag "Competitor 3" to Round 3 Match 1 position 2
    Then Round 2 Match 1 should show "Competitor 3" with result "W" in position 2
    And Round 2 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "Competitor 3" with result "-" in position 2
    And Round 3 Match 1 should show "-" with result "-" in position 1
  
  @javascript
  Scenario: Drag 3 Competitors to Final Round that can't be in the Final Round
    Given the initial bracket has:
        | round | match | position | competitor   |
        | 1     | 1     | 1        | Competitor 1 |
        | 1     | 1     | 2        | Competitor 2 |
        | 1     | 2     | 1        | Competitor 3 |
        | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 3 Match 1 position 1
    And I drag "Competitor 3" to Round 3 Match 1 position 2
    And I drag "Competitor 2" to Round 3 Match 1 position 1
    Then Round 1 Match 1 should show "Competitor 2" with result "W" in position 1
    And Round 1 Match 1 should show "Competitor 1" with result "L" in position 2
    And Round 1 Match 2 should show "Competitor 3" with result "-" in position 1
    And Round 1 Match 2 should show "Competitor 4" with result "-" in position 2
    And Round 2 Match 1 should show "Competitor 2" with result "W" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 3 Match 1 should show "Competitor 2" with result "-" in position 1
    And Round 3 Match 1 should show "-" with result "-" in position 2

  @javascript
  Scenario: Drag 2 Competitors to Final Round from Same Round 1 in 8 Competitor bracket
    Given the initial bracket has:
        | round | match | position | competitor   |
        | 1     | 1     | 1        | Competitor 1 |
        | 1     | 1     | 2        | Competitor 2 |
        | 1     | 2     | 1        | Competitor 3 |
        | 1     | 2     | 2        | Competitor 4 |
    When I drag "Competitor 1" to Round 3 Match 1 position 1
    And I drag "Competitor 2" to Round 3 Match 1 position 2
    Then Round 3 Match 1 should show "-" with result "-" in position 1
    And Round 3 Match 1 should show "Competitor 2" with result "-" in position 2
    And Round 2 Match 1 should show "Competitor 2" with result "W" in position 1
    And Round 2 Match 1 should show "-" with result "-" in position 2
    And Round 1 Match 1 should show "Competitor 2" with result "W" in position 1
    And Round 1 Match 1 should show "Competitor 1" with result "L" in position 2
    