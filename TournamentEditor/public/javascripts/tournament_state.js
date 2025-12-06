class TournamentState {
	constructor() {
		this.bracketMode = this._loadBracketModeFromStorage();
	}

	setBracketMode(isActive) {
		this.bracketMode = isActive;
		this._saveBracketModeToStorage(isActive);
		this._notifyChange('bracketMode');
	}

	_saveBracketModeToStorage(isActive) {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('tournament_bracket_mode', isActive ? 'active' : 'draft');
		}
	}

	_loadBracketModeFromStorage() {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem('tournament_bracket_mode');
			if (stored === 'active') {
				return true;
			} else if (stored === 'draft') {
				return false;
			}
		}
		// Default to Draft mode if nothing stored
		return false;
	}

	isActiveMode() {
		return this.bracketMode;
	}

	getBracketModeString() {
		return this.bracketMode ? 'active' : 'draft';
	}

	getDraftBracket() {
		if (typeof window !== 'undefined' && window.bracketManager) {
			return window.bracketManager.bracketData;
		}
		return null;
	}

	_notifyChange(changeType) {
		if (typeof window !== 'undefined' && window.dispatchEvent) {
			window.dispatchEvent(
				new CustomEvent('tournamentStateChanged', {
					detail: {
						changeType: changeType,
						bracketMode: this.bracketMode,
					},
				})
			);
		}
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = TournamentState;
}

if (typeof window !== 'undefined') {
	window.TournamentState = TournamentState;

	if (!window.tournamentState) {
		window.tournamentState = new TournamentState();
	}
}
