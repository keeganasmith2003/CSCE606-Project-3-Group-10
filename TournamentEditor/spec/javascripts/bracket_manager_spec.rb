require 'rails_helper'

RSpec.describe 'BracketManager JavaScript', type: :system, js: true do
  before do
    visit root_path
    # Ensure Draft Mode is enabled
    page.execute_script("
      if (window.tournamentState && window.tournamentState.isActiveMode()) {
        window.tournamentState.setBracketMode(false);
      }
    ")
  end

  describe 'initialization' do
    it 'creates a BracketManager instance' do
      expect(page.evaluate_script('window.bracketManager !== undefined')).to be true
      expect(page.evaluate_script('window.bracketManager.isDraftMode')).to be true
    end

    it 'initializes with empty bracket data' do
      bracket_data = page.evaluate_script('window.bracketManager.bracketData')
      expect(bracket_data).to be_nil
    end
  end

  describe '#getNextPowerOfTwo' do
    it 'returns correct power of two for various inputs' do
      expect(page.evaluate_script('window.bracketManager.getNextPowerOfTwo(3)')).to eq(4)
      expect(page.evaluate_script('window.bracketManager.getNextPowerOfTwo(5)')).to eq(8)
      expect(page.evaluate_script('window.bracketManager.getNextPowerOfTwo(8)')).to eq(8)
      expect(page.evaluate_script('window.bracketManager.getNextPowerOfTwo(9)')).to eq(16)
    end
  end

  describe '#initializeBracket' do
    it 'creates bracket with correct number of participants' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)

      participants_count = page.evaluate_script('window.bracketManager.bracketData.participants.length')
      expect(participants_count).to be >= 4  # At least 4 participants + BYE
    end

    it 'pads to next power of two' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C'])")
      sleep(0.5)

      competitors_count = page.evaluate_script('window.bracketManager.competitors.length')
      expect(competitors_count).to eq(4)  # Padded to 4 (next power of 2 from 3)
    end
  end

  describe '#generateSingleEliminationBracket' do
    it 'creates correct number of rounds' do
      page.execute_script("
        var competitors = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        window.bracketManager.initializeBracket(competitors);
      ")
      sleep(0.5)

      rounds = page.evaluate_script("
        var matches = window.bracketManager.bracketData.matches;
        var rounds = new Set();
        matches.forEach(function(m) { rounds.add(m.round_id); });
        return Array.from(rounds).length;
      ")

      expect(rounds).to eq(3)  # 8 competitors = 3 rounds
    end

    it 'includes BYE participant' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C'])")
      sleep(0.5)

      has_bye = page.evaluate_script("
        var participants = window.bracketManager.bracketData.participants;
        return participants.some(function(p) { return p.name === 'BYE'; });
      ")

      expect(has_bye).to be true
    end

    it 'creates matches with proper structure' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)

      first_match = page.evaluate_script("window.bracketManager.bracketData.matches[0]")

      expect(first_match).to include('id', 'stage_id', 'round_id', 'opponent1', 'opponent2')
      expect(first_match['opponent1']).to include('id', 'position', 'score', 'result')
    end
  end

  describe '#resetBracket' do
    it 'resets bracket to initial state' do
      # Create bracket
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)

      # Modify bracket state (simulate drag)
      page.execute_script("
        window.bracketManager.bracketData.matches[0].opponent1.score = 'W';
      ")

      # Reset
      page.execute_script("
        window.confirm = function() { return true; };
        window.bracketManager.resetBracket();
      ")
      sleep(0.5)

      # Check that modification is gone
      score = page.evaluate_script("window.bracketManager.bracketData.matches[0].opponent1.score")
      expect(score).to be_nil
    end
  end

  describe '#findParticipantByName' do
    before do
      page.execute_script("window.bracketManager.initializeBracket(['Alice', 'Bob', 'Charlie', 'David'])")
      sleep(0.5)
    end

    it 'finds participant by exact name' do
      participant = page.evaluate_script("window.bracketManager.findParticipantByName('Alice')")
      expect(participant['name']).to eq('Alice')
    end

    it 'returns null for non-existent participant' do
      participant = page.evaluate_script("window.bracketManager.findParticipantByName('Zoe')")
      expect(participant).to be_nil
    end
  end

  describe '#findParticipantLocation' do
    before do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)
    end

    it 'finds participant location in Round 1' do
      participant_id = page.evaluate_script("window.bracketManager.bracketData.participants[1].id")
      location = page.evaluate_script("window.bracketManager.findParticipantLocation(#{participant_id})")

      expect(location).not_to be_nil
      expect(location['round']).to eq(1)
      expect(location['matchId']).to be_a(Integer)
    end

    it 'returns null for unplaced participant' do
      location = page.evaluate_script("window.bracketManager.findParticipantLocation(999)")
      expect(location).to be_nil
    end
  end

  describe 'Draft Mode UI' do
    it 'shows draft controls in Draft Mode' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)

      controls_visible = page.evaluate_script("
        var controls = document.getElementById('draft-mode-controls');
        return controls && window.getComputedStyle(controls).display !== 'none';
      ")

      expect(controls_visible).to be true
    end

    it 'shows competitor list container in Draft Mode' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)

      list_visible = page.evaluate_script("
        var list = document.getElementById('competitor-list-container');
        return list && window.getComputedStyle(list).display !== 'none';
      ")

      expect(list_visible).to be true
    end
  end

  describe 'localStorage persistence' do
    it 'saves bracket state to localStorage' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)

      saved_state = page.evaluate_script("localStorage.getItem('tournament_bracket_state')")
      expect(saved_state).not_to be_nil

      parsed_state = JSON.parse(saved_state)
      expect(parsed_state).to include('bracketData', 'competitors', 'mode')
    end

    it 'loads bracket state from localStorage' do
      # Save a bracket
      page.execute_script("window.bracketManager.initializeBracket(['X', 'Y', 'Z', 'W'])")
      sleep(0.5)

      # Reload page
      visit root_path
      sleep(1.5)

      # Check that bracket is restored
      participants = page.evaluate_script("
        window.bracketManager && window.bracketManager.bracketData ? 
        window.bracketManager.bracketData.participants : null
      ")

      expect(participants).not_to be_nil
      expect(participants.length).to be > 0
    end
  end

  describe 'validation' do
    it 'validates bracket structure' do
      page.execute_script("window.bracketManager.initializeBracket(['A', 'B', 'C', 'D'])")
      sleep(0.5)

      validation = page.evaluate_script("window.bracketManager.validateBracket()")

      expect(validation).to include('isValid', 'errors')
      expect(validation['isValid']).to be true
      expect(validation['errors']).to be_empty
    end
  end
end

