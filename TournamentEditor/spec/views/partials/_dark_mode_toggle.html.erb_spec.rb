require 'rails_helper'

RSpec.describe 'partials/_dark_mode_toggle.html.erb', type: :view do
  it 'renders dark mode toggle button' do
    render
    expect(rendered).to have_selector('.dark-mode-toggle')
  end

  it 'includes moon icon for light mode' do
    render
    expect(rendered).to have_selector('.dark-mode-moon-icon')
  end

  it 'includes sun icon for dark mode' do
    render
    expect(rendered).to have_selector('.dark-mode-sun-icon')
  end

  it 'has proper ARIA labels' do
    render
    expect(rendered).to have_selector('[aria-label="Toggle dark mode"]')
  end

  it 'includes JavaScript initialization' do
    render
    expect(rendered).to include('window.darkModeToggleInitialized')
  end

  it 'includes updateDarkModeIcons function' do
    render
    expect(rendered).to include('function updateDarkModeIcons()')
  end
end
