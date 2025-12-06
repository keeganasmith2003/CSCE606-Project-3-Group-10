require 'rails_helper'

RSpec.describe 'TournamentState JavaScript', type: :system, js: true do
  before do
    visit root_path
  end

  describe 'initialization' do
    it 'creates a TournamentState instance' do
      expect(page.evaluate_script('window.tournamentState !== undefined')).to be true
    end

    it 'initializes in Draft Mode by default' do
      is_active = page.evaluate_script('window.tournamentState.isActiveMode()')
      expect(is_active).to be false
    end
  end

  describe '#setBracketMode' do
    it 'sets bracket mode to Active' do
      page.execute_script('window.tournamentState.setBracketMode(true)')
      expect(page.evaluate_script('window.tournamentState.isActiveMode()')).to be true
    end

    it 'sets bracket mode to Draft' do
      page.execute_script('window.tournamentState.setBracketMode(false)')
      expect(page.evaluate_script('window.tournamentState.isActiveMode()')).to be false
    end

    it 'dispatches tournamentStateChanged event' do
      page.execute_script("
        window.testEventFired = false;
        window.addEventListener('tournamentStateChanged', function() {
          window.testEventFired = true;
        });
        window.tournamentState.setBracketMode(true);
      ")

      sleep(0.1)
      event_fired = page.evaluate_script('window.testEventFired')
      expect(event_fired).to be true
    end
  end

  describe '#getBracketModeString' do
    it 'returns "active" when in Active Mode' do
      page.execute_script('window.tournamentState.setBracketMode(true)')
      mode_string = page.evaluate_script('window.tournamentState.getBracketModeString()')
      expect(mode_string).to eq('active')
    end

    it 'returns "draft" when in Draft Mode' do
      page.execute_script('window.tournamentState.setBracketMode(false)')
      mode_string = page.evaluate_script('window.tournamentState.getBracketModeString()')
      expect(mode_string).to eq('draft')
    end
  end

  describe 'event handling' do
    it 'includes correct event detail' do
      page.execute_script("
        window.testEventDetail = null;
        window.addEventListener('tournamentStateChanged', function(e) {
          window.testEventDetail = e.detail;
        });
        window.tournamentState.setBracketMode(true);
      ")

      sleep(0.1)
      event_detail = page.evaluate_script('window.testEventDetail')

      expect(event_detail).to include('changeType', 'bracketMode')
      expect(event_detail['changeType']).to eq('bracketMode')
      expect(event_detail['bracketMode']).to be true
    end
  end

  describe 'integration with BracketManager' do
    it 'BracketManager responds to mode changes' do
      # Initialize a bracket
      page.execute_script("
        window.startNewBracket(['A', 'B', 'C', 'D']);
      ")
      sleep(1)

      # Switch to Active Mode
      page.execute_script('window.tournamentState.setBracketMode(true)')
      sleep(0.5)

      # Check that BracketManager reflects the change
      bracket_manager_mode = page.evaluate_script('window.bracketManager.isDraftMode')
      expect(bracket_manager_mode).to be false

      # Check that UI is updated
      controls_visible = page.evaluate_script("
        var controls = document.getElementById('draft-mode-controls');
        return controls && window.getComputedStyle(controls).display !== 'none';
      ")
      expect(controls_visible).to be false
    end
  end
end

