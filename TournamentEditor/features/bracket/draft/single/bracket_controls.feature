Feature: Bracket Draft Controls
  As a Tournament Organizer
  I want to use draft mode controls
  So that I can create, validate, and confirm brackets

  Background:
    Given I am on the root page
    And the bracket mode is in Draft Mode

  @javascript
  Scenario: Creating bracket with competitor count input
    When I enter "4" in the competitor count field
    And I press Enter in the competitor count field
    Then I should see the bracket viewer
    And the bracket should have this initial structure:
      | round | match | position | competitor   |
      | 1     | 1     | 1        | Competitor 1 |
      | 1     | 1     | 2        | Competitor 2 |
      | 1     | 2     | 1        | Competitor 3 |
      | 1     | 2     | 2        | Competitor 4 |
    And the Draft icon should be visible
    And the Validate button should be visible
    And the Confirm button should be visible
