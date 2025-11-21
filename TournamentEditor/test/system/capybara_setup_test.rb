require "application_system_test_case"

class CapybaraSetupTest < ApplicationSystemTestCase
  test "Capybara can visit a page and interact with elements" do
    # Visit the style page
    visit style_path
    
    # Assert page content is present
    assert_text "Tailwind CSS Style Guide"
    assert_text "Complete showcase of all custom styles"
    
    # Find and interact with the dark mode toggle button
    button = find("#darkModeToggle")
    assert button.present?
    
    # Click the button
    click_on "Toggle Dark Mode"
    
    # Verify the button is still present after click
    assert_button "Toggle Dark Mode"
  end

  test "Capybara can fill in form fields" do
    visit style_path
    
    # Find the text input field
    text_input = find("input[type='text']")
    assert text_input.present?
    
    # Fill in the input field using Capybara DSL
    text_input.set("Test input value")
    
    # Verify the value was set
    assert_equal "Test input value", text_input.value
  end

  test "Capybara can interact with textarea" do
    visit style_path
    
    # Find the textarea
    textarea = find("textarea")
    assert textarea.present?
    
    # Fill in the textarea using Capybara DSL
    textarea.set("Test textarea content")
    
    # Verify the value was set
    assert_equal "Test textarea content", textarea.value
  end

  test "Capybara can find elements by CSS selectors" do
    visit style_path
    
    # Find elements using CSS selectors
    assert_selector "h1", text: "Tailwind CSS Style Guide"
    assert_selector ".bg-primary", minimum: 1
    assert_selector "button", minimum: 1
    
    # Verify specific sections exist
    assert_selector "section", minimum: 1
  end

  test "Capybara can check page has expected content" do
    visit style_path
    
    # Check for various content types
    assert_text "Background & Foreground"
    assert_text "Card Styles"
    assert_text "Primary Colors"
    assert_text "Input Styles"
    
    # Verify buttons are clickable
    assert_button "Toggle Dark Mode"
  end
end

