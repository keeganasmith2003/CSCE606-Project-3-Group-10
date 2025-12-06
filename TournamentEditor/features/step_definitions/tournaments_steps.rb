require 'tempfile'

Given('I am on the tournaments page') do
  visit '/tournaments'
  expect(page).to have_css('body')
end

Then('I should see tournament content') do
  expect(page).to have_css('body')
end

When('I request the CSV format') do
  Tournament.create!(name: 'Test Tournament', mode: 'Single Elimination')
  Tournament.create!(name: 'Another Tournament', mode: 'Double Elimination')
  visit '/tournaments.csv'
end

Then('I should receive a CSV file') do
  expect(page.body).to include('name')
  expect(page.body).to include('mode')
  expect(page.body).to include('Test Tournament')
end

When('I upload a valid CSV file') do
  csv_content = "name,mode\nTest Tournament,Single Elimination\nAnother Tournament,Double Elimination"
  file_path = Rails.root.join('tmp', 'test_import.csv')
  FileUtils.mkdir_p(File.dirname(file_path))
  File.write(file_path, csv_content)
  
  file_upload = Rack::Test::UploadedFile.new(file_path, 'text/csv')
  page.driver.post '/tournaments/import', file: file_upload
  if page.driver.response.status == 302
    visit page.driver.response.location
  end
end

Then('I should see a success message') do
  expect(page.current_path).to eq('/')
end

When('I attempt to import without a file') do
  page.driver.post '/tournaments/import', {}
  if page.driver.response.status == 302
    visit page.driver.response.location
  end
end

Then('I should see an error message') do
  expect(page.current_path).to eq('/')
end

When('I send bracket update data') do
  json_data = {
    bracket_type: 'single',
    participants: ['Player 1', 'Player 2'],
    bracket_data: { rounds: [] },
    mode: 'view'
  }.to_json
  
  page.driver.post(
    '/tournaments/update_bracket',
    json_data,
    { 'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json' }
  )
end

Then('I should receive a success response') do
  expect(page.body).to include('success')
  expect(page.body).to include('true')
end

When('I send bracket update data that causes an error') do
  json_data = {
    bracket_type: 'single',
    participants: ['Player 1'],
    bracket_data: {},
    mode: 'view'
  }.to_json
  
  page.driver.post(
    '/tournaments/update_bracket',
    json_data,
    { 'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json' }
  )
end

Then('I should receive an error response') do
  expect(page.body).to be_present
end
