class BracketManager {
	constructor() {
		this.bracketData = null;
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

	initializeBracket(competitorNames) {
		if (!competitorNames || competitorNames.length === 0) {
			return;
		}

		const numParticipants = this.getNextPowerOfTwo(competitorNames.length);
		this.competitors = [...competitorNames];

		while (this.competitors.length < numParticipants) {
			this.competitors.push('BYE');
		}

		this.bracketData = this.generateSingleEliminationBracket(this.competitors);
		this.renderBracket();
		this.saveToLocalStorage();
		this.updateUI();

		setTimeout(() => {
			if (this.isDraftMode) {
				this.attachDragAndDrop();
			}
		}, 100);
	}

	getParticipantList(participants) {
		if (this.participants) {
			return this.participants;
		}
		this.participants = participants.map((name, index) => ({
			id: index + 1,
			tournament_id: 1,
			name: name,
		}));
		if (!this.isPowerOfTwo(this.participants.length)) {
			const numToAdd = this.getNextPowerOfTwo(this.participants.length) - this.participants.length;
			for (let i = 0; i < numToAdd; i++) {
				this.participants.push({
					id: i + this.participants.length + 1,
					tournament_id: 1,
					name: 'BYE',
				});
			}
		}
		return this.participants;
	}

	isPowerOfTwo(n) {
		if (n <= 0) {
			return false;
		}
		return (n & (n - 1)) === 0;
	}

	getMatches(participants, numParticipants) {
		const matches = [];
		let matchId = 1;
		let matchesInRound = numParticipants / 2;
		let roundNumber = 1;
		const matchesPerRound = [];

		let tempMatchesInRound = numParticipants / 2;
		let totalRounds = 0;
		while (tempMatchesInRound >= 1) {
			totalRounds++;
			tempMatchesInRound = tempMatchesInRound / 2;
		}

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
					opponent1: null,
					opponent2: null,
					status: 0,
					next_match_id: null,
					metadata: {
						roundNumber: roundNumber,
						roundCount: totalRounds,
						matchLocation: 'single_bracket',
					},
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
							position: 0,
							score: undefined,
							result: undefined,
						};
					}

					if (p2Name && p2Name !== 'null') {
						// Use the index + 1 as the ID (matching participantList)
						match.opponent2 = {
							id: p2Index + 1,
							position: 1,
							score: undefined,
							result: undefined,
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
					const nextMatch = nextRound[nextRoundMatchIndex];
					match.next_match_id = nextMatch.id;

					const positionInNextMatch = i % 2 === 0 ? 0 : 1;
					match.metadata.connection = {
						toMatchId: nextMatch.id,
						toPosition: positionInNextMatch,
					};
				}
			}
		}

		return matches;
	}

	generateSingleEliminationBracket(participants) {
		const numParticipants = participants.length;
		const participantList = this.getParticipantList(participants);
		const matches = this.getMatches(participants, numParticipants);

		const stages = [
			{
				id: 1,
				tournament_id: 1,
				name: 'Tournament',
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

	ensureMatchMetadata() {
		if (!this.bracketData || !this.bracketData.matches) return;

		const rounds = new Set(this.bracketData.matches.map((m) => m.round_id));
		const roundCount = rounds.size;

		const matchesByRound = {};
		this.bracketData.matches.forEach((match) => {
			if (!matchesByRound[match.round_id]) {
				matchesByRound[match.round_id] = [];
			}
			matchesByRound[match.round_id].push(match);
		});

		Object.keys(matchesByRound).forEach((roundId) => {
			matchesByRound[roundId].sort((a, b) => a.number - b.number);
		});

		this.bracketData.matches.forEach((match) => {
			if (!match.metadata) {
				match.metadata = {};
			}
			if (match.metadata.roundNumber === undefined) {
				match.metadata.roundNumber = match.round_id;
			}
			if (match.metadata.roundCount === undefined) {
				match.metadata.roundCount = roundCount;
			}
			if (match.metadata.matchLocation === undefined) {
				match.metadata.matchLocation = 'single_bracket';
			}

			if (!match.metadata.connection && match.next_match_id) {
				const nextMatch = this.bracketData.matches.find((m) => m.id === match.next_match_id);
				if (nextMatch) {
					const currentRoundMatches = matchesByRound[match.round_id] || [];
					const matchIndex = currentRoundMatches.findIndex((m) => m.id === match.id);

					if (matchIndex >= 0) {
						const positionInNextMatch = matchIndex % 2 === 0 ? 0 : 1;
						match.metadata.connection = {
							toMatchId: nextMatch.id,
							toPosition: positionInNextMatch,
						};
					}
				}
			}
		});
	}

	renderBracket() {
		if (!this.bracketData) {
			this.showEmptyState();
			return;
		}

		this.ensureMatchMetadata();

		const container = document.getElementById('bracket-viewer');
		if (!container) {
			return;
		}

		container.innerHTML = '';
		this.hideEmptyState();

		if (typeof window.bracketsViewer === 'undefined') {
			return;
		}

		container.classList.toggle('draft-mode', this.isDraftMode);

		const renderConfig = {
			clear: true,
		};

		// In Active mode, enable match clicking for winner selection
		if (!this.isDraftMode) {
			renderConfig.onMatchClick = (match) => this.handleMatchClick(match);
		}

		window.bracketsViewer.render(this.bracketData, renderConfig);
		setTimeout(() => {
			if (this.isDraftMode) {
				this.attachDragAndDrop();
			}
		}, 300);
	}

	handleMatchClick(match) {
		// Only allow winner selection if both opponents are present
		if (!match.opponent1 || !match.opponent2 || match.opponent1.id === null || match.opponent2.id === null) {
			return; // Can't select winner without both competitors
		}

		// Don't allow changing already completed matches
		if (match.status === 4) {
			return; // Match already completed
		}

		// Open winner selection dialog
		this.openWinnerDialog(match);
	}

	openWinnerDialog(match) {
		const dialog = document.getElementById('winner-selection-dialog');
		if (!dialog) return;

		// Get participant names
		const participant1 = this.bracketData.participants.find((p) => p.id === match.opponent1.id);
		const participant2 = this.bracketData.participants.find((p) => p.id === match.opponent2.id);

		if (!participant1 || !participant2) return;

		// Set dialog content
		const comp1Name = dialog.querySelector('#winner-dialog-competitor1-name');
		const comp2Name = dialog.querySelector('#winner-dialog-competitor2-name');
		const comp1Button = dialog.querySelector('#winner-dialog-competitor1-button');
		const comp2Button = dialog.querySelector('#winner-dialog-competitor2-button');
		const confirmButton = dialog.querySelector('#winner-dialog-confirm');

		if (comp1Name) comp1Name.textContent = participant1.name;
		if (comp2Name) comp2Name.textContent = participant2.name;

		// Store match info on dialog for later use
		dialog.dataset.matchId = match.id;
		dialog.dataset.comp1Id = participant1.id;
		dialog.dataset.comp2Id = participant2.id;

		// Set default selection (competitor 1 wins)
		dialog.dataset.selectedWinner = participant1.id;
		if (comp1Button) {
			comp1Button.querySelector('.winner-status').textContent = 'W';
			comp1Button.classList.add('selected-winner');
		}
		if (comp2Button) {
			comp2Button.querySelector('.winner-status').textContent = 'L';
			comp2Button.classList.remove('selected-winner');
		}

		// Show dialog
		dialog.showModal();
	}

	selectWinner(matchId, winnerId) {
		const match = this.bracketData.matches.find((m) => m.id === matchId);
		if (!match) return;

		const participant1Id = match.opponent1.id;
		const participant2Id = match.opponent2.id;

		// Determine which opponent won
		const winnerPosition = participant1Id === winnerId ? 1 : 2;
		const loserPosition = winnerPosition === 1 ? 2 : 1;

		const winner = this._getOpponentAtPosition(match, winnerPosition);
		const loser = this._getOpponentAtPosition(match, loserPosition);

		// Mark match results
		this._setOpponentResult(winner, 'W');
		this._setOpponentResult(loser, 'L');
		match.status = 4; // Completed

		// Advance winner to next round
		if (match.next_match_id) {
			const nextMatch = this.bracketData.matches.find((m) => m.id === match.next_match_id);
			if (nextMatch) {
				// Determine position in next match based on connection metadata
				const connection = match.metadata?.connection;
				const targetPosition = connection ? connection.toPosition : match.number % 2 === 1 ? 0 : 1;

				const winnerOpponent = {
					id: winnerId,
					position: targetPosition,
					result: undefined,
					score: undefined,
				};

				if (targetPosition === 0) {
					nextMatch.opponent1 = winnerOpponent;
				} else {
					nextMatch.opponent2 = winnerOpponent;
				}
			}
		}

		// Save and re-render
		this.saveToLocalStorage();
		this.renderBracket();
	}

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

	handleParticipantMove(sourceElement, targetElement) {
		const sourceName = this._getCompetitorName(sourceElement);
		if (!sourceName) return;

		const sourceMatch = this.findMatchForElement(sourceElement);
		const targetMatch = this.findMatchForElement(targetElement);
		if (!sourceMatch || !targetMatch) return;

		const participant = this.bracketData.participants.find((p) => p.name === sourceName);
		if (!participant) return;

		const sourcePos = this.getPositionInMatch(sourceElement, sourceMatch);
		const targetPos = this.getPositionInMatch(targetElement, targetMatch);

		if (!this._isValidMove(sourceMatch, targetMatch, participant.id, sourcePos, targetPos)) {
			return;
		}

		if (sourceMatch.id === targetMatch.id) {
			this._handleSameMatchSwap(sourceMatch, sourcePos, targetPos);
		} else if (this._isForwardMove(sourceMatch, targetMatch)) {
			this._handleForwardMove(participant, sourceMatch, targetMatch, sourcePos, targetPos);
		} else {
			this._handleSameOrBackwardMove(sourceMatch, targetMatch, sourcePos, targetPos);
		}

		this.renderBracket();
		this.saveToLocalStorage();
	}

	_getCompetitorName(element) {
		const nameEl = element.querySelector('.name');
		return nameEl ? nameEl.textContent.trim().replace(/^#\d+\s*/, '') : element.textContent.trim();
	}

	_setOpponentResult(opponent, result) {
		if (!opponent) return;

		if (result === 'W') {
			opponent.result = 'win';
			opponent.score = 'W';
		} else if (result === 'L') {
			opponent.result = 'loss';
			opponent.score = 'L';
		} else {
			opponent.result = undefined;
			opponent.score = undefined;
		}
	}

	_isOpponentInMatch(participantId, match) {
		return (
			(match.opponent1 && match.opponent1.id === participantId) ||
			(match.opponent2 && match.opponent2.id === participantId)
		);
	}

	_wouldCreateSelfMatch(participantId, match, targetPosition) {
		const otherPosition = targetPosition === 1 ? 2 : 1;
		const otherOpponent = this._getOpponentAtPosition(match, otherPosition);
		return otherOpponent && otherOpponent.id === participantId;
	}

	_isForwardMove(sourceMatch, targetMatch) {
		return targetMatch.round_id > sourceMatch.round_id;
	}

	_isBackwardMove(sourceMatch, targetMatch) {
		return targetMatch.round_id < sourceMatch.round_id;
	}

	_isSameRoundMove(sourceMatch, targetMatch) {
		return targetMatch.round_id === sourceMatch.round_id;
	}

	_getOpponentAtPosition(match, position) {
		return position === 1 ? match.opponent1 : match.opponent2;
	}

	_setOpponentAtPosition(match, position, opponent) {
		if (position === 1) {
			match.opponent1 = opponent;
		} else {
			match.opponent2 = opponent;
		}
	}

	_clearMatchResults(match) {
		if (match.opponent1) {
			match.opponent1.result = undefined;
			match.opponent1.score = undefined;
		}
		if (match.opponent2) {
			match.opponent2.result = undefined;
			match.opponent2.score = undefined;
		}
		match.status = 0;
	}

	_clearParticipantFromLaterRounds(participantId, fromRoundId) {
		// This is used when a participant loses a match - they shouldn't be in future rounds
		if (!this.bracketData || !this.bracketData.matches) return;

		this.bracketData.matches.forEach((match) => {
			if (match.round_id > fromRoundId) {
				if (match.opponent1 && match.opponent1.id === participantId) {
					match.opponent1 = null;
				}
				if (match.opponent2 && match.opponent2.id === participantId) {
					match.opponent2 = null;
				}

				// Update match status if both opponents are now empty
				if (!match.opponent1 && !match.opponent2) {
					match.status = 0;
				} else if (match.opponent1 && !match.opponent2) {
					match.status = 0;
				} else if (!match.opponent1 && match.opponent2) {
					match.status = 0;
				}
			}
		});
	}

	// Public method for testing/validation
	validateMove(sourceElement, targetElement) {
		if (!sourceElement || !targetElement) return false;

		const sourceMatch = this.findMatchForElement(sourceElement);
		const targetMatch = this.findMatchForElement(targetElement);

		if (!sourceMatch || !targetMatch) return false;

		const sourceName = this._getCompetitorName(sourceElement);
		if (!sourceName) return false;

		const participant = this.bracketData.participants.find((p) => p.name === sourceName);
		if (!participant) return false;

		const sourcePos = this.getPositionInMatch(sourceElement, sourceMatch);
		const targetPos = this.getPositionInMatch(targetElement, targetMatch);

		return this._isValidMove(sourceMatch, targetMatch, participant.id, sourcePos, targetPos);
	}

	_isValidMove(sourceMatch, targetMatch, participantId, sourcePos, targetPos) {
		if (!sourceMatch || !targetMatch) return false;

		// Same match, same position = no-op (but valid, just ignored)
		if (sourceMatch.id === targetMatch.id && sourcePos === targetPos) {
			return false;
		}

		if (sourceMatch.id !== targetMatch.id) {
			if (this._wouldCreateSelfMatch(participantId, targetMatch, targetPos)) {
				return false;
			}
		}

		return true;
	}

	_handleSameMatchSwap(match, sourcePos, targetPos) {
		if (sourcePos === targetPos) return;

		const temp = match.opponent1;
		match.opponent1 = match.opponent2;
		match.opponent2 = temp;
	}

	_handleForwardMove(participant, sourceMatch, targetMatch, sourcePos, targetPos) {
		const isOnWinPath = this._isTargetOnWinPath(sourceMatch, targetMatch);

		if (!isOnWinPath) {
			console.log(`Invalid move: Target not on win path from R${sourceMatch.round_id}M${sourceMatch.number}`);
			return;
		}

		const wouldCreateInvalidBracket = this._wouldMoveCreateInvalidBracket(participant.id, sourceMatch, targetMatch);

		if (wouldCreateInvalidBracket) {
			console.log('Invalid bracket detected - resetting to clean state');
			this._resetBracketToCleanState();
		}

		// Clear the opponent from the same source match if they're in later rounds
		// This handles the case where both competitors from the same match are dragged forward
		this._clearOpponentFromSameSourceMatch(participant.id, sourceMatch);

		this._markMatchAsWon(sourceMatch, participant.id, sourcePos);

		if (targetMatch.round_id > sourceMatch.round_id + 1) {
			this.propagateAutoWin(participant, sourceMatch, targetMatch, sourceMatch.round_id, targetMatch.round_id);
		}

		this._placeParticipantInMatch(participant, targetMatch, targetPos);
	}

	_markMatchAsWon(match, winnerId, winnerPosition) {
		let winner = this._getOpponentAtPosition(match, winnerPosition);
		const loserPosition = winnerPosition === 1 ? 2 : 1;
		let loser = this._getOpponentAtPosition(match, loserPosition);

		if (winner && winner.id === winnerId) {
			this._setOpponentResult(winner, 'W');
			if (loser) {
				this._setOpponentResult(loser, 'L');
			}

			// Swap positions if winner is in position 2
			// Convention: Winner should be in position 1 for display clarity
			if (winnerPosition === 2 && loser) {
				this._setOpponentAtPosition(match, 1, winner);
				this._setOpponentAtPosition(match, 2, loser);
			} else {
				this._setOpponentAtPosition(match, winnerPosition, winner);
				if (loser) {
					this._setOpponentAtPosition(match, loserPosition, loser);
				}
			}
		}

		match.status = 4;
	}

	_placeParticipantInMatch(participant, match, targetPos) {
		const targetOccupant = this._getOpponentAtPosition(match, targetPos);
		const otherPos = targetPos === 1 ? 2 : 1;
		let otherOccupant = this._getOpponentAtPosition(match, otherPos);

		if (targetOccupant && targetOccupant.id !== null && targetOccupant.id !== participant.id) {
			if (!otherOccupant || otherOccupant.id === null) {
				targetPos = otherPos;
			}
		}

		otherOccupant = this._getOpponentAtPosition(
			match,
			otherPos === targetPos ? (targetPos === 1 ? 2 : 1) : otherPos
		);

		const newOpponent = {
			id: participant.id,
			position: targetPos === 1 ? 0 : 1,
			result: undefined,
			score: undefined,
		};

		if (otherOccupant && otherOccupant.id) {
			if (otherOccupant.result === 'win' || otherOccupant.score === 'W') {
				newOpponent.result = 'loss';
				newOpponent.score = 'L';
			} else if (otherOccupant.result === 'loss' || otherOccupant.score === 'L') {
				newOpponent.result = 'win';
				newOpponent.score = 'W';
			}
		}

		this._setOpponentAtPosition(match, targetPos, newOpponent);

		if (newOpponent.result === 'win' || (otherOccupant && otherOccupant.result === 'win')) {
			match.status = 4;
		} else if (otherOccupant && otherOccupant.id) {
			match.status = 0;
		}
	}

	_displaceParticipantForward(occupant, currentMatch) {
		// Don't displace losers - they lost and shouldn't advance
		if (occupant.result === 'loss' || occupant.score === 'L') {
			return;
		}

		const displacedParticipant = this.bracketData.participants.find((p) => p.id === occupant.id);
		if (!displacedParticipant) return;

		const nextRound = currentMatch.round_id + 1;
		const nextMatches = this.bracketData.matches.filter((m) => m.round_id === nextRound);
		if (nextMatches.length === 0) return;

		const matchIndex = currentMatch.number - 1;
		const nextMatchIndex = Math.floor(matchIndex / 2);
		const nextMatch = nextMatches[nextMatchIndex];
		if (!nextMatch) return;

		const nextPosition = matchIndex % 2 === 0 ? 0 : 1;
		const nextPositionIndex = nextPosition === 0 ? 1 : 2;
		const nextOpp = this._getOpponentAtPosition(nextMatch, nextPositionIndex);

		if (!nextOpp || nextOpp.id === null || nextOpp.id === displacedParticipant.id) {
			const newOpponent = {
				id: displacedParticipant.id,
				position: nextPosition,
				result: undefined,
				score: undefined,
			};
			this._setOpponentAtPosition(nextMatch, nextPositionIndex, newOpponent);
		}
	}

	_areSameBranch(match1, match2) {
		// Cross-branch detection ONLY applies to Round 1 matches
		// This is because the bracket tree structure is defined by R1 matches feeding into R2
		// We care about moves like R1M1 → R1M4 (different branches)
		// We don't care about moves like R1M1 → R2M1 (forward within same branch)
		if (match1.round_id !== 1 || match2.round_id !== 1) {
			return true;
		}

		if (!match1.next_match_id || !match2.next_match_id) {
			return true;
		}

		return match1.next_match_id === match2.next_match_id;
	}

	_isTargetOnWinPath(sourceMatch, targetMatch) {
		// Check if targetMatch is on the natural win path from sourceMatch
		// Win path follows: sourceMatch → next_match → next_match.next_match → ... → final
		if (sourceMatch.id === targetMatch.id) {
			return true;
		}

		let currentMatch = sourceMatch;
		while (currentMatch && currentMatch.next_match_id) {
			currentMatch = this.bracketData.matches.find((m) => m.id === currentMatch.next_match_id);
			if (currentMatch && currentMatch.id === targetMatch.id) {
				return true;
			}
		}

		return false;
	}

	_wouldMoveCreateInvalidBracket(participantId, sourceMatch, targetMatch) {
		// Check if moving this participant would create an impossible bracket
		// An impossible bracket is one where two participants from DIFFERENT R1 matches
		// whose paths converge before the target are both placed past their convergence point
		if (sourceMatch.round_id !== 1) {
			return false;
		}

		const sourceR1Match = this._findOriginMatch(participantId, 1);
		if (!sourceR1Match) return false;

		let currentMatch = sourceMatch;
		const matchesToCheck = [];

		while (currentMatch && currentMatch.id !== targetMatch.id) {
			if (currentMatch.next_match_id) {
				currentMatch = this.bracketData.matches.find((m) => m.id === currentMatch.next_match_id);
				if (currentMatch) matchesToCheck.push(currentMatch);
			} else {
				break;
			}
		}

		for (const match of matchesToCheck) {
			const opp1 = match.opponent1;
			const opp2 = match.opponent2;

			for (const opp of [opp1, opp2]) {
				if (!opp || !opp.id || opp.id === participantId) continue;

				const oppR1Match = this._findOriginMatch(opp.id, 1);

				if (!oppR1Match || oppR1Match.id === sourceR1Match.id) continue;

				if (this._doPathsConvergeBeforeMatch(sourceR1Match, oppR1Match, match)) {
					return true;
				}
			}
		}

		return false;
	}

	_doPathsConvergeBeforeMatch(match1, match2, beforeMatch) {
		// Check if paths from match1 and match2 meet before reaching beforeMatch
		const path1 = this._getWinPathMatches(match1);
		const path2 = this._getWinPathMatches(match2);

		for (let i = 0; i < path1.length && i < path2.length; i++) {
			if (path1[i].id === path2[i].id) {
				if (path1[i].round_id < beforeMatch.round_id) {
					return true;
				}
				return false;
			}
		}

		return false;
	}

	_getWinPathMatches(fromMatch) {
		const path = [];
		let current = fromMatch;

		while (current) {
			path.push(current);
			if (!current.next_match_id) break;
			current = this.bracketData.matches.find((m) => m.id === current.next_match_id);
		}

		return path;
	}

	_resetBracketToCleanState() {
		// Reset all matches to clean state: keep participants in R1, clear all W/L results
		if (!this.bracketData || !this.bracketData.matches) return;

		this.bracketData.matches.forEach((match) => {
			if (match.round_id === 1) {
				if (match.opponent1) {
					match.opponent1.result = undefined;
					match.opponent1.score = undefined;
				}
				if (match.opponent2) {
					match.opponent2.result = undefined;
					match.opponent2.score = undefined;
				}
				match.status = 0;
			} else {
				match.opponent1 = null;
				match.opponent2 = null;
				match.status = 0;
			}
		});
	}

	_findOriginMatch(participantId, targetRound) {
		// Find which match in targetRound this participant originally came from
		// Used to detect cross-branch conflicts
		if (!this.bracketData || !this.bracketData.matches) return null;

		return this.bracketData.matches.find((match) => {
			if (match.round_id !== targetRound) return false;
			const hasInOpp1 = match.opponent1 && match.opponent1.id === participantId;
			const hasInOpp2 = match.opponent2 && match.opponent2.id === participantId;
			return hasInOpp1 || hasInOpp2;
		});
	}

	_doPathsDivergeBeforeTarget(match1, match2, targetMatch) {
		// Check if paths from match1 and match2 converge before reaching target
		// If they converge at an intermediate match before target, that's a conflict
		// because only one can advance past the convergence point
		let current1 = match1;
		const path1Matches = new Set([match1.id]);
		while (current1 && current1.next_match_id && current1.id !== targetMatch.id) {
			current1 = this.bracketData.matches.find((m) => m.id === current1.next_match_id);
			if (current1) path1Matches.add(current1.id);
		}

		let current2 = match2;
		const path2Matches = new Set([match2.id]);
		while (current2 && current2.next_match_id && current2.id !== targetMatch.id) {
			current2 = this.bracketData.matches.find((m) => m.id === current2.next_match_id);
			if (current2) path2Matches.add(current2.id);
		}

		path1Matches.delete(targetMatch.id);
		path2Matches.delete(targetMatch.id);

		for (const matchId of path1Matches) {
			if (path2Matches.has(matchId) && matchId !== match1.id && matchId !== match2.id) {
				return true;
			}
		}

		return false;
	}

	_clearAllLaterRoundResults(fromRound) {
		// Clear results and opponents from all matches in rounds after fromRound
		if (!this.bracketData || !this.bracketData.matches) return;

		this.bracketData.matches.forEach((match) => {
			if (match.round_id > fromRound) {
				match.opponent1 = null;
				match.opponent2 = null;
				match.status = 0;
			}
		});
	}

	_clearOtherRound1Results(exceptMatchId) {
		// Clear results (W/L) from all Round 1 matches except the specified one
		// Used during cross-branch resets to clear stale results
		if (!this.bracketData || !this.bracketData.matches) return;

		this.bracketData.matches.forEach((match) => {
			if (match.round_id === 1 && match.id !== exceptMatchId) {
				this._clearMatchResults(match);
			}
		});
	}

	_clearOpponentFromSameSourceMatch(participantId, sourceMatch) {
		if (!this.bracketData || !this.bracketData.matches) return null;

		let opponentId = null;
		if (sourceMatch.opponent1 && sourceMatch.opponent1.id === participantId) {
			opponentId = sourceMatch.opponent2?.id;
		} else if (sourceMatch.opponent2 && sourceMatch.opponent2.id === participantId) {
			opponentId = sourceMatch.opponent1?.id;
		}

		if (!opponentId) return null;

		this._clearParticipantFromLaterRounds(opponentId, sourceMatch.round_id);

		return opponentId;
	}

	_handleSameOrBackwardMove(sourceMatch, targetMatch, sourcePos, targetPos) {
		const sourceOpp = this._getOpponentAtPosition(sourceMatch, sourcePos);
		const targetOpp = this._getOpponentAtPosition(targetMatch, targetPos);

		if (sourceOpp && targetOpp && sourceOpp.id === targetOpp.id) {
			return;
		}

		const isCrossBranch =
			sourceMatch.round_id === 1 && targetMatch.round_id === 1 && !this._areSameBranch(sourceMatch, targetMatch);

		if (isCrossBranch) {
			// Cross-branch move: clear ALL later round results
			// When moving between branches in Round 1, all subsequent rounds must be reset
			this._clearAllLaterRoundResults(1);
		}

		this._setOpponentAtPosition(sourceMatch, sourcePos, targetOpp);
		this._setOpponentAtPosition(targetMatch, targetPos, sourceOpp);

		this._clearMatchResults(sourceMatch);
		this._clearMatchResults(targetMatch);
	}

	findMatchForElement(element) {
		const matchEl = element.closest('.match[data-match-id]');
		if (!matchEl) return null;

		const matchId = parseInt(matchEl.getAttribute('data-match-id'));
		return this.bracketData.matches.find((m) => m.id === matchId);
	}

	getPositionInMatch(element, match) {
		const matchEl = element.closest('.match');
		const participants = matchEl.querySelectorAll('.participant');
		const index = Array.from(participants).indexOf(element);
		return index + 1;
	}

	propagateAutoWin(participant, sourceMatch, targetMatch, fromRound, toRound) {
		let currentMatch = sourceMatch;

		for (let round = fromRound + 1; round < toRound; round++) {
			const nextMatch = this.advanceToNextRound(currentMatch, participant.id);
			if (!nextMatch) break;

			const isOpponent1 = nextMatch.opponent1 && nextMatch.opponent1.id === participant.id;
			const isOpponent2 = nextMatch.opponent2 && nextMatch.opponent2.id === participant.id;

			if (!isOpponent1 && !isOpponent2) {
				const matchIndex = currentMatch.number - 1;
				const position = matchIndex % 2 === 0 ? 0 : 1;

				if (position === 0) {
					nextMatch.opponent1 = { id: participant.id, position: 0, result: 'win', score: 'W' };
				} else {
					nextMatch.opponent2 = { id: participant.id, position: 1, result: 'win', score: 'W' };
				}
			} else {
				if (isOpponent1) {
					nextMatch.opponent1.result = 'win';
					nextMatch.opponent1.score = 'W';
					if (nextMatch.opponent2 && nextMatch.opponent2.id) {
						nextMatch.opponent2.result = 'loss';
						nextMatch.opponent2.score = 'L';
					}
				} else {
					nextMatch.opponent2.result = 'win';
					nextMatch.opponent2.score = 'W';
					if (nextMatch.opponent1 && nextMatch.opponent1.id) {
						nextMatch.opponent1.result = 'loss';
						nextMatch.opponent1.score = 'L';
					}
				}
			}

			nextMatch.status = 4;
			currentMatch = nextMatch;
		}
	}

	advanceToNextRound(match, winnerId) {
		const nextRound = match.round_id + 1;
		const nextMatches = this.bracketData.matches.filter((m) => m.round_id === nextRound);
		if (nextMatches.length === 0) return null;

		const matchIndex = match.number - 1;
		const nextMatchIndex = Math.floor(matchIndex / 2);
		const nextMatch = nextMatches[nextMatchIndex];
		if (!nextMatch) return null;

		const isAlreadyInMatch =
			(nextMatch.opponent1 && nextMatch.opponent1.id === winnerId) ||
			(nextMatch.opponent2 && nextMatch.opponent2.id === winnerId);
		if (isAlreadyInMatch) {
			return nextMatch;
		}

		const position = matchIndex % 2 === 0 ? 0 : 1;
		const winnerOpp = { id: winnerId, position, result: 'win', score: 'W' };

		if (position === 0) {
			nextMatch.opponent1 = winnerOpp;
		} else {
			nextMatch.opponent2 = winnerOpp;
		}
		return nextMatch;
	}

	findParticipantByName(name) {
		if (!this.bracketData || !this.bracketData.participants) {
			return null;
		}
		return this.bracketData.participants.find((p) => p.name === name) || null;
	}

	findParticipantLocation(participantId) {
		if (!this.bracketData || !this.bracketData.matches) {
			return null;
		}

		for (const match of this.bracketData.matches) {
			if (
				(match.opponent1 && match.opponent1.id === participantId) ||
				(match.opponent2 && match.opponent2.id === participantId)
			) {
				return {
					round: match.round_id,
					matchId: match.id,
					position: match.opponent1 && match.opponent1.id === participantId ? 1 : 2,
				};
			}
		}
		return null;
	}

	handleModeChange(isActiveMode) {
		this.isDraftMode = !isActiveMode;
		this.updateUI();

		if (this.bracketData) {
			this.renderBracket();
		}
	}

	updateUI() {
		const draftControls = document.getElementById('draft-mode-controls');
		const emptyState = document.getElementById('bracket-empty-state');
		const bracketContainer = document.getElementById('bracket-viewer-container');
		const competitorListContainer = document.getElementById('competitor-list-container');

		if (this.bracketData) {
			if (emptyState) emptyState.style.display = 'none';
			if (bracketContainer) bracketContainer.style.display = 'block';

			if (this.isDraftMode && draftControls) {
				draftControls.style.display = 'flex';
				if (competitorListContainer) {
					competitorListContainer.style.display = 'block';
					this.renderCompetitorList();
				}
			} else if (draftControls) {
				draftControls.style.display = 'none';
				if (competitorListContainer) {
					competitorListContainer.style.display = 'none';
				}
			}
		} else {
			if (emptyState) emptyState.style.display = 'block';
			if (bracketContainer) bracketContainer.style.display = 'none';
			if (draftControls) draftControls.style.display = 'none';
			if (competitorListContainer) competitorListContainer.style.display = 'none';
		}
	}

	showEmptyState() {
		const emptyState = document.getElementById('bracket-empty-state');
		const bracketContainer = document.getElementById('bracket-viewer-container');

		if (emptyState) emptyState.style.display = 'block';
		if (bracketContainer) bracketContainer.style.display = 'none';
	}

	hideEmptyState() {
		const emptyState = document.getElementById('bracket-empty-state');
		if (emptyState) emptyState.style.display = 'none';
	}

	renderCompetitorList() {
		const competitorList = document.getElementById('competitor-list');
		if (!competitorList || !this.competitors) return;

		competitorList.innerHTML = '';
		const validCompetitors = this.competitors.filter((c) => c && c !== 'BYE');

		validCompetitors.forEach((competitor) => {
			const li = document.createElement('li');
			li.className = 'p-2 bg-secondary text-secondary-foreground rounded-md text-sm';
			li.textContent = competitor;
			competitorList.appendChild(li);
		});
	}

	validateBracket() {
		const errors = [];

		if (!this.bracketData) {
			errors.push('No bracket data available');
			return { isValid: false, errors };
		}

		return { isValid: errors.length === 0, errors };
	}

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

	sendToBackend() {
		if (!this.bracketData) {
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

	updateCompetitorCount(count) {
		const numCompetitors = parseInt(count, 10);

		if (isNaN(numCompetitors) || numCompetitors < 2) {
			alert('Please enter a valid number of competitors (minimum 2)');
			return;
		}

		const competitorNames = [];
		for (let i = 1; i <= numCompetitors; i++) {
			competitorNames.push(`Competitor ${i}`);
		}

		this.initializeBracket(competitorNames);
	}

	resetBracket() {
		if (!this.competitors || this.competitors.length === 0) {
			return;
		}

		const nonNullCompetitors = this.competitors.filter((c) => c !== null && c !== 'BYE');
		this.initializeBracket(nonNullCompetitors);
	}

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

	window.resetBracket = function () {
		if (window.bracketManager) {
			window.bracketManager.resetBracket();
		}
	};

	document.addEventListener('DOMContentLoaded', () => {
		const competitorInput = document.getElementById('competitor-count-input');
		if (competitorInput) {
			competitorInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					const count = parseInt(competitorInput.value, 10);
					if (window.bracketManager) {
						window.bracketManager.updateCompetitorCount(count);
					}
				}
			});
		}
	});
}
