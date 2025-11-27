Feature: Bracket Draft Mode
  As a Visitor
  I want to organize my tournament bracket manually in Draft Mode
  So that I can update the bracket directly with validation

  Background:
    Given I am on the root page

  @javascript
  Scenario: Bracket visualization component is displayed
    When I start a Single Elimination bracket with 4 competitors
    Then I should see the bracket viewer container
    And I should see the bracket visualization

  @javascript
  Scenario: Draft Mode toggle is present
    Then I should see the bracket mode toggle in the topbar
    And the bracket mode toggle should display "Active Mode"

  @javascript
  Scenario: Starting a new Single Elimination bracket
    When I click the Single Elimination button
    And I enter "4" competitors
    Then I should see the bracket viewer container
    And I should see 4 competitors in the bracket
    And I should be in Draft Mode

  @javascript
  Scenario: Draft Mode controls are shown when in Draft Mode
    Given I start a Single Elimination bracket with 4 competitors
    And the bracket mode is in Draft Mode
    Then I should see the draft mode controls
    And I should see the Validate button
    And I should see the Confirm Changes button

  @javascript
  Scenario: Draft Mode controls are hidden when in Active Mode
    Given I start a Single Elimination bracket with 4 competitors
    And the bracket mode is in Active Mode
    Then I should not see the draft mode controls

  @javascript
  Scenario: Competitors can be moved in Draft Mode via drag-and-drop
    Given I start a Single Elimination bracket with 4 competitors
    And the bracket mode is in Draft Mode
    When I drag a competitor to another position
    Then the bracket structure should update visually

  @javascript
  Scenario: Validation prevents invalid moves
    Given I start a Single Elimination bracket with 4 competitors
    And the bracket mode is in Draft Mode
    When I attempt an invalid bracket move
    Then the move should be prevented
    And I should see validation feedback

  @javascript
  Scenario: Confirm Changes button saves bracket state to local storage
    Given I start a Single Elimination bracket with 4 competitors
    And the bracket mode is in Draft Mode
    When I click the Confirm Changes button
    Then the bracket state should be saved to local storage
    And I should see a confirmation message

  @javascript
  Scenario: Bracket state is loaded from local storage on page load
    Given I have a saved bracket in local storage
    When I refresh the page
    Then I should see the bracket viewer container
    And the bracket should be loaded from local storage

  @javascript
  Scenario: Visual feedback during drag operation
    Given I start a Single Elimination bracket with 4 competitors
    And the bracket mode is in Draft Mode
    When I start dragging a competitor
    Then I should see visual feedback for the drag operation
    And I should see highlighting on valid drop zones

  @javascript
  Scenario: Empty state is shown when no bracket exists
    When I am on the root page
    Then I should see the empty state message
    And the empty state should prompt me to create a bracket

