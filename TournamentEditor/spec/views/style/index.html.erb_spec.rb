require 'rails_helper'

RSpec.describe 'style/index.html.erb', type: :view do
  it 'displays the style guide title' do
    render
    expect(rendered).to have_content('Tailwind CSS Style Guide')
  end

  it 'includes dark mode toggle' do
    render
    expect(rendered).to have_selector('.dark-mode-toggle')
  end

  it 'displays color sections' do
    render
    expect(rendered).to have_content('Background & Foreground')
    expect(rendered).to have_content('Primary Colors')
    expect(rendered).to have_content('Card Styles')
  end

  it 'includes example code snippets' do
    render
    expect(rendered).to have_selector('code')
  end

  it 'displays usage examples' do
    render
    expect(rendered).to have_content('Usage Examples')
  end
end
