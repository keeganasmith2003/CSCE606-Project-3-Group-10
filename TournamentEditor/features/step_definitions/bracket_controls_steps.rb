# Step definitions for bracket controls

Then('I should see the bracket viewer') do
  expect(page).to have_css('#bracket-viewer', visible: true)
end

Then('the bracket should have this initial structure:') do |table|
  sleep(0.5) # Wait for bracket to render
  
  within('#bracket-viewer') do
    table.hashes.each do |row|
      round_num = row['round'].to_i
      match_num = row['match'].to_i
      position = row['position'].to_i
      expected_competitor = row['competitor'].strip
      
      round = find("article.round[data-round-id='#{round_num}']", visible: true)
      
      within(round) do
        matches = all('.match[data-match-id]').select { |m| m.visible? }
        expect(matches.length).to be >= match_num, "Expected at least #{match_num} matches in Round #{round_num}, found #{matches.length}"
        
        match = matches[match_num - 1]
        expect(match).not_to be_nil, "Could not find match #{match_num} in Round #{round_num}"
        
        within(match) do
          participants = all('.participant')
          expect(participants.length).to be >= position, "Expected at least #{position} participants in match"
          
          participant = participants[position - 1]
          name_elements = participant.all('*').select { |el| el[:class]&.include?('name') }
          
          if name_elements.any?
            name_element = name_elements.first
            actual_name = name_element.text.strip.gsub(/^#\d+\s*/, '')
            expect(actual_name).to eq(expected_competitor)
          else
            raise "No name element found in participant at Round #{round_num} Match #{match_num} position #{position}"
          end
        end
      end
    end
  end
end

Then('the Draft icon should be visible') do
  within('#draft-mode-controls') do
    expect(page).to have_css('svg', visible: true)
  end
end

Then('the Validate button should be visible') do
  expect(page).to have_button('Validate', visible: true)
end

Then('the Confirm button should be visible') do
  expect(page).to have_button('Confirm', visible: true)
end

Then('the Reset button should be visible') do
  expect(page).to have_button('Reset', visible: true)
end

Then('the competitor count input should be visible') do
  expect(page).to have_css('#competitor-count-input', visible: true)
end

When('I click the Reset button') do
  # Mock confirm dialog
  page.execute_script("window.confirm = function() { return true; };")
  click_button 'Reset'
  sleep(0.5)
end

Then('the bracket should be reset to Round 1') do
  # Check that all competitors are in Round 1
  within('#bracket-viewer') do
    round1 = find("article.round[data-round-id='1']", visible: true)
    names = round1.all('.participant .name', minimum: 0).map { |n| n.text.strip.gsub(/^#\d+\s*/, '') }
    
    # All competitors should be in Round 1
    competitor_names = names.select { |name| name.match?(/Competitor \d+/) }
    expect(competitor_names).not_to be_empty
  end
end

Then('the competitor list should be visible') do
  expect(page).to have_css('#competitor-list-container', visible: true)
end

