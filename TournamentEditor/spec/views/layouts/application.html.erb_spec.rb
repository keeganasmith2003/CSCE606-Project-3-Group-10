require 'rails_helper'

RSpec.describe 'layouts/application.html.erb', type: :view do
  before do
    # Stub the content_for so we can render the layout
    allow(view).to receive(:content_for).with(:head).and_return('')
    allow(view).to receive(:content_for).with(any_args).and_call_original
  end

#   it 'includes CSRF meta tags' do
#     render template: 'layouts/application'
#     expect(rendered).to have_selector('meta[name="csrf-token"]', visible: false)
#   end

  it 'includes viewport meta tag' do
    render template: 'layouts/application'
    expect(rendered).to have_selector('meta[name="viewport"]', visible: false)
  end

  it 'includes title tag' do
    render template: 'layouts/application'
    expect(rendered).to have_selector('title', text: 'TournamentEditor', visible: false)
  end

  it 'includes tailwind stylesheet' do
    render template: 'layouts/application'
    expect(rendered).to include('tailwind')
  end

  it 'includes brackets-viewer CSS' do
    render template: 'layouts/application'
    expect(rendered).to include('brackets-viewer')
  end

  it 'includes tournament_state.js' do
    render template: 'layouts/application'
    expect(rendered).to include('tournament_state.js')
  end

  it 'includes brackets-viewer.js' do
    render template: 'layouts/application'
    expect(rendered).to include('brackets-viewer')
  end

  it 'includes bracket_manager.js' do
    render template: 'layouts/application'
    expect(rendered).to include('bracket_manager.js')
  end

  it 'renders topbar partial' do
    render template: 'layouts/application'
    expect(rendered).to include('Bracketmaker')
  end

  it 'renders sidebar partial' do
    render template: 'layouts/application'
    expect(rendered).to include('Single Elimination')
  end

  it 'has background class' do
    render template: 'layouts/application'
    expect(rendered).to have_selector('body.bg-background', visible: false)
  end

  it 'has main content area' do
    render template: 'layouts/application'
    expect(rendered).to have_selector('main.flex-1', visible: false)
  end

  it 'has proper layout structure' do
    render template: 'layouts/application'
    expect(rendered).to have_selector('.flex.h-screen.pt-20', visible: false)
  end
end
