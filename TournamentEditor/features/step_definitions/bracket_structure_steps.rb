# Step definitions for bracket structure verification using Data Tables

# Common input steps
When('I enter {string} in the competitor count field') do |count|
  @competitor_count = count.to_i
  # Just set a variable to track the count, will use it when Enter is pressed
end

When('I press Enter in the competitor count field') do
  # Directly call the bracket manager with the count we stored
  if @competitor_count
    page.execute_script("
      if (window.bracketManager) {
        window.bracketManager.updateCompetitorCount(#{@competitor_count});
      } else {
        console.error('BracketManager not found!');
      }
    ")
    sleep(1.5) # Wait for bracket to render
  else
    raise "No competitor count was set"
  end
end

Then('the bracket should have this structure:') do |table|
  within('#bracket-viewer') do
    table.hashes.each do |row|
      round_num = row['round'].to_i
      match_num = row['match'].to_i
      position = row['position'].to_i
      expected_competitor = row['competitor'].strip
      
      # Find the specific round
      round = find("article.round[data-round-id='#{round_num}']", visible: true)
      
      within(round) do
        # Find all visible matches (excluding hidden BYE matches)
        matches = all('.match[data-match-id]', minimum: 0).reject { |m| m[:style]&.include?('visibility: hidden') }
        
        # Get the specific match (1-indexed)
        expect(matches.length).to be >= match_num, "Round #{round_num} should have at least #{match_num} matches"
        match = matches[match_num - 1]
        
        within(match) do
          # Get all participants in this match
          participants = all('.participant', minimum: 0)
          expect(participants.length).to be >= position, "Match should have at least #{position} participants"
          
          participant = participants[position - 1]
          
          # Get the name element
          name_element = participant.find('.name', minimum: 0, match: :first)
          actual_name = name_element.text.strip
          
          # Clean up the actual name (remove #N prefix if present)
          actual_name = actual_name.gsub(/^#\d+\s*/, '')
          
          if expected_competitor.empty?
            # Empty slot - should not contain any competitor name
            expect(actual_name).not_to match(/Competitor \d+/)
          elsif expected_competitor == 'BYE'
            # Should show BYE
            expect(actual_name.upcase).to eq('BYE')
          else
            # Should match the expected competitor
            expect(actual_name).to eq(expected_competitor)
          end
        end
      end
    end
  end
end

Then('each competitor appears exactly once') do
  within('#bracket-viewer') do
    # Get all participant names in Round 1
    round1 = find("article.round[data-round-id='1']", visible: true)
    names = round1.all('.participant .name', minimum: 0).map do |n|
      n.text.strip.gsub(/^#\d+\s*/, '')
    end
    
    # Filter to only competitor names
    competitor_names = names.select { |name| name.match?(/Competitor \d+/) }
    
    # Check each appears exactly once
    competitor_names.uniq.each do |competitor|
      count = competitor_names.count(competitor)
      expect(count).to eq(1), "#{competitor} appears #{count} times, expected 1"
    end
  end
end

Then('no competitor should face themselves') do
  within('#bracket-viewer') do
    # Check all matches in all rounds
    matches = all('.match[data-match-id]', minimum: 0)
    
    matches.each do |match|
      within(match) do
        names = all('.participant .name', minimum: 0).map do |n|
          n.text.strip.gsub(/^#\d+\s*/, '')
        end
        
        # Filter to real competitors (not BYE, empty, or placeholders)
        real_competitors = names.select { |name| name.match?(/Competitor \d+/) }
        
        # If there are 2 competitors, they must be different
        if real_competitors.length == 2
          expect(real_competitors[0]).not_to eq(real_competitors[1]),
            "Competitor #{real_competitors[0]} is facing themselves"
        end
      end
    end
  end
end

Then('Round {int} and {int} should have no competitor names') do |round1, round2|
  [round1, round2].each do |round_num|
    within('#bracket-viewer') do
      round = find("article.round[data-round-id='#{round_num}']", visible: true)
      names = round.all('.participant .name', minimum: 0).map { |n| n.text.strip.gsub(/^#\d+\s*/, '') }
      
      # Should not contain any "Competitor N" text
      names.each do |name|
        expect(name).not_to match(/Competitor \d+/), 
          "Round #{round_num} should not have competitor names, but found: #{name}"
      end
    end
  end
end

Then('Round {int} should have no competitor names') do |round_num|
  within('#bracket-viewer') do
    round = find("article.round[data-round-id='#{round_num}']", visible: true)
    names = round.all('.participant .name', minimum: 0).map { |n| n.text.strip.gsub(/^#\d+\s*/, '') }
    
    # Should not contain any "Competitor N" text
    names.each do |name|
      expect(name).not_to match(/Competitor \d+/),
        "Round #{round_num} should not have competitor names, but found: #{name}"
    end
  end
end

Then('the bracket should have rounds:') do |table|
  within('#bracket-viewer') do
    expected_rounds = table.raw.flatten.reject(&:empty?)
    actual_rounds = all('article.round', minimum: 0).map do |round|
      title = round.find('h3', minimum: 0)
      title ? title.text.strip : ''
    end.reject(&:empty?)
    
    expect(actual_rounds.length).to eq(expected_rounds.length),
      "Expected #{expected_rounds.length} rounds, but found #{actual_rounds.length}. Actual rounds: #{actual_rounds.inspect}"
    
    expected_rounds.each_with_index do |expected_round, index|
      expect(actual_rounds[index]).to eq(expected_round),
        "Round #{index + 1} should be '#{expected_round}', but found '#{actual_rounds[index]}'"
    end
  end
end

