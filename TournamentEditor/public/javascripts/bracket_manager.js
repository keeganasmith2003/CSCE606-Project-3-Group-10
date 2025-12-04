class BracketManager {
	constructor() {
		this.bracketData = null;
		this.bracketViewer = null;
		this.isDraftMode = false;
		this.competitors = [];
		this.draggedParticipant = null;
		this.dragTarget = null;

		if (typeof window !== 'undefined' && window.tournamentState) {
			this.isDraftMode = !window.tournamentState.isActiveMode();
		}

		this.loadFromLocalStorage();

		if (typeof window !== 'undefined') {
			window.addEventListener('tournamentStateChanged', (e) => {
				if (e.detail.changeType === 'bracketMode') {
					this.handleModeChange(e.detail.bracketMode);
				}
			});
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				this.updateUI();
			});
		} else {
			setTimeout(() => {
				this.updateUI();
			}, 100);
		}
	}

	
	/**
	 * Initialize a new single elimination bracket
	 * @param {Array<string>} competitorNames - Array of competitor names
	 */
	initializeBracket(competitorNames) {
		if (!competitorNames || competitorNames.length === 0) {
			console.warn('No competitors provided for bracket initialization');
			return;
		}

		const numParticipants = this.getNextPowerOfTwo(competitorNames.length);
		this.competitors = [...competitorNames];

		while (this.competitors.length < numParticipants) {
			this.competitors.push(null);
		}

		this.bracketData = this.generateSingleEliminationBracket(this.competitors);
		this.renderBracket();
		this.saveToLocalStorage();
		this.updateUI();
	}

	/**
	 * Generate bracket data structure for brackets-viewer
	 * @param {Array<string|null>} participants - Array of participant names (null for byes)
	 * @returns {Object} Bracket data structure for brackets-viewer
	 */
	generateSingleEliminationBracket(participants) {
		const numParticipants = participants.length;
		const numRounds = Math.log2(numParticipants);

		// Create participant list with sequential IDs based on original index
		const participantList = [];
		participants.forEach((name, index) => {
			if (name && name !== 'null' && name !== '') {
				participantList.push({
					id: index + 1,  // Use original index + 1 as ID to maintain position
					tournament_id: 1,
					name: name,
				});
			}
		});

		const matches = [];
		let matchId = 1;
		let matchesInRound = numParticipants / 2;
		let roundNumber = 1;
		const matchesPerRound = [];

		while (matchesInRound >= 1) {
			const currentRoundMatches = [];

			for (let i = 0; i < matchesInRound; i++) {
				const match = {
					id: matchId,
					stage_id: 1,
					group_id: 1,
					round_id: roundNumber,
					number: i + 1,
					child_count: 0,
					status: 0,
					opponent1: null,
					opponent2: null,
					next_match_id: null,
				};

				if (roundNumber === 1) {
					const p1Index = i * 2;
					const p2Index = i * 2 + 1;

					// Find participant by array index
					const p1Name = participants[p1Index];
					const p2Name = participants[p2Index];

					if (p1Name && p1Name !== 'null') {
						// Use the index + 1 as the ID (matching participantList)
						match.opponent1 = {
							id: p1Index + 1,
						};
					}

					if (p2Name && p2Name !== 'null') {
						// Use the index + 1 as the ID (matching participantList)
						match.opponent2 = {
							id: p2Index + 1,
						};
					}
				} else {
					match.opponent1 = null;
					match.opponent2 = null;
				}

				currentRoundMatches.push(match);
				matches.push(match);
				matchId++;
			}

			matchesPerRound.push(currentRoundMatches);
			matchesInRound = matchesInRound / 2;
			roundNumber++;
		}

		// Link matches to next rounds
		for (let roundIdx = 0; roundIdx < matchesPerRound.length - 1; roundIdx++) {
			const currentRound = matchesPerRound[roundIdx];
			const nextRound = matchesPerRound[roundIdx + 1];

			for (let i = 0; i < currentRound.length; i++) {
				const match = currentRound[i];
				const nextRoundMatchIndex = Math.floor(i / 2);
				if (nextRoundMatchIndex < nextRound.length) {
					match.next_match_id = nextRound[nextRoundMatchIndex].id;
				}
			}
		}

		const stages = [
			{
				id: 1,
				tournament_id: 1,
				name: 'Main Stage',
				type: 'single_elimination',
				number: 1,
				settings: {},
			},
		];

		return {
			stages: stages,
			matches: matches,
			matchGames: [],
			participants: participantList,
		};
	}

	/**
	 * Render the bracket using brackets-viewer
	 */
	renderBracket() {
		if (!this.bracketData) {
			this.showEmptyState();
			return;
		}

		const container = document.getElementById('bracket-viewer');
		if (!container) {
			console.error('Bracket viewer container not found');
			return;
		}

		container.innerHTML = '';
		this.hideEmptyState();

		try {
			if (typeof bracketsViewer !== 'undefined') {
				if (this.isDraftMode) {
					container.classList.add('draft-mode');
				} else {
					container.classList.remove('draft-mode');
				}

				console.log(this.competitors);
				console.log(this.bracketData);

				bracketsViewer.render(this.bracketData, {
					selector: '#bracket-viewer',
					participantOriginPlacement: 'before',
					separatedChildCountLabel: true,
					highlightParticipantOnHover: true,
				});

				// CRITICAL FIX: Wait longer for brackets-viewer to finish rendering
				if (this.isDraftMode) {
					setTimeout(() => {
						this.addMatchIdsToDOM();
						this.attachDragAndDrop();
						// Also add competitor controls if the method exists
						if (this.addCompetitorControls) {
							this.addCompetitorControls();
						}
						console.log('Draft mode features initialized');
					}, 500); // Increased from 300ms to 500ms
				}

			} else {
				console.error('brackets-viewer library not loaded');
			}
		} catch (error) {
			console.error('Error rendering bracket:', error);
		}
	}

	attachDragAndDrop() {
		const bracketContainer = document.getElementById('bracket-viewer');
		if (!bracketContainer) {
			console.error('Bracket container not found');
			return;
		}

		console.log('Attaching drag and drop...');

		// First add match IDs to the DOM
		this.addMatchIdsToDOM();

		const participantElements = bracketContainer.querySelectorAll('.participant');
		console.log(`Found ${participantElements.length} participant elements`);

		if (participantElements.length === 0) {
			console.warn('No participant elements found - bracket may not be rendered yet');
			return;
		}

		participantElements.forEach((element, index) => {
			// Skip BYE participants
			const nameDiv = element.querySelector('.name');
			if (!nameDiv || nameDiv.classList.contains('bye')) {
				console.log(`Skipping BYE participant at index ${index}`);
				return;
			}

			// CRITICAL FIX: Also check the text content for BYE
			const nameText = nameDiv.textContent.trim().replace(/^#\d+\s*/, '');
			if (nameText === 'BYE' || nameText === 'null' || nameText === '' || nameText === 'TBD') {
				console.log(`Skipping BYE/empty participant at index ${index}: "${nameText}"`);
				return;
			}

			element.setAttribute('draggable', 'true');
			element.style.cursor = 'grab';
			element.classList.add('draggable-participant');

			// Get match info
			const matchElement = element.closest('.match');
			if (matchElement) {
				const matchId = matchElement.dataset.matchId;
				element.dataset.matchId = matchId;
				console.log(`Added drag to participant ${index} in match ${matchId}: "${nameText}"`);
			}

			element.addEventListener('dragstart', (e) => {
				this.draggedParticipant = element;
				element.style.opacity = '0.5';
				e.dataTransfer.effectAllowed = 'move';
				
				// Get competitor name
				const competitorName = nameDiv.textContent.trim().replace(/^#\d+\s*/, '');
				e.dataTransfer.setData('text/plain', competitorName);
				
				// Store source match ID
				const sourceMatchId = element.dataset.matchId;
				if (sourceMatchId) {
					e.dataTransfer.setData('sourceMatchId', sourceMatchId);
				}
				
				console.log('Dragging:', competitorName, 'from match:', sourceMatchId);
			});

			element.addEventListener('dragend', (e) => {
				element.style.opacity = '1';
				if (this.dragTarget) {
					this.dragTarget.classList.remove('drag-over');
					this.dragTarget.style.backgroundColor = '';
				}
				this.draggedParticipant = null;
				this.dragTarget = null;
			});
		});

		const dropZones = bracketContainer.querySelectorAll('.participant');
		console.log(`Found ${dropZones.length} drop zones`);

		dropZones.forEach((zone, index) => {
			// Allow dropping on any slot (including BYE slots)
			zone.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';
				zone.classList.add('drag-over');
				zone.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
				this.dragTarget = zone;
			});

			zone.addEventListener('dragleave', (e) => {
				zone.classList.remove('drag-over');
				zone.style.backgroundColor = '';
			});

			zone.addEventListener('drop', (e) => {
				e.preventDefault();
				zone.classList.remove('drag-over');
				zone.style.backgroundColor = '';

				if (!this.draggedParticipant || this.draggedParticipant === zone) {
					return;
				}

				// Get competitor name and source match
				const competitorName = e.dataTransfer.getData('text/plain');
				const sourceMatchId = e.dataTransfer.getData('sourceMatchId');
				
				// Get target match
				const targetMatchElement = zone.closest('.match');
				const targetMatchId = targetMatchElement?.dataset.matchId;

				console.log('Drop:', competitorName, 'from match', sourceMatchId, 'to match', targetMatchId);

				// Handle the drop
				this.handleCompetitorDrop(competitorName, sourceMatchId, targetMatchId, zone);
			});
		});

		console.log('Drag and drop attached successfully');
	}

	addMatchIdsToDOM() {
		const bracketContainer = document.getElementById('bracket-viewer');
		if (!bracketContainer) {
			console.error('Bracket container not found for match IDs');
			return;
		}

		const matchElements = bracketContainer.querySelectorAll('.match');
		console.log(`Adding match IDs to ${matchElements.length} matches`);
		
		matchElements.forEach((matchEl, index) => {
			if (this.bracketData && this.bracketData.matches[index]) {
				matchEl.dataset.matchId = this.bracketData.matches[index].id;
				console.log(`Match ${index} assigned ID: ${this.bracketData.matches[index].id}`);
			}
		});

		console.log('Finished adding match IDs to DOM');
	}


	/**
	 * Handle competitor drop - advance to next round or swap in same round
	 */
	handleCompetitorDrop(competitorName, sourceMatchId, targetMatchId, targetElement) {
		if (!this.bracketData || !this.bracketData.matches) {
			console.error('No bracket data');
			return;
		}

		const sourceMatch = this.bracketData.matches.find(m => m.id == sourceMatchId);
		const targetMatch = this.bracketData.matches.find(m => m.id == targetMatchId);

		if (!sourceMatch || !targetMatch) {
			console.error('Match not found');
			return;
		}

		console.log('Source match round:', sourceMatch.round_id, 'Target match round:', targetMatch.round_id);
		console.log('Source next_match_id:', sourceMatch.next_match_id, 'Target id:', targetMatch.id);

		// Check if advancing to next round
		if (sourceMatch.next_match_id === targetMatch.id) {
			console.log('Advancing to next round');
			this.advanceCompetitor(competitorName, sourceMatch, targetMatch, targetElement);
		} else if (sourceMatch.round_id === targetMatch.round_id && sourceMatch.round_id === 1) {
			// Only allow swapping in Round 1
			console.log('Swapping in Round 1');
			this.handleParticipantMove(this.draggedParticipant, targetElement);
		} else {
			console.warn('Invalid move');
			this.showNotification('Can only advance to next round or swap within Round 1', 'error');
		}
	}


	/**
	 * Advance competitor to next round
	 */
	advanceCompetitor(competitorName, sourceMatch, targetMatch, targetElement) {
		console.log('Advancing', competitorName, 'to match', targetMatch.id);

		// Find participant
		const participant = this.bracketData.participants.find(p => p.name === competitorName);
		if (!participant) {
			console.error('Participant not found:', competitorName);
			return;
		}

		// CRITICAL FIX: Determine which slot to place the competitor in
		// We need to figure out if this drop target is opponent1 or opponent2
		
		// Get the parent match element
		const matchElement = targetElement.closest('.match');
		if (!matchElement) {
			console.error('Could not find match element');
			return;
		}

		// Get all participants in this match
		const participantsInMatch = matchElement.querySelectorAll('.participant');
		
		// Find which participant was dropped on (0 = opponent1, 1 = opponent2)
		let targetSlot = 'opponent1';
		participantsInMatch.forEach((p, index) => {
			if (p === targetElement) {
				targetSlot = index === 0 ? 'opponent1' : 'opponent2';
				console.log(`Drop target is at index ${index}, setting ${targetSlot}`);
			}
		});

		// Check if target slot is already occupied
		const currentOccupant = targetMatch[targetSlot];
		if (currentOccupant && currentOccupant.id) {
			const occupantName = this.bracketData.participants.find(p => p.id === currentOccupant.id)?.name;
			if (occupantName && occupantName !== 'BYE' && occupantName !== 'null') {
				const replace = confirm(
					`${targetSlot === 'opponent1' ? 'Top' : 'Bottom'} slot already has "${occupantName}". Replace with "${competitorName}"?`
				);
				if (!replace) {
					console.log('User cancelled replacement');
					return;
				}
			}
		}

		console.log('Setting', targetSlot, 'to participant ID', participant.id);

		// Set ONLY the target opponent slot
		targetMatch[targetSlot] = {
			id: participant.id,
		};

		// Save and re-render
		this.saveToLocalStorage();
		this.renderBracket();
		
		this.showNotification(`${competitorName} advanced to ${targetSlot === 'opponent1' ? 'top' : 'bottom'} slot!`, 'success');
	}


	/**
	 * Show notification
	 */
	showNotification(message, type = 'info') {
		const notification = document.createElement('div');
		notification.textContent = message;
		notification.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			padding: 12px 20px;
			border-radius: 8px;
			background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
			color: white;
			font-weight: 500;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
			z-index: 9999;
			animation: slideIn 0.3s ease;
		`;

		document.body.appendChild(notification);

		setTimeout(() => {
			notification.style.animation = 'slideOut 0.3s ease';
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	}

	/**
	 * Handle participant move in Draft Mode
	 * @param {HTMLElement} sourceElement - Source participant element
	 * @param {HTMLElement} targetElement - Target slot element
	 */
	handleParticipantMove(sourceElement, targetElement) {
		const sourceName = sourceElement.textContent.trim();
		const targetName = targetElement.textContent.trim();

		if (!this.validateMove(sourceName, targetName)) {
			console.warn('Invalid move: validation failed');
			return;
		}

		const sourceIndex = this.competitors.indexOf(sourceName);
		const targetIndex = this.competitors.indexOf(targetName);

		if (sourceIndex !== -1) {
			if (targetIndex !== -1) {
				[this.competitors[sourceIndex], this.competitors[targetIndex]] = [
					this.competitors[targetIndex],
					this.competitors[sourceIndex],
				];
			} else {
				this.competitors[targetIndex] = sourceName;
				this.competitors[sourceIndex] = null;
			}

			this.bracketData = this.generateSingleEliminationBracket(this.competitors);
			this.renderBracket();
		}
	}

	/**
	 * Validate a bracket move
	 * @param {string} sourceName - Source participant name
	 * @param {string} targetName - Target slot name
	 * @returns {boolean} True if move is valid
	 */
	validateMove(sourceName, targetName) {
		if (!sourceName || sourceName === '') {
			return false;
		}
		return true;
	}

	/**
	 * Handle bracket mode change
	 * @param {boolean} isActiveMode - True if Active Mode, false if Draft Mode
	 */
	handleModeChange(isActiveMode) {
		this.isDraftMode = !isActiveMode;
		this.updateUI();

		if (this.bracketData) {
			this.renderBracket();
		}
	}

	/**
	 * Update UI based on current state
	 */
	updateUI() {
		const draftControls = document.getElementById('draft-mode-controls');
		const emptyState = document.getElementById('bracket-empty-state');
		const bracketContainer = document.getElementById('bracket-viewer-container');

		if (this.bracketData) {
			if (emptyState) emptyState.style.display = 'none';
			if (bracketContainer) bracketContainer.style.display = 'block';

			if (this.isDraftMode && draftControls) {
				draftControls.style.display = 'flex';
			} else if (draftControls) {
				draftControls.style.display = 'none';
			}
		} else {
			if (emptyState) emptyState.style.display = 'block';
			if (bracketContainer) bracketContainer.style.display = 'none';
			if (draftControls) draftControls.style.display = 'none';
		}
	}

	/**
	 * Show empty state
	 */
	showEmptyState() {
		const emptyState = document.getElementById('bracket-empty-state');
		const bracketContainer = document.getElementById('bracket-viewer-container');

		if (emptyState) emptyState.style.display = 'block';
		if (bracketContainer) bracketContainer.style.display = 'none';
	}

	/**
	 * Hide empty state
	 */
	hideEmptyState() {
		const emptyState = document.getElementById('bracket-empty-state');
		if (emptyState) emptyState.style.display = 'none';
	}

	/**
	 * Validate bracket structure
	 * @returns {Object} Validation result with isValid and errors
	 */
	validateBracket() {
		const errors = [];

		if (!this.bracketData) {
			errors.push('No bracket data available');
			return { isValid: false, errors };
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Confirm bracket changes and save
	 */
	confirmBracketChanges() {
		const validation = this.validateBracket();

		if (!validation.isValid) {
			alert('Bracket validation failed:\n' + validation.errors.join('\n'));
			return;
		}

		this.saveToLocalStorage();
		this.sendToBackend();
		alert('Bracket changes confirmed and saved!');
	}

	/**
	 * Send bracket data to backend
	 */
	sendToBackend() {
		if (!this.bracketData) {
			console.warn('No bracket data to send');
			return;
		}

		const data = {
			bracket_type: 'single_elimination',
			participants: this.competitors.filter((c) => c !== null),
			bracket_data: this.bracketData,
			mode: this.isDraftMode ? 'draft' : 'active',
		};

		const csrfToken = document.querySelector('meta[name="csrf-token"]');
		const token = csrfToken ? csrfToken.content : '';

		fetch('/tournaments/update_bracket', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRF-Token': token,
				'X-Requested-With': 'XMLHttpRequest',
			},
			body: JSON.stringify(data),
			credentials: 'same-origin',
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to save bracket: ${response.status} ${response.statusText}`);
				}
				return response.json();
			})
			.then((data) => {
				console.log('Bracket saved successfully:', data);
			})
			.catch((error) => {
				console.error('Error saving bracket:', error);
				alert('Failed to save bracket to server. Changes saved locally.');
			});
	}

	/**
	 * Save bracket state to local storage
	 */
	saveToLocalStorage() {
		if (typeof localStorage !== 'undefined' && this.bracketData) {
			const state = {
				bracketData: this.bracketData,
				competitors: this.competitors,
				mode: this.isDraftMode ? 'draft' : 'active',
				timestamp: new Date().toISOString(),
			};
			localStorage.setItem('tournament_bracket_state', JSON.stringify(state));
		}
	}

	/**
	 * Save bracket state to CSV
	 */
	SaveToCSV() {
  		let csvContent = '';
			
  		// Add header row
  		let header = "*competitors*";
  		csvContent += header + '\r\n';
			
  		// Add data rows
  		this.competitors.forEach(function(row) {
  		  let line = row;
  		  csvContent += line + '\r\n';
  		});

  		header = "*stages*";
  		csvContent += header + '\r\n';
    	let headers = Object.keys(this.bracketData.stages[0]);
  		csvContent += headers.join(',') + '\r\n';

		if(this.bracketData.stages.length > 0)
		{
  			this.bracketData.stages.forEach(function(row) {
				let line = Object.values(row).map(item => {
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item);
    				}
    				return item;
				}).join(',');
  			  	csvContent += line + '\r\n';
  			});
		}

  		header = "*matches*";
  		csvContent += header + '\r\n';
    	headers = Object.keys(this.bracketData.matches[0]);
  		csvContent += headers.join(',') + '\r\n';

		if(this.bracketData.matches.length > 0)
		{
  			this.bracketData.matches.forEach(function(row) {
				let line = Object.values(row).map(item => {
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item);
    				}
    				return item;
				}).join(',');
  				csvContent += line + '\r\n';
  			});
		}

  		header = "*matchGames*";
  		csvContent += header + '\r\n';
		if(this.bracketData.matchGames > 0)
		{
    		headers = Object.keys(this.bracketData.matchGames[0]);
  			csvContent += headers.join(',') + '\r\n';
		}

		if(this.bracketData.matchGames.length > 0)
		{
  			this.bracketData.matchGames.forEach(function(row) {
  			  	let line = Object.values(row).map(item => {
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item);
    				}
    				return item;
				}).join(',');
  			  	csvContent += line + '\r\n';
  			});
		}

  		header = "*participants*";
  		csvContent += header + '\r\n';
    	headers = Object.keys(this.bracketData.participants[0]);
  		csvContent += headers.join(',') + '\r\n';

		if(this.bracketData.participants.length > 0)
		{
  			this.bracketData.participants.forEach(function(row) {
				let line = Object.values(row).map(item => {
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item);
    				}
    				return item;
				}).join(',');
  			 	csvContent += line + '\r\n';
  			});
		}

  		const encodedUri = encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvContent);
  		const link = document.createElement("a");

  		link.setAttribute("href", encodedUri);
  		link.setAttribute("download", "tournament.csv");
  		document.body.appendChild(link);

  		link.click();
  		document.body.removeChild(link);
	}

	/**
	 * Load bracket state from local storage
	 */
	loadFromLocalStorage() {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem('tournament_bracket_state');
			if (stored) {
				try {
					const state = JSON.parse(stored);
					this.bracketData = state.bracketData;
					this.competitors = state.competitors || [];
					this.isDraftMode = state.mode === 'draft';

					if (this.bracketData) {
						if (document.readyState === 'loading') {
							document.addEventListener('DOMContentLoaded', () => {
								this.renderBracket();
								this.updateUI();
							});
						} else {
							this.renderBracket();
							this.updateUI();
						}
					}
				} catch (error) {
					console.error('Error loading bracket state from local storage:', error);
				}
			}
		}
	}

	splitMixedString(str) {
	 const result = [];
	 let current = '';
	 let depth = 0;
		
	 for (let char of str) {
	   if (char === '{') depth++;
	   if (char === '}') depth--;
	
	   if (char === ',' && depth === 0) {
	     result.push(current.trim());
	     current = '';
	   } else {
	     current += char;
	   }
	 }
	
	 if (current.trim()) result.push(current.trim());
	 return result;
	}

	
	/**
	 * Load bracket state from CSV
	 */
	LoadFromCSV(file) {
  		if (file) {
			console.log(this.bracketData);

			if (!this.bracketData) {
				this.bracketData = {
					stages: [],
					matches: [],
					matchGames: [],
					participants: []
				};
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target.result;
				const lines = text.split('\r\n');
    			const headers = lines[0].split(',');

				let i = 0;
				console.log("COMPETITORS");
				while(i < lines.length)
				{
					console.log(this.bracketData);
					 console.log(lines[i]);
    			    let currentLine = lines[i].split(',');
					let headers = [];
					 console.log(currentLine[0]);
					switch (currentLine[0]){
  						case "*competitors*":
						  console.log("_*competitors*_");
							console.log(this.bracketData);
						  this.competitors = [];
						  ++i;
						  while(lines[i]!="*stages*")
						  {
							this.competitors.push(lines[i]);	
							++i;
						  }
  						  break;
  						case "*stages*":
						  console.log("_*stages*_");
							console.log(this.bracketData);
						  this.bracketData.stages = [];
						  ++i;
    					 headers = lines[i++].split(',');
						  while(lines[i] != "*matches*")
						  {
    						let currentline = lines[i].split(',');

							let obj = {};
    						for (let j = 0; j < headers.length; j++) {
    							try {
    						    	obj[headers[j].trim()] = JSON.parse(currentline[j]);
    							} catch (e) {
    						    	obj[headers[j].trim()] = currentline[j].trim();
    							}
    						}
							this.bracketData.stages.push(obj);
						 	++i;
    					  }
  						  break;
  						case "*matches*":
						  console.log("_*matches*_");
						  this.bracketData.matches = [];
						  ++i;
    					  headers = lines[i++].split(',');
						  while(lines[i]!="*matchGames*")
						  {
    						let currentline = this.splitMixedString(lines[i]);

							let obj = {};
    						for (let j = 0, k = j; j < headers.length; j++, k++) {
								let data = currentline[k];
								console.log(data);

									if(data === undefined || data === "")
									{
    						    		obj[headers[j].trim()] = null;
									}
									else
									{
    									try {
    						    			obj[headers[j].trim()] = JSON.parse(data);
    									} catch (e) {
    						    			obj[headers[j].trim()] = data;
    									}
									}
    						}
							this.bracketData.matches.push(obj);
							++i;
						  }
  						  break;
  						case "*matchGames*":
						  console.log("_*matchGames*_");
						  this.bracketData.matchGames = [];
						  ++i;
						  if(lines[i] != "*participants*")
						  {
    					 	headers = lines[i++].split(',');
						  }
						  while(lines[i]!="*participants*")
						  {
    						let currentline = lines[i].split(',');

    						if (currentline.length === headers.length) {
								let obj = {};
    						    for (let j = 0; j < headers.length; j++) {
    								try {
    						        	obj[headers[j].trim()] = JSON.parse(currentline[j]);
    								} catch (e) {
    						        	obj[headers[j].trim()] = currentline[j].trim();
    								}
    						    }
								this.bracketData.matchGames.push(obj);
    						}
							++i;
						  }
  						  break;
  						case "*participants*":
						  console.log("_*participants*_");
						  this.bracketData.participants = [];
						  ++i;
    					  headers = lines[i++].split(',');
						  while(i < lines.length)
						  {
						  console.log("_*participants*_123");
    						const currentline = lines[i].split(',');

								let obj = {};
    						    for (let j = 0; j < headers.length; j++) {
    								try {
    						        	obj[headers[j].trim()] = JSON.parse(currentline[j]);
    								} catch (e) {
    						        	obj[headers[j].trim()] = currentline[j];
    								}
    						    }
							this.bracketData.participants.push(obj);
							++i;
						  }
						 console.log("DONE?: ")
						 console.log( this.bracketData);
						 console.log( this.competitors);
  						  break;
					}
				}
				
				this.isDraftMode = true;

							 console.log("DONE!?: ")
							 console.log( this.bracketData);
							 console.log( this.competitors);

				if (this.bracketData) {
						console.log("DONE: ")
						console.log( this.bracketData);
						console.log( this.competitors);

						this.saveToLocalStorage();
						this.updateUI();
						this.renderBracket();
				}
			};
			reader.readAsText(file);
    		return;
		}
		else
		{
			console.log("NO FILE FOUND");
		}
	}

	/**
	 * Get next power of two
	 * @param {number} n - Input number
	 * @returns {number} Next power of two
	 */
	getNextPowerOfTwo(n) {
		if (n <= 0) return 1;
		return Math.pow(2, Math.ceil(Math.log2(n)));
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = BracketManager;
}

if (typeof window !== 'undefined') {
	window.BracketManager = BracketManager;

	function initializeBracketManager() {
		window.bracketManager = new BracketManager();

		if (window.tournamentState) {
			const isActiveMode = window.tournamentState.isActiveMode();
			window.bracketManager.handleModeChange(isActiveMode);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initializeBracketManager);
	} else {
		setTimeout(initializeBracketManager, 100);
	}

	window.validateBracket = function () {
		if (window.bracketManager) {
			const validation = window.bracketManager.validateBracket();
			if (validation.isValid) {
				alert('Bracket is valid!');
			} else {
				alert('Bracket validation failed:\n' + validation.errors.join('\n'));
			}
		}
	};

	window.confirmBracketChanges = function () {
		if (window.bracketManager) {
			window.bracketManager.confirmBracketChanges();
		}
	};

	window.startNewBracket = function (competitorNames) {
		if (window.bracketManager) {
			window.bracketManager.initializeBracket(competitorNames);
		}
	};

	window.SaveToCSV = function() {
		if(window.bracketManager) {
			window.bracketManager.SaveToCSV();
		}
	}

	window.LoadFromCSV = function(file) {
		if(window.bracketManager) {
			window.bracketManager.LoadFromCSV(file);
		}
	}

}