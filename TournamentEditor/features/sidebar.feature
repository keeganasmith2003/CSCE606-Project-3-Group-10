Feature: Sidebar Component
  As a Visitor
  I want to use the sidebar to change views
  So that I can navigate the tournament bracket application effectively

  @javascript
  Scenario: Sidebar is rendered on the page
    Given I am on the root page
    Then I should see the sidebar component
    And the sidebar should contain a "Single Elimination" button

  @javascript
  Scenario: User can toggle sidebar collapse/expand
    Given I am on the root page
    And the sidebar is expanded
    When I click the sidebar toggle button
    Then the sidebar should be collapsed
    When I click the sidebar toggle button again
    Then the sidebar should be expanded

