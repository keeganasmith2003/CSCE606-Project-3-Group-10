/**
 * BracketManager - Manages bracket visualization and state
 *
 * Handles bracket visualization, drag-and-drop in Draft Mode,
 * validation, local storage persistence, and backend communication
 */

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

		const participantList = participants
			.map((name, index) =>
				name
					? {
							id: index + 1,
							tournament_id: 1,
							name: name,
					  }
					: null
			)
			.filter((p) => p !== null);

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

					if (participants[p1Index]) {
						match.opponent1 = {
							id: p1Index + 1,
							position: 0,
							score: null,
							result: null,
						};
					}

					if (participants[p2Index]) {
						match.opponent2 = {
							id: p2Index + 1,
							position: 1,
							score: null,
							result: null,
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

				bracketsViewer.render(this.bracketData, {
					selector: '#bracket-viewer',
					participantOriginPlacement: 'before',
					separatedChildCountLabel: true,
					highlightParticipantOnHover: true,
				});

				if (this.isDraftMode) {
					setTimeout(() => {
						this.attachDragAndDrop();
					}, 300);
				}
			} else {
				console.error('brackets-viewer library not loaded');
			}
		} catch (error) {
			console.error('Error rendering bracket:', error);
		}
	}

	/**
	 * Attach drag-and-drop functionality for Draft Mode
	 */
	attachDragAndDrop() {
		const bracketContainer = document.getElementById('bracket-viewer');
		if (!bracketContainer) return;

		const participantElements = bracketContainer.querySelectorAll(
			'[data-participant-id], .participant, .bracket-participant'
		);

		participantElements.forEach((element) => {
			element.setAttribute('draggable', 'true');
			element.style.cursor = 'grab';
			element.classList.add('draggable-participant');

			element.addEventListener('dragstart', (e) => {
				this.draggedParticipant = element;
				element.style.opacity = '0.5';
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', element.textContent.trim());
			});

			element.addEventListener('dragend', (e) => {
				element.style.opacity = '1';
				if (this.dragTarget) {
					this.dragTarget.classList.remove('drag-over');
				}
				this.draggedParticipant = null;
				this.dragTarget = null;
			});
		});

		const dropZones = bracketContainer.querySelectorAll(
			'[data-participant-id], .participant, .bracket-participant, .bracket-slot, [class*="slot"]'
		);

		dropZones.forEach((zone) => {
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

				if (this.draggedParticipant && this.draggedParticipant !== zone) {
					this.handleParticipantMove(this.draggedParticipant, zone);
				}
			});
		});
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
  		let header = "*COMPETITORS*";
  		csvContent += header + '\r\n';
			
  		// Add data rows
  		this.competitors.forEach(function(row) {
  		  let line = row;
  		  csvContent += line + '\r\n';
  		});

  		header = "*BRACKET_DATA*";
  		csvContent += header + '\r\n';

  		header = "*STAGES*";
  		csvContent += header + '\r\n';
    	let headers = Object.keys(this.bracketData.stages[0]);
  		csvContent += headers.join(',') + '\r\n';

		if(this.bracketData.stages.length > 0)
		{
  			this.bracketData.stages.forEach(function(row) {
				let line = Object.values(row).map(item => {
    				// Check if the item is an object and not null or an array
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item); // Stringify the object
    				}
    				return item; // Return other types as is
				}).join(',');
  			  	csvContent += line + '\r\n';
  			});
		}

  		header = "*MATCHES*";
  		csvContent += header + '\r\n';
    	headers = Object.keys(this.bracketData.matches[0]);
  		csvContent += headers.join(',') + '\r\n';

		if(this.bracketData.matches.length > 0)
		{
  			this.bracketData.matches.forEach(function(row) {
				let line = Object.values(row).map(item => {
    				// Check if the item is an object and not null or an array
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item); // Stringify the object
    				}
    				return item; // Return other types as is
				}).join(',');
  				csvContent += line + '\r\n';
  			});
		}

  		header = "*MATCH_GAMES*";
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
    				// Check if the item is an object and not null or an array
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item); // Stringify the object
    				}
    				return item; // Return other types as is
				}).join(',');
  			  	csvContent += line + '\r\n';
  			});
		}

  		header = "*PARTICIPANTS*";
  		csvContent += header + '\r\n';
    	headers = Object.keys(this.bracketData.participants[0]);
  		csvContent += headers.join(',') + '\r\n';

		if(this.bracketData.matchGames.length > 0)
		{
  			this.bracketData.participants.forEach(function(row) {
				let line = Object.values(row).map(item => {
    				// Check if the item is an object and not null or an array
    				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    				    return JSON.stringify(item); // Stringify the object
    				}
    				return item; // Return other types as is
				}).join(',');
  			 	csvContent += line + '\r\n';
  			});
		}

  		// Use the data URI scheme with proper encoding and a Byte Order Mark (BOM) for Excel compatibility
  		const encodedUri = encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvContent);
  		const link = document.createElement("a");

  		link.setAttribute("href", encodedUri);
  		link.setAttribute("download", "tournament.csv"); // The 'download' attribute sets the file name
  		document.body.appendChild(link); // Required for Firefox

  		link.click(); // Simulate a click to trigger download
  		document.body.removeChild(link); // Clean up the DOM
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
}
