/**
 * TournamentState - Manages the bracket mode state for TB-106
 *
 * Tracks:
 * - bracketMode: Boolean (true = Active, false = Draft)
 *
 * Note: Competitor management, matches, and CSV export functionality
 * are implemented in separate issues (TB-104, TB-102, etc.)
 */
class TournamentState {
	constructor() {
		this.bracketMode = false; // false = Draft, true = Active
	}

	/**
	 * Set the bracket mode
	 * @param {boolean} isActive - true for Active mode, false for Draft mode
	 */
	setBracketMode(isActive) {
		this.bracketMode = isActive;
		this._notifyChange('bracketMode');
	}

	/**
	 * Get the current bracket mode
	 * @returns {boolean} true if Active mode, false if Draft mode
	 */
	isActiveMode() {
		return this.bracketMode;
	}

	/**
	 * Get the current bracket mode as string
	 * @returns {string} 'active' or 'draft'
	 */
	getBracketModeString() {
		return this.bracketMode ? 'active' : 'draft';
	}

	/**
	 * Notify listeners of state changes
	 * @private
	 * @param {string} changeType - Type of change that occurred
	 */
	_notifyChange(changeType) {
		// Dispatch custom event for state changes
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = TournamentState;
}

// Make available globally
if (typeof window !== 'undefined') {
	window.TournamentState = TournamentState;

	// Initialize a global instance only if it doesn't already exist
	if (!window.tournamentState) {
		window.tournamentState = new TournamentState();
	}
}
