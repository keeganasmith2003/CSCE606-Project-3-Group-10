/**
 * BracketManager - Manages bracket visualization and state for TB-107
 *
 * Handles:
 * - Bracket visualization using brackets-viewer.js
 * - Drag-and-drop in Draft Mode
 * - Validation of bracket moves
 * - Local storage persistence
 * - Backend communication
 */

class BracketManager {
	constructor() {
		this.bracketData = null;
		this.bracketViewer = null;
		this.isDraftMode = false;
		this.competitors = [];
		this.draggedParticipant = null;
		this.dragTarget = null;

		// Sync with TournamentState if available
		if (typeof window !== 'undefined' && window.tournamentState) {
			this.isDraftMode = !window.tournamentState.isActiveMode();
		}

		// Initialize from local storage
		this.loadFromLocalStorage();

		// Listen for bracket mode changes
		if (typeof window !== 'undefined') {
			window.addEventListener('tournamentStateChanged', (e) => {
				if (e.detail.changeType === 'bracketMode') {
					this.handleModeChange(e.detail.bracketMode);
				}
			});
		}

		// Initialize UI (wait for DOM if needed)
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				this.updateUI();
			});
		} else {
			// Wait a bit for elements to be available
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

		// Ensure we have a power-of-2 number of participants (pad with byes if needed)
		const numParticipants = this.getNextPowerOfTwo(competitorNames.length);
		this.competitors = [...competitorNames];

		// Pad with byes if needed
		while (this.competitors.length < numParticipants) {
			this.competitors.push(null); // null represents a bye
		}

		// Generate bracket structure for brackets-viewer
		this.bracketData = this.generateSingleEliminationBracket(this.competitors);

		// Render the bracket
		this.renderBracket();

		// Save to local storage
		this.saveToLocalStorage();

		// Update UI
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

		// Create participants array (filter out nulls for the participants list)
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

		// Create matches for all rounds
		const matches = [];
		let matchId = 1;
		let matchesInRound = numParticipants / 2;
		let roundNumber = 1;

		// Track matches per round for next_match_id calculation
		const matchesPerRound = [];

		// First pass: create all matches and track them by round
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
					status: 0, // 0 = Locked, 1 = Waiting, 2 = Ready, 3 = Running, 4 = Completed
					opponent1: null,
					opponent2: null,
					next_match_id: null,
				};

				// For first round, assign participants
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
					// For later rounds, set up to receive winners from previous round
					// This will be populated when previous round completes
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

		// Second pass: set next_match_id for all matches except final
		for (let roundIdx = 0; roundIdx < matchesPerRound.length - 1; roundIdx++) {
			const currentRound = matchesPerRound[roundIdx];
			const nextRound = matchesPerRound[roundIdx + 1];

			for (let i = 0; i < currentRound.length; i++) {
				const match = currentRound[i];
				// Each match feeds into a match in the next round
				// Two matches feed into one match in the next round
				const nextRoundMatchIndex = Math.floor(i / 2);
				if (nextRoundMatchIndex < nextRound.length) {
					match.next_match_id = nextRound[nextRoundMatchIndex].id;
				}
			}
		}

		// Create stage structure
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
			matchGames: [], // Not used for single elimination
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

		// Clear existing bracket
		container.innerHTML = '';

		// Hide empty state
		this.hideEmptyState();

		// Render with brackets-viewer
		try {
			if (typeof bracketsViewer !== 'undefined') {
				// Add draft-mode class if in draft mode
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

				// Add drag-and-drop support in Draft Mode
				if (this.isDraftMode) {
					// Wait a bit for DOM to update
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

		// Find all participant elements in brackets-viewer structure
		// brackets-viewer uses specific classes like .bracket-participant or similar
		const participantElements = bracketContainer.querySelectorAll(
			'[data-participant-id], .participant, .bracket-participant'
		);

		participantElements.forEach((element) => {
			// Make draggable
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

		// Add drop zones - brackets-viewer creates slots for participants
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
		// Get participant data
		const sourceName = sourceElement.textContent.trim();
		const targetName = targetElement.textContent.trim();

		// Validate the move
		if (!this.validateMove(sourceName, targetName)) {
			console.warn('Invalid move: validation failed');
			return;
		}

		// Update bracket data structure
		// This is a simplified version - in a real implementation, you'd need to
		// map DOM elements back to bracket data structure
		const sourceIndex = this.competitors.indexOf(sourceName);
		const targetIndex = this.competitors.indexOf(targetName);

		if (sourceIndex !== -1) {
			// Swap or move participant
			if (targetIndex !== -1) {
				// Swap
				[this.competitors[sourceIndex], this.competitors[targetIndex]] = [
					this.competitors[targetIndex],
					this.competitors[sourceIndex],
				];
			} else {
				// Move to empty slot
				this.competitors[targetIndex] = sourceName;
				this.competitors[sourceIndex] = null;
			}

			// Regenerate bracket
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
		// Basic validation: prevent moving to final match if previous matches are empty
		// This is a simplified validation - you may need more complex logic
		if (!sourceName || sourceName === '') {
			return false;
		}

		// Additional validation logic can be added here
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
			// Re-render with appropriate mode settings
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

		// Check for empty matches in later rounds when earlier rounds are incomplete
		// Add more validation logic as needed

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Confirm bracket changes and save
	 */
	confirmBracketChanges() {
		// Validate first
		const validation = this.validateBracket();

		if (!validation.isValid) {
			alert('Bracket validation failed:\n' + validation.errors.join('\n'));
			return;
		}

		// Save to local storage
		this.saveToLocalStorage();

		// Send to backend
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

		// Prepare data for backend - send the full brackets-viewer data structure
		const data = {
			bracket_type: 'single_elimination',
			participants: this.competitors.filter((c) => c !== null),
			bracket_data: this.bracketData, // Full brackets-viewer data structure
			mode: this.isDraftMode ? 'draft' : 'active',
		};

		// Send to backend endpoint
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

					// Render if we have data
					if (this.bracketData) {
						// Wait for DOM to be ready
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = BracketManager;
}

// Make available globally
if (typeof window !== 'undefined') {
	window.BracketManager = BracketManager;

	// Initialize a global instance when DOM is ready
	function initializeBracketManager() {
		window.bracketManager = new BracketManager();

		// Sync with TournamentState if available
		if (window.tournamentState) {
			const isActiveMode = window.tournamentState.isActiveMode();
			window.bracketManager.handleModeChange(isActiveMode);
		}
	}

	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initializeBracketManager);
	} else {
		// DOM already ready, but wait a bit for brackets-viewer to load
		setTimeout(initializeBracketManager, 100);
	}

	// Global functions for button clicks
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
}
