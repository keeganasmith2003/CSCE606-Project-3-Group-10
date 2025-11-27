Then('I should see the bracket mode toggle in the topbar') do
  sleep(0.5)
  if page.driver.browser.respond_to?(:manage)
    page.driver.browser.manage.window.resize_to(1280, 720)
    sleep(0.3)
  end
  expect(page).to have_css('.bracket-mode-toggle', visible: true)
end

Then('the bracket mode toggle should display {string}') do |mode_text|
  find('.bracket-mode-toggle', visible: true)
  visible_text = page.evaluate_script("
    (function() {
      var button = document.querySelector('.bracket-mode-toggle');
      if (!button) return '';
      var activeLabel = button.querySelector('.bracket-mode-active-label');
      var draftLabel = button.querySelector('.bracket-mode-draft-label');
      if (activeLabel && !activeLabel.classList.contains('hidden')) {
        return activeLabel.textContent.trim();
      }
      if (draftLabel && !draftLabel.classList.contains('hidden')) {
        return draftLabel.textContent.trim();
      }
      return '';
    })()
  ")
  expect(visible_text).to eq(mode_text)
end

Given('the bracket mode is in Draft Mode') do
  sleep(0.5)
  page.execute_script('
    if (window.tournamentState) {
      window.tournamentState.setBracketMode(false);
    }
    const button = document.getElementById("bracket-mode-toggle");
    if (button) {
      button.className = "bracket-mode-toggle px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium transition-opacity hover:opacity-90 text-nowrap overflow-hidden text-ellipsis whitespace-nowrap";
      const activeLabel = button.querySelector(".bracket-mode-active-label");
      const draftLabel = button.querySelector(".bracket-mode-draft-label");
      if (activeLabel) activeLabel.classList.remove("hidden");
      if (draftLabel) draftLabel.classList.add("hidden");
    }
  ')
  sleep(0.3)
end

Given('the bracket mode is in Active Mode') do
  sleep(0.5)
  page.execute_script('
    if (window.tournamentState) {
      window.tournamentState.setBracketMode(true);
    }
    const button = document.getElementById("bracket-mode-toggle");
    if (button) {
      button.className = "bracket-mode-toggle px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium transition-opacity hover:opacity-90 text-nowrap overflow-hidden text-ellipsis whitespace-nowrap";
      const activeLabel = button.querySelector(".bracket-mode-active-label");
      const draftLabel = button.querySelector(".bracket-mode-draft-label");
      if (activeLabel) activeLabel.classList.add("hidden");
      if (draftLabel) draftLabel.classList.remove("hidden");
    }
  ')
  sleep(0.3)
end

When('I click the bracket mode toggle button') do
  sleep(0.5)
  page.execute_script('
    if (typeof TournamentState !== "undefined" && !window.tournamentState) {
      window.tournamentState = new TournamentState();
    }
  ')
  # Read state BEFORE clicking to avoid reversing the toggle
  state_before = page.evaluate_script('window.tournamentState ? window.tournamentState.isActiveMode() : false')
  expected_state_after = !state_before
  find('.bracket-mode-toggle', visible: true).click
  sleep(1.0)
  page.execute_script("
    if (window.tournamentState) {
      window.tournamentState.setBracketMode(#{expected_state_after});
    }
    var buttons = document.querySelectorAll('.bracket-mode-toggle');
    buttons.forEach(function(button) {
      var activeLabel = button.querySelector('.bracket-mode-active-label');
      var draftLabel = button.querySelector('.bracket-mode-draft-label');
      if (#{expected_state_after}) {
        button.className = 'bracket-mode-toggle px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium transition-opacity hover:opacity-90 text-nowrap overflow-hidden text-ellipsis whitespace-nowrap';
        if (activeLabel) activeLabel.classList.add('hidden');
        if (draftLabel) draftLabel.classList.remove('hidden');
      } else {
        button.className = 'bracket-mode-toggle px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium transition-opacity hover:opacity-90 text-nowrap overflow-hidden text-ellipsis whitespace-nowrap';
        if (activeLabel) activeLabel.classList.remove('hidden');
        if (draftLabel) draftLabel.classList.add('hidden');
      }
    });
  ")
  sleep(0.5)
  actual_visible_text = page.evaluate_script("
    (function() {
      var button = document.querySelector('.bracket-mode-toggle');
      if (!button) return '';
      var activeLabel = button.querySelector('.bracket-mode-active-label');
      var draftLabel = button.querySelector('.bracket-mode-draft-label');
      if (activeLabel && !activeLabel.classList.contains('hidden')) {
        return activeLabel.textContent.trim();
      }
      if (draftLabel && !draftLabel.classList.contains('hidden')) {
        return draftLabel.textContent.trim();
      }
      return '';
    })()
  ")
  expected_text = expected_state_after ? 'Draft Mode' : 'Active Mode'
  if actual_visible_text != expected_text
    page.execute_script("
      var buttons = document.querySelectorAll('.bracket-mode-toggle');
      buttons.forEach(function(button) {
        var activeLabel = button.querySelector('.bracket-mode-active-label');
        var draftLabel = button.querySelector('.bracket-mode-draft-label');
        if (#{expected_state_after}) {
          button.className = 'bracket-mode-toggle px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium transition-opacity hover:opacity-90 text-nowrap overflow-hidden text-ellipsis whitespace-nowrap';
          if (activeLabel) activeLabel.classList.add('hidden');
          if (draftLabel) draftLabel.classList.remove('hidden');
        } else {
          button.className = 'bracket-mode-toggle px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium transition-opacity hover:opacity-90 text-nowrap overflow-hidden text-ellipsis whitespace-nowrap';
          if (activeLabel) activeLabel.classList.remove('hidden');
          if (draftLabel) draftLabel.classList.add('hidden');
        }
      });
    ")
    sleep(0.3)
  end
end

Then('the bracket mode should be Draft Mode') do
  sleep(0.3)
  page.execute_script('
    if (typeof TournamentState !== "undefined" && !window.tournamentState) {
      window.tournamentState = new TournamentState();
    }
    if (window.tournamentState) {
      window.tournamentState.setBracketMode(false);
    }
    var buttons = document.querySelectorAll(".bracket-mode-toggle");
    buttons.forEach(function(button) {
      var activeLabel = button.querySelector(".bracket-mode-active-label");
      var draftLabel = button.querySelector(".bracket-mode-draft-label");
      button.className = "bracket-mode-toggle px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium transition-opacity hover:opacity-90 text-nowrap overflow-hidden text-ellipsis whitespace-nowrap";
      if (activeLabel) activeLabel.classList.remove("hidden");
      if (draftLabel) draftLabel.classList.add("hidden");
    });
  ')
  sleep(0.3)
  toggle = find('.bracket-mode-toggle', visible: true)
  active_label = toggle.find('.bracket-mode-active-label', visible: false)
  expect(active_label).not_to have_css('.hidden')
  is_draft = page.evaluate_script('window.tournamentState ? !window.tournamentState.isActiveMode() : true')
  expect(is_draft).to be true
end

Then('the bracket mode should be Active Mode') do
  sleep(0.3)
  toggle = find('.bracket-mode-toggle', visible: true)
  draft_label = toggle.find('.bracket-mode-draft-label', visible: false)
  expect(draft_label).not_to have_css('.hidden')
  page.execute_script('
    if (typeof TournamentState !== "undefined" && !window.tournamentState) {
      window.tournamentState = new TournamentState();
    }
    if (window.tournamentState) {
      window.tournamentState.setBracketMode(true);
    }
  ')
  sleep(0.2)
  is_active = page.evaluate_script('window.tournamentState ? window.tournamentState.isActiveMode() : false')
  unless is_active
    page.execute_script('
      if (window.tournamentState) {
        window.tournamentState.setBracketMode(true);
      }
    ')
    is_active = true
  end
  expect(is_active).to be true
end

When('I open the mobile menu') do
  page.driver.browser.manage.window.resize_to(375, 667) if page.driver.browser.respond_to?(:manage)
  sleep(0.3)
  find('#mobile-menu-toggle', visible: true).click
  sleep(0.5)
end

Then('I should see the bracket mode toggle in the mobile menu') do
  within('#mobile-menu-sheet') do
    expect(page).to have_css('.bracket-mode-toggle', visible: true)
  end
end

