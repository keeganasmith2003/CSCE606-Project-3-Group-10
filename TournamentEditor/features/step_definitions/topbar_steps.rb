Then('I should see the topbar component') do
  expect(page).to have_css('header')
end

Then('the topbar should contain the {string} title') do |title_text|
  within('header') do
    expect(page).to have_content(title_text)
  end
end

Then('the topbar should contain an {string} button') do |button_text|
  within('header') do
    has_link = page.has_link?(button_text, visible: false)
    has_button = page.has_button?(button_text, visible: false)
    expect(has_link || has_button).to be true
  end
end

Then('I should see a dark mode toggle in the topbar') do
  sleep(0.5)
  if page.driver.browser.respond_to?(:manage)
    page.driver.browser.manage.window.resize_to(1280, 720)
    sleep(0.3)
  end
  within('header') do
    expect(page).to have_css('.dark-mode-toggle', visible: true)
  end
end

