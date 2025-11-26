Then('I should see the topbar component') do
  expect(page).to have_css('header')
  expect(page).to have_content('Bracketmaker')
end

Then('the topbar should contain the {string} title') do |title|
  within('header') do
    expect(page).to have_content(title)
  end
end

Then('the topbar should contain an {string} button') do |button_text|
  within('header') do
    expect(page).to have_button(button_text)
  end
end

Then('I should see a dark mode toggle in the topbar') do
  within('header') do
    expect(page).to have_css('.dark-mode-toggle')
  end
end

