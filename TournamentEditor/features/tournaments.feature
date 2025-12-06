Feature: Tournaments Management
  As a User
  I want to manage tournaments
  So that I can work with tournament data

  Scenario: View tournaments index page
    Given I am on the tournaments page
    Then I should see tournament content

  Scenario: Export tournaments as CSV
    Given I am on the tournaments page
    When I request the CSV format
    Then I should receive a CSV file

  Scenario: Import tournaments with valid file
    Given I am on the tournaments page
    When I upload a valid CSV file
    Then I should see a success message

  Scenario: Import tournaments without file
    Given I am on the tournaments page
    When I attempt to import without a file
    Then I should see an error message

  Scenario: Update bracket data successfully
    Given I am on the tournaments page
    When I send bracket update data
    Then I should receive a success response

  Scenario: Update bracket with error
    Given I am on the tournaments page
    When I send bracket update data that causes an error
    Then I should receive an error response
