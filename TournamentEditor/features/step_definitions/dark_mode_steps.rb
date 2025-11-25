Given('I am on the style guide page') do
  visit '/style'
  expect(page).to have_content('Tailwind CSS Style Guide')
end

When('I click the dark mode toggle button') do
  click_button 'Toggle Dark Mode'
end

When('I click the dark mode toggle button again') do
  click_button 'Toggle Dark Mode'
end

Then('the page should be in dark mode') do
  # Check that the html element has the 'dark' class
  expect(page).to have_css('html.dark', visible: false)
end

Then('the page should be in light mode') do
  # Check that the html element does not have the 'dark' class
  expect(page).to have_no_css('html.dark', visible: false)
end

