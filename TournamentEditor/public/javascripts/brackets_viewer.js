class BracketsViewer {
	constructor() {
		this.participantRefs = {};
		this.participants = [];
		this.highlightParticipantOnHover = true;
		this._onMatchClick = () => {};
	}

	async render(data, config) {
		const root = document.createDocumentFragment();

		if (config) {
			if (config.highlightParticipantOnHover !== undefined) {
				this.highlightParticipantOnHover = config.highlightParticipantOnHover;
			}
			if (config.onMatchClick) {
				this._onMatchClick = config.onMatchClick;
			}
		}

		if (!data.stages) {
			data.stages = [];
		}

		if (!data.participants) {
			data.participants = [];
		}

		if (!data.matches) {
			data.matches = [];
		}

		this.participants = data.participants;
		data.participants.forEach((participant) => {
			this.participantRefs[participant.id] = [];
		});

		data.stages.forEach((stage) => {
			if (stage.type === 'single_elimination') {
				this.renderSingleEliminationStage(root, {
					stage: stage,
					matches: data.matches.filter((match) => match.stage_id === stage.id),
					participants: data.participants,
				});
			}
		});

		const target = this.findRoot(config?.selector);
		if (config?.clear) {
			target.innerHTML = '';
		}

		target.append(root);
	}

	renderSingleEliminationStage(root, data) {
		const stage = data.stage;
		const matches = data.matches || [];

		const matchesByRound = this.groupMatchesByRound(matches);

		const container = this.createEliminationContainer(stage.id);
		container.append(this.createTitle(stage.name || 'Tournament'));

		this.renderBracket(container, matchesByRound);

		root.append(container);
	}

	groupMatchesByRound(matches) {
		const rounds = {};
		matches.forEach((match) => {
			const roundId = match.round_id || match.metadata?.roundNumber || 1;
			if (!rounds[roundId]) {
				rounds[roundId] = [];
			}
			rounds[roundId].push(match);
		});

		const sortedRoundIds = Object.keys(rounds)
			.map(Number)
			.sort((a, b) => a - b);
		return sortedRoundIds.map((roundId) => {
			return rounds[roundId].sort((a, b) => (a.number || 0) - (b.number || 0));
		});
	}

	renderBracket(container, matchesByRound) {
		const bracketContainer = this.createBracketContainer();
		const roundsContainer = this.createRoundsContainer();

		const roundCount = matchesByRound.length;

		matchesByRound.forEach((roundMatches, roundIndex) => {
			const roundNumber = roundIndex + 1;
			const roundId = roundMatches[0]?.round_id || roundNumber;
			const roundName = this.getRoundName(roundNumber, roundCount);

			const roundContainer = this.createRoundContainer(roundId, roundName);

			roundMatches.forEach((match) => {
				const matchElement = this.createBracketMatch(match, roundNumber, roundCount);
				roundContainer.append(matchElement);
			});

			roundsContainer.append(roundContainer);
		});

		bracketContainer.append(roundsContainer);
		container.append(bracketContainer);
	}

	createBracketMatch(match, roundNumber, roundCount) {
		const matchContainer = this.createMatchContainer(match);
		const opponents = this.createOpponentsContainer(() => this._onMatchClick(match));

		const metadata = match.metadata || {};
		const connection = metadata.connection;

		const participant1 = this.createParticipant(match.opponent1, true);
		const participant2 = this.createParticipant(match.opponent2, true);

		if (metadata.label) {
			const label = this.createMatchLabel(metadata.label);
			opponents.append(label);
		}

		opponents.append(participant1, participant2);
		matchContainer.append(opponents);

		if (connection) {
			this.setupConnection(opponents, matchContainer, connection, roundNumber);
		}

		return matchContainer;
	}

	createParticipant(participantResult, propagateHighlight) {
		const participantContainer = this.createParticipantContainer(participantResult?.id);
		const nameContainer = this.createNameContainer();
		const resultContainer = this.createResultContainer();

		if (!participantResult || participantResult.id === null) {
			// Empty slot
			nameContainer.innerText = '-';
			resultContainer.innerText = '-';
		} else {
			const participant = this.participants.find((p) => p.id === participantResult.id);
			if (participant) {
				const name = participant.name || '';
				nameContainer.innerText = name;
				participantContainer.setAttribute('title', name);
				participantContainer.setAttribute('data-participant-id', participant.id);

				participantContainer.classList.add('participant');
			} else {
				nameContainer.innerText = '-';
			}

			if (participantResult.result === 'win' || participantResult.score === 'W') {
				resultContainer.innerText = 'W';
			} else if (participantResult.result === 'loss' || participantResult.score === 'L') {
				resultContainer.innerText = 'L';
			} else if (participantResult.score !== undefined && participantResult.score !== null) {
				resultContainer.innerText = participantResult.score.toString();
			} else {
				resultContainer.innerText = '-';
			}

			if (participantResult.result === 'win') {
				participantContainer.classList.add('win');
			} else if (participantResult.result === 'loss') {
				participantContainer.classList.add('loss');
			}
		}

		participantContainer.append(nameContainer, resultContainer);

		if (participantResult && participantResult.id !== null) {
			this.setupMouseHover(participantResult.id, participantContainer, propagateHighlight);
		}

		return participantContainer;
	}

	setupMouseHover(participantId, element, propagateHighlight) {
		if (!this.highlightParticipantOnHover) return;

		const setupListeners = (elements) => {
			element.addEventListener('mouseenter', () => {
				elements.forEach((el) => el.classList.add('hover'));
			});

			element.addEventListener('mouseleave', () => {
				elements.forEach((el) => el.classList.remove('hover'));
			});
		};

		if (!propagateHighlight) {
			setupListeners([element]);
			return;
		}

		if (!this.participantRefs[participantId]) {
			this.participantRefs[participantId] = [];
		}

		this.participantRefs[participantId].push(element);
		setupListeners(this.participantRefs[participantId]);
	}

	setupConnection(opponents, matchContainer, connection, roundNumber) {
		if (!connection) return;

		const { toMatchId, toPosition } = connection;

		matchContainer.classList.add('connect-next');

		if (roundNumber > 1) {
			opponents.classList.add('connect-previous');
		}

		matchContainer.setAttribute('data-next-match-id', toMatchId);
		opponents.setAttribute('data-next-position', toPosition);
	}

	getRoundName(roundNumber, roundCount) {
		if (roundNumber === roundCount) {
			return 'Final';
		} else {
			return `Round ${roundNumber}`;
		}
	}

	findRoot(selector) {
		if (selector) {
			const element = document.querySelector(selector);
			if (element) return element;
		}
		const element = document.getElementById('bracket-viewer');
		if (!element) {
			throw Error('Bracket viewer container not found. Expected element with id="bracket-viewer"');
		}
		return element;
	}

	createEliminationContainer(stageId) {
		const container = document.createElement('div');
		container.className = 'bracket';
		container.setAttribute('data-stage-id', stageId);
		return container;
	}

	createBracketContainer() {
		const container = document.createElement('div');
		container.className = 'bracket';
		return container;
	}

	createRoundsContainer() {
		const container = document.createElement('div');
		container.className = 'rounds';
		return container;
	}

	createRoundContainer(roundId, roundName) {
		const container = document.createElement('article');
		container.className = 'round';
		container.setAttribute('data-round-id', roundId);

		const title = document.createElement('h3');
		title.textContent = roundName;
		container.append(title);

		return container;
	}

	createMatchContainer(match) {
		const container = document.createElement('div');
		container.className = 'match';
		if (match.id) {
			container.setAttribute('data-match-id', match.id);
		}
		if (match.status !== undefined) {
			container.setAttribute('data-match-status', match.status.toString());
		}
		return container;
	}

	createOpponentsContainer(onClick) {
		const container = document.createElement('div');
		container.className = 'opponents';
		if (onClick) {
			container.addEventListener('click', onClick);
		}
		return container;
	}

	createParticipantContainer(participantId) {
		const container = document.createElement('div');
		container.className = 'participant';
		if (participantId) {
			container.setAttribute('data-participant-id', participantId);
		}
		return container;
	}

	createNameContainer() {
		const container = document.createElement('div');
		container.className = 'name';
		return container;
	}

	createResultContainer() {
		const container = document.createElement('div');
		container.className = 'result';
		return container;
	}

	createMatchLabel(text) {
		const label = document.createElement('span');
		label.className = 'match-label';
		label.textContent = text;
		return label;
	}

	createTitle(text) {
		const title = document.createElement('h2');
		title.textContent = text;
		return title;
	}
}

if (typeof window !== 'undefined') {
	window.bracketsViewer = new BracketsViewer();
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = BracketsViewer;
}
