require 'rails_helper'

RSpec.describe 'partials/_bracket_mode_toggle.html.erb', type: :view do
  it 'renders bracket mode toggle button' do
    render
    expect(rendered).to have_selector('#bracket-mode-toggle')
  end

  it 'includes Active Mode label' do
    render
    expect(rendered).to have_selector('.bracket-mode-active-label')
  end

  it 'includes Draft Mode label' do
    render
    expect(rendered).to have_selector('.bracket-mode-draft-label')
  end

  it 'has proper ARIA labels' do
    render
    expect(rendered).to have_selector('[aria-label]')
  end

  it 'includes JavaScript initialization' do
    render
    expect(rendered).to include('window.bracketModeToggleInitialized')
  end

  it 'includes updateBracketModeUI function' do
    render
    expect(rendered).to include('function updateBracketModeUI(')
  end
end

