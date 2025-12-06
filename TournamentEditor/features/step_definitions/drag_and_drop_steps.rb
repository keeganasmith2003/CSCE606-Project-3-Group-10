# Drag and drop step definitions

Given('the initial bracket has:') do |table|
  # Verify the initial bracket structure matches the expected layout
  table.hashes.each do |row|
    round_num = row['round'].to_i
    match_num = row['match'].to_i
    pos_num = row['position'].to_i
    expected_name = row['competitor']
    
    within('#bracket-viewer') do
      round = find("article.round[data-round-id='#{round_num}']", visible: true)
      matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
      match = matches[match_num - 1]
      
      within(match) do
        participants = all('.participant', minimum: 0)
        participant = participants[pos_num - 1]
        
        within(participant) do
          name_div = find('.name', minimum: 0)
          actual_name = name_div.text.strip.gsub(/^#\d+\s*/, '')
          expect(actual_name).to include(expected_name)
        end
      end
    end
  end
end

When('I drag {string} to Round {int} Match {int}') do |competitor_name, tgt_round, tgt_match|
  steps %{
    When I drag "#{competitor_name}" to Round #{tgt_round} Match #{tgt_match} position 1
  }
end

When('I drag {string} to Round {int} Match {int} position {int}') do |competitor_name, tgt_round, tgt_match, tgt_pos|
  # Find the source location of the competitor
  source_info = page.execute_script("
    const bracketViewer = document.getElementById('bracket-viewer');
    const allParticipants = bracketViewer.querySelectorAll('.participant');
    
    for (let participant of allParticipants) {
      const nameEl = participant.querySelector('.name');
      if (nameEl && nameEl.textContent.includes('#{competitor_name}')) {
        const match = participant.closest('.match');
        const round = participant.closest('.round');
        const roundId = round.getAttribute('data-round-id');
        const visibleMatches = Array.from(round.querySelectorAll('.match[data-match-id]')).filter(m => m.style.visibility !== 'hidden');
        const matchIndex = visibleMatches.indexOf(match);
        const participants = match.querySelectorAll('.participant');
        const posIndex = Array.from(participants).indexOf(participant);
        
        return {
          round: parseInt(roundId),
          match: matchIndex + 1,
          position: posIndex + 1
        };
      }
    }
    return null;
  ")
  
  expect(source_info).not_to be_nil, "Could not find #{competitor_name} in the bracket"
  
  # Now perform the drag operation using the full step
  steps %{
    When I drag "#{competitor_name}" from Round #{source_info['round']} Match #{source_info['match']} position #{source_info['position']} to Round #{tgt_round} Match #{tgt_match} position #{tgt_pos}
  }
end

When('I drag {string} from Round {int} Match {int} position {int} to Round {int} Match {int} position {int}') do |competitor_name, src_round, src_match, src_pos, tgt_round, tgt_match, tgt_pos|
  result = page.execute_script("
    const bracketViewer = document.getElementById('bracket-viewer');
    if (!bracketViewer || !window.bracketManager) {
      return 'ERROR: Bracket viewer or manager not found';
    }
    
    // Find source element
    const srcRound = bracketViewer.querySelector('article.round[data-round-id=\"#{src_round}\"]');
    if (!srcRound) return 'ERROR: Source round not found';
    
    const srcMatches = Array.from(srcRound.querySelectorAll('.match[data-match-id]')).filter(m => m.style.visibility !== 'hidden');
    const srcMatch = srcMatches[#{src_match - 1}];
    if (!srcMatch) return 'ERROR: Source match not found';
    
    const srcParticipants = srcMatch.querySelectorAll('.participant');
    const srcElement = srcParticipants[#{src_pos - 1}];
    if (!srcElement) return 'ERROR: Source participant not found';
    
    // Find target element
    const tgtRound = bracketViewer.querySelector('article.round[data-round-id=\"#{tgt_round}\"]');
    if (!tgtRound) return 'ERROR: Target round not found';
    
    const tgtMatches = Array.from(tgtRound.querySelectorAll('.match[data-match-id]')).filter(m => m.style.visibility !== 'hidden');
    const tgtMatch = tgtMatches[#{tgt_match - 1}];
    if (!tgtMatch) return 'ERROR: Target match not found';
    
    const tgtParticipants = tgtMatch.querySelectorAll('.participant');
    const tgtElement = tgtParticipants[#{tgt_pos - 1}];
    if (!tgtElement) return 'ERROR: Target participant not found';
    
    // Execute the move
    try {
      window.bracketManager.handleParticipantMove(srcElement, tgtElement);
      return 'SUCCESS';
    } catch (e) {
      return 'ERROR: ' + e.message;
    }
  ")
  
  sleep(1) # Wait for bracket to re-render
  expect(result).to eq('SUCCESS'), "Drag operation failed: #{result}"
end

Then('{string} should have wins in Round {int} Match {int} and Round {int} Match {int}') do |competitor_name, round1, match1, round2, match2|
  # Wait for bracket to update
  sleep(0.5)
  
  # Check Round 1 Match
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round1}']", visible: true)
    matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    expect(matches.length).to be >= match1, "Only #{matches.length} matches visible in Round #{round1}, expected at least #{match1}"
    match = matches[match1 - 1]
    
    within(match) do
      # Find participant that contains the competitor name
      participants = all('.participant', minimum: 0)
      found_participant = participants.find { |p| p.text.include?(competitor_name) }
      
      expect(found_participant).not_to be_nil, "Could not find #{competitor_name} in Round #{round1} Match #{match1}"
      
      # Check if result div exists and has W
      result_divs = found_participant.all('.result', minimum: 0)
      if result_divs.any?
        expect(result_divs.first.text).to eq('W'), "Expected W in Round #{round1} Match #{match1}, got: #{result_divs.first.text}"
      else
        raise "No result div found for #{competitor_name} in Round #{round1} Match #{match1}"
      end
    end
  end
  
  # Check Round 2 Match
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round2}']", visible: true)
    matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    expect(matches.length).to be >= match2, "Only #{matches.length} matches visible in Round #{round2}, expected at least #{match2}"
    match = matches[match2 - 1]
    
    within(match) do
      # Find participant that contains the competitor name
      participants = all('.participant', minimum: 0)
      found_participant = participants.find { |p| p.text.include?(competitor_name) }
      
      expect(found_participant).not_to be_nil, "Could not find #{competitor_name} in Round #{round2} Match #{match2}"
      
      # Check if result div exists and has W
      result_divs = found_participant.all('.result', minimum: 0)
      if result_divs.any?
        expect(result_divs.first.text).to eq('W'), "Expected W in Round #{round2} Match #{match2}, got: #{result_divs.first.text}"
      else
        raise "No result div found for #{competitor_name} in Round #{round2} Match #{match2}"
      end
    end
  end
end

Then('{string} should appear in Round {int} Match {int} and Round {int} Match {int}') do |competitor_name, round1, match1, round2, match2|
  # Check Round 1 Match
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round1}']", visible: true)
    matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    match = matches[match1 - 1]
    expect(match.text).to include(competitor_name)
  end
  
  # Check Round 2 Match
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round2}']", visible: true)
    matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    match = matches[match2 - 1]
    expect(match.text).to include(competitor_name)
  end
end

Then('the bracket should show:') do |table|
  table.hashes.each do |row|
    round_num = row['round'].to_i
    match_num = row['match'].to_i
    pos_num = row['position'].to_i
    expected_name = row['competitor']
    expected_result = row['result'] || ''
    
    within('#bracket-viewer') do
      round = find("article.round[data-round-id='#{round_num}']", visible: true)
      matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
      match = matches[match_num - 1]
      
      within(match) do
        participants = all('.participant', minimum: 0)
        participant = participants[pos_num - 1]
        
        within(participant) do
          name_div = find('.name', minimum: 0)
          actual_name = name_div.text.strip.gsub(/^#\d+\s*/, '')
          
          if expected_name.empty?
            expect(actual_name).to be_empty.or eq('BYE')
          else
            expect(actual_name).to include(expected_name)
          end
          
          if !expected_result.empty?
            result_div = find('.result', minimum: 0)
            expect(result_div.text).to eq(expected_result)
          end
        end
      end
    end
  end
end

Then('each competitor should appear exactly once in Round {int}') do |round_num|
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round_num}']", visible: true)
    names = round.all('.participant .name', minimum: 0).map { |n| n.text.strip.gsub(/^#\d+\s*/, '') }
    competitor_names = names.select { |name| name.include?('Competitor') }
    
    competitor_names.uniq.each do |comp_name|
      count = competitor_names.count(comp_name)
      expect(count).to eq(1), "#{comp_name} appears #{count} times in Round #{round_num}"
    end
  end
end

Then('no competitor should face themselves in any match') do
  within('#bracket-viewer') do
    all_matches = all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    
    all_matches.each do |match|
      within(match) do
        names = all('.participant .name', minimum: 0).map { |n| n.text.strip.gsub(/^#\d+\s*/, '') }
        real_names = names.reject { |n| n.empty? || n == 'BYE' || n == '-' }
        
        if real_names.length == 2
          expect(real_names[0]).not_to eq(real_names[1]), "Found #{real_names[0]} facing themselves in a match"
        end
      end
    end
  end
end

Then('Round {int} Match {int} position {int} should display {string}') do |round_num, match_num, pos_num, expected_text|
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round_num}']", visible: true)
    matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    match = matches[match_num - 1]
    
    within(match) do
      participants = all('.participant', minimum: 0)
      participant = participants[pos_num - 1]
      
      within(participant) do
        name_div = find('.name', minimum: 0)
        actual_text = name_div.text.strip.gsub(/^#\d+\s*/, '')
        
        expect(actual_text).to eq(expected_text), 
          "Expected #{expected_text} but got #{actual_text} at Round #{round_num} Match #{match_num} position #{pos_num}"
      end
    end
  end
end

Then('{string} should appear only once in Round {int}') do |competitor_name, round_num|
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round_num}']", visible: true)
    names = round.all('.participant .name', minimum: 0).map { |n| n.text.strip.gsub(/^#\d+\s*/, '') }
    count = names.count { |name| name.include?(competitor_name) }
    expect(count).to eq(1), "Expected #{competitor_name} to appear once in Round #{round_num}, but it appeared #{count} times"
  end
end

Then('{string} should not face themselves in any match') do |competitor_name|
  within('#bracket-viewer') do
    all_matches = all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    
    all_matches.each do |match|
      within(match) do
        names = all('.participant .name', minimum: 0).map { |n| n.text.strip.gsub(/^#\d+\s*/, '') }
        competitor_names = names.select { |n| n.include?(competitor_name) }
        
        expect(competitor_names.length).to be <= 1, 
          "Found #{competitor_name} facing themselves in a match"
      end
    end
  end
end

Then('{string} should show {string} for all previous rounds') do |competitor_name, expected_result|
  within('#bracket-viewer') do
    # Find all participants with this competitor name
    all_participants = all('.participant', minimum: 0)
    
    found_any = false
    all_participants.each do |participant|
      name_div = participant.find('.name', minimum: 0)
      name = name_div.text.strip.gsub(/^#\d+\s*/, '')
      
      if name.include?(competitor_name)
        found_any = true
        result_div = participant.find('.result', minimum: 0)
        result_text = result_div.text.strip
        # Only check non-empty results that aren't '-' (which indicates no result yet)
        if result_div && !result_text.empty? && result_text != '-'
          expect(result_text).to eq(expected_result), 
            "Expected #{expected_result} for #{competitor_name}, got: #{result_text}"
        end
      end
    end
    
    expect(found_any).to be(true), "Could not find #{competitor_name} in the bracket"
  end
end

Then('{string} should display {string} in their score') do |competitor_name, expected_score|
  within('#bracket-viewer') do
    # Find the participant with this competitor name
    all_participants = all('.participant', minimum: 0)
    
    found = false
    all_participants.each do |participant|
      name_div = participant.find('.name', minimum: 0)
      name = name_div.text.strip.gsub(/^#\d+\s*/, '')
      
      if name.include?(competitor_name)
        found = true
        result_div = participant.find('.result', minimum: 0)
        expect(result_div.text).to include(expected_score), 
          "Expected #{expected_score} in score for #{competitor_name}, got: #{result_div.text}"
      end
    end
    
    expect(found).to be(true), "Could not find #{competitor_name} in the bracket"
  end
end

Then('Round {int} Match {int} should show {string} with result {string} in position {int}') do |round_num, match_num, competitor_name, expected_result, position|
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round_num}']", visible: true)
    matches = round.all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
    expect(matches.length).to be >= match_num, "Only #{matches.length} matches visible in Round #{round_num}, expected at least #{match_num}"
    match = matches[match_num - 1]
    
    within(match) do
      participants = all('.participant', minimum: 0)
      expect(participants.length).to be >= position, "Only #{participants.length} participants in Round #{round_num} Match #{match_num}, expected at least #{position}"
      
      # Get the specific position
      participant = participants[position - 1]
      
      within(participant) do
        name_div = find('.name')
        result_div = find('.result')
        
        actual_name = name_div.text.strip.gsub(/^#\d+\s*/, '')
        actual_result = result_div.text.strip
        
        # Check if we're expecting an empty slot
        if competitor_name.empty? || competitor_name == '-' || competitor_name == 'BYE'
          expect(actual_name).to eq('-').or(eq('BYE')), 
            "Expected empty slot (showing '-' or 'BYE') in Round #{round_num} Match #{match_num} Position #{position}, got: #{actual_name}"
        else
          expect(actual_name).to include(competitor_name), 
            "Expected #{competitor_name} in Round #{round_num} Match #{match_num} Position #{position}, got: #{actual_name}"
        end
        
        expect(actual_result).to eq(expected_result), 
          "Expected result #{expected_result} for #{competitor_name} in Round #{round_num} Match #{match_num} Position #{position}, got: #{actual_result}"
      end
    end
  end
end

