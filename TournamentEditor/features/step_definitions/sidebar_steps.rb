Given('I am on the root page') do
  visit '/'
  if page.driver.is_a?(Capybara::Selenium::Driver)
    page.execute_script('if (typeof localStorage !== "undefined") localStorage.clear();')
    sleep(0.2)
  end
  expect(page).to have_content('Bracketmaker')
end

Then('I should see the sidebar component') do
  expect(page).to have_css('#sidebar')
end

Then('the sidebar should contain a {string} button') do |button_text|
  within('#sidebar') do
    expect(page).to have_button(button_text)
  end
end

Given('the sidebar is expanded') do
  sidebar = find('#sidebar')
  expect(sidebar['data-collapsed']).to eq('false')
end

When('I click the sidebar toggle button') do
  page.execute_script("toggleSidebar()")
  sleep(0.5)
end

When('I click the sidebar toggle button again') do
  page.execute_script("toggleSidebar()")
  sleep(0.5)
end

Then('the sidebar should be collapsed') do
  sidebar = find('#sidebar')
  expect(sidebar['data-collapsed']).to eq('true')
  width = page.evaluate_script("document.getElementById('sidebar').style.width")
  expect(width).to match(/5%/)
end

Then('the sidebar should be expanded') do
  sidebar = find('#sidebar')
  expect(sidebar['data-collapsed']).to eq('false')
  width = page.evaluate_script("document.getElementById('sidebar').style.width")
  expect(width).to match(/20%/)
end

