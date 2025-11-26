Feature: Topbar Component
  As a Visitor
  I want to use the topbar to import and export brackets
  So that I can manage my tournament data effectively

  Scenario: Topbar is rendered on the page
    Given I am on the root page
    Then I should see the topbar component
    And the topbar should contain the "Bracketmaker" title
    And the topbar should contain an "Export Bracket" button
    And the topbar should contain an "Import Bracket" button

  @javascript
  Scenario: Topbar contains dark mode toggle
    Given I am on the root page
    Then I should see a dark mode toggle in the topbar

  @javascript
  Scenario: Topbar contains bracket mode toggle
    Given I am on the root page
    Then I should see the bracket mode toggle in the topbar

