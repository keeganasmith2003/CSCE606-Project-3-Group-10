require 'rails_helper'

RSpec.describe 'partials/_sidebar.html.erb', type: :view do
  it 'renders the sidebar element' do
    render
    expect(rendered).to have_selector('#sidebar')
  end

  it 'includes sidebar toggle button' do
    render
    expect(rendered).to have_selector('#sidebar-toggle')
  end

  it 'includes Single Elimination button' do
    render
    expect(rendered).to have_button('Single Elimination')
  end

  it 'has toggleSidebar JavaScript function' do
    render
    expect(rendered).to include('function toggleSidebar()')
  end

  it 'has startSingleEliminationBracket JavaScript function' do
    render
    expect(rendered).to include('function startSingleEliminationBracket()')
  end

  it 'has proper data attributes' do
    render
    expect(rendered).to have_selector('#sidebar[data-collapsed]')
  end

  it 'includes chevron icons' do
    render
    expect(rendered).to have_selector('#sidebar-chevron-left')
    expect(rendered).to have_selector('#sidebar-chevron-right')
  end
end
