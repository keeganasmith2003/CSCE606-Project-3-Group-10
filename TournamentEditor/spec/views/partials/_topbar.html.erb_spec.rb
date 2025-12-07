require 'rails_helper'

RSpec.describe 'partials/_topbar.html.erb', type: :view do
  it 'displays Bracketmaker title' do
    render
    expect(rendered).to have_content('Bracketmaker')
  end

  it 'includes Export Bracket button' do
    render
    expect(rendered).to have_button('Export Bracket')
  end

  it 'includes Import Bracket button' do
    render
    expect(rendered).to have_button('Import Bracket')
  end

  it 'includes file input for CSV' do
    render
    expect(rendered).to have_selector('input[type="file"]#csvFile')
  end

  it 'includes dark mode toggle' do
    render
    expect(view).to render_template(partial: 'partials/_dark_mode_toggle')
  end

  it 'includes bracket mode toggle' do
    render
    expect(view).to render_template(partial: 'partials/_bracket_mode_toggle')
  end

  it 'has mobile menu toggle' do
    render
    expect(rendered).to have_selector('#mobile-menu-toggle')
  end

  it 'has mobile menu overlay' do
    render
    expect(rendered).to have_selector('#mobile-menu-overlay')
  end

  it 'has mobile menu sheet' do
    render
    expect(rendered).to have_selector('#mobile-menu-sheet')
  end

  it 'includes ExportBracket JavaScript function' do
    render
    expect(rendered).to include('function ExportBracket()')
  end

  it 'includes ImportBracket JavaScript function' do
    render
    expect(rendered).to include('function ImportBracket()')
  end

  it 'includes toggleMobileMenu JavaScript function' do
    render
    expect(rendered).to include('function toggleMobileMenu()')
  end
end
