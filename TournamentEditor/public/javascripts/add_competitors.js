// Extend BracketManager with add competitors functionality
if (typeof BracketManager !== 'undefined') {
	
	/**
	 * Add new competitors to existing bracket
	 * @param {Array<string>} newCompetitorNames - Array of new competitor names to add
	 */
	BracketManager.prototype.addCompetitors = function(newCompetitorNames) {
		if (!newCompetitorNames || newCompetitorNames.length === 0) {
			console.warn('No competitors provided to add');
			return;
		}

		console.log('Adding competitors:', newCompetitorNames);

		// Filter out empty names
		const validNames = newCompetitorNames.filter(name => name && name.trim() !== '');
		
		if (validNames.length === 0) {
			this.showNotification('No valid competitor names provided', 'error');
			return;
		}

		// Add to competitors array
		validNames.forEach(name => {
			// Check for duplicates
			if (this.competitors.includes(name)) {
				console.warn(`Competitor "${name}" already exists, skipping`);
			} else {
				// Find first null slot or add to end
				const nullIndex = this.competitors.indexOf(null);
				if (nullIndex !== -1) {
					this.competitors[nullIndex] = name;
				} else {
					this.competitors.push(name);
				}
			}
		});

		// Calculate new bracket size (next power of 2)
		const numParticipants = this.getNextPowerOfTwo(this.competitors.filter(c => c !== null).length);
		
		// Pad with nulls to reach power of 2
		while (this.competitors.length < numParticipants) {
			this.competitors.push(null);
		}

		// Regenerate bracket
		// Regenerate bracket
        this.bracketData = this.generateSingleEliminationBracket(this.competitors);
        this.saveToLocalStorage();
        this.renderBracket();

        // Re-attach drag and drop if in draft mode
        if (this.isDraftMode) {
        setTimeout(() => {
            this.attachDragAndDrop();
        }, 300);
        }

        this.showNotification(`Added ${validNames.length} competitor(s)`, 'success');
	};

	/**
	 * Show add competitors modal
	 */
	BracketManager.prototype.showAddCompetitorsModal = function() {
		// Check if modal already exists
		let modal = document.getElementById('add-competitors-modal');
		if (modal) {
			modal.style.display = 'flex';
			return;
		}

		// Create modal
		modal = document.createElement('div');
		modal.id = 'add-competitors-modal';
		modal.className = 'modal-overlay';
		modal.innerHTML = `
			<div class="modal-content">
				<div class="modal-header">
					<h2>Add Competitors</h2>
					<button class="modal-close" onclick="window.bracketManager.closeAddCompetitorsModal()">&times;</button>
				</div>
				<div class="modal-body">
					<p class="modal-description">Enter competitor names, one per line:</p>
					<textarea 
						id="new-competitors-input" 
						placeholder="Competitor 1&#10;Competitor 2&#10;Competitor 3"
						rows="10"
					></textarea>
					<div class="modal-info">
                        <span>Current bracket has ${this.competitors.filter(c => c !== null).length} competitors</span>
                    </div>
				</div>
				<div class="modal-footer">
					<button class="btn-secondary" onclick="window.bracketManager.closeAddCompetitorsModal()">
						Cancel
					</button>
					<button class="btn-primary" onclick="window.bracketManager.submitNewCompetitors()">
						Add Competitors
					</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		// Focus textarea
		setTimeout(() => {
			document.getElementById('new-competitors-input').focus();
		}, 100);

		// Handle Escape key
		const handleEscape = (e) => {
			if (e.key === 'Escape') {
				this.closeAddCompetitorsModal();
				document.removeEventListener('keydown', handleEscape);
			}
		};
		document.addEventListener('keydown', handleEscape);
	};

	/**
	 * Close add competitors modal
	 */
	BracketManager.prototype.closeAddCompetitorsModal = function() {
		const modal = document.getElementById('add-competitors-modal');
		if (modal) {
			modal.style.display = 'none';
		}
	};

	/**
	 * Submit new competitors from modal
	 */
	BracketManager.prototype.submitNewCompetitors = function() {
		const textarea = document.getElementById('new-competitors-input');
		if (!textarea) return;

		const input = textarea.value;
		if (!input || input.trim() === '') {
			this.showNotification('Please enter at least one competitor name', 'error');
			return;
		}

		// Split by newlines and filter empty lines
		const newCompetitors = input
			.split('\n')
			.map(name => name.trim())
			.filter(name => name !== '');

		if (newCompetitors.length === 0) {
			this.showNotification('No valid competitor names entered', 'error');
			return;
		}

		// Add competitors
		this.addCompetitors(newCompetitors);

		// Close modal
		this.closeAddCompetitorsModal();
	};

	/**
	 * Show notification (if not already defined)
	 */
	if (!BracketManager.prototype.showNotification) {
		BracketManager.prototype.showNotification = function(message, type = 'info') {
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
		};
	}
}

// Add CSS for modal
const modalStyle = document.createElement('style');
modalStyle.textContent = `
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 2rem;
		color: #6b7280;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: background-color 0.2s ease;
	}

	.modal-close:hover {
		background-color: #f3f4f6;
		color: #111827;
	}

	.modal-body {
		padding: 24px;
		flex: 1;
		overflow-y: auto;
	}

	.modal-description {
		margin: 0 0 12px 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	#new-competitors-input {
		width: 100%;
		padding: 12px;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	#new-competitors-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.modal-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		padding: 12px;
		background: #eff6ff;
		border-radius: 8px;
		color: #1e40af;
		font-size: 0.875rem;
	}

	.modal-info svg {
		flex-shrink: 0;
	}

	.modal-footer {
		display: flex;
		gap: 12px;
		padding: 20px 24px;
		border-top: 1px solid #e5e7eb;
		justify-content: flex-end;
	}

	.btn-secondary,
	.btn-primary {
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn-secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}
`;
document.head.appendChild(modalStyle);

console.log('Add competitors feature loaded');