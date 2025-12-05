/**
 * Add this to competitor_edit_delete.js
 * Competitor Edit & Delete functionality for BracketManager
 * Updated to not interfere with drag-and-drop
 */

// Extend BracketManager class with edit/delete functionality
if (typeof BracketManager !== 'undefined') {
	
	/**
	 * Add edit and delete controls to all competitor elements
	 * Call this after rendering the bracket in draft mode
	 */
	BracketManager.prototype.addCompetitorControls = function() {
		const bracketContainer = document.getElementById('bracket-viewer');
		if (!bracketContainer) {
			console.log('Bracket container not found');
			return;
		}

		console.log('Adding competitor controls...');

		// Find all participant containers
		const participantContainers = bracketContainer.querySelectorAll('.participant');
		console.log(`Found ${participantContainers.length} participants`);

		participantContainers.forEach((container, index) => {
			// Skip if already has controls
			if (container.querySelector('.competitor-controls')) {
				return;
			}

			// Find the .name div which contains the competitor name
			const nameDiv = container.querySelector('.name');
			if (!nameDiv) {
				return;
			}

			// Get all text content from the div
			const fullText = nameDiv.textContent.trim();
			
			// Check if it's a BYE
			if (nameDiv.classList.contains('bye') || fullText === 'BYE') {
				return;
			}

			// The structure is: <span>#0 </span>Competitor 1
			// We need to extract just "Competitor 1" (the text after the span)
			const span = nameDiv.querySelector('span');
			let competitorName = '';
			
			if (span) {
				// Get the ID from the span
				const idText = span.textContent.trim();
				// Remove the ID from the full text to get just the name
				competitorName = fullText.replace(idText, '').trim();
			} else {
				// No span, use full text
				competitorName = fullText;
			}

			// Skip if no valid name
			if (!competitorName || competitorName === 'null' || competitorName === 'TBD' || competitorName === '') {
				return;
			}

			console.log(`Adding controls for: "${competitorName}"`);

			// Make container a flex container
			container.style.display = 'flex';
			container.style.alignItems = 'center';
			container.style.justifyContent = 'space-between';
			container.classList.add('competitor-item');
			
			// Mark the name div - but DON'T interfere with dragging
			nameDiv.classList.add('editable-name');
			nameDiv.style.flex = '1';

			// Create controls container
			const controlsDiv = document.createElement('div');
			controlsDiv.className = 'competitor-controls';
			controlsDiv.style.pointerEvents = 'auto'; // Controls always clickable
			controlsDiv.innerHTML = `
				<button class="edit-competitor-btn" type="button" title="Edit competitor name" aria-label="Edit">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
					</svg>
				</button>
				<button class="delete-competitor-btn" type="button" title="Delete competitor" aria-label="Delete">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
					</svg>
				</button>
			`;

			container.appendChild(controlsDiv);

			// Store reference to manager
			const manager = this;

			// Add event listeners - use stopPropagation to not interfere with drag
			const editBtn = controlsDiv.querySelector('.edit-competitor-btn');
			const deleteBtn = controlsDiv.querySelector('.delete-competitor-btn');

			editBtn.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				console.log('Edit clicked for:', competitorName);
				manager.editCompetitorName(nameDiv, competitorName);
			}, true);

			deleteBtn.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				console.log('Delete clicked for:', competitorName);
				manager.deleteCompetitor(competitorName);
			}, true);

			// Allow double-click on name to edit (instead of single click which might interfere with drag)
			nameDiv.addEventListener('dblclick', function(e) {
				e.preventDefault();
				e.stopPropagation();
				console.log('Name double-clicked:', competitorName);
				manager.editCompetitorName(nameDiv, competitorName);
			}, true);
		});

		console.log('Finished adding competitor controls');
	};

	/**
	 * Edit competitor name inline
	 * @param {HTMLElement} nameDiv - The div.name element containing the competitor name
	 * @param {string} originalName - The original name of the competitor
	 */
	BracketManager.prototype.editCompetitorName = function(nameDiv, originalName) {
		console.log('editCompetitorName called for:', originalName);
		
		// Prevent multiple edits
		if (nameDiv.querySelector('input')) {
			console.log('Already editing');
			return;
		}

		// Get the ID span if it exists
		const idSpan = nameDiv.querySelector('span');
		const idHTML = idSpan ? idSpan.outerHTML : '';

		// Create input field
		const input = document.createElement('input');
		input.type = 'text';
		input.value = originalName;
		input.className = 'competitor-name-input';
		input.style.cssText = `
			flex: 1;
			min-width: 100px;
			padding: 4px 8px;
			border: 2px solid #3b82f6;
			border-radius: 4px;
			outline: none;
			font-size: inherit;
			font-family: inherit;
			background: white;
			box-sizing: border-box;
			margin-left: 4px;
		`;

		// Store original content
		const originalHTML = nameDiv.innerHTML;

		// Replace content with ID span + input
		nameDiv.innerHTML = idHTML;
		nameDiv.appendChild(input);
		
		// Focus
		setTimeout(() => {
			input.focus();
			input.select();
		}, 10);

		const manager = this;
		let isSaving = false;

		// Save changes
		const saveChanges = function() {
			if (isSaving) return;
			isSaving = true;

			const newName = input.value.trim();
			console.log('Saving. Old:', originalName, 'New:', newName);

			if (newName && newName !== originalName && newName !== 'null') {
				// Update in competitors array
				const index = manager.competitors.indexOf(originalName);
				if (index !== -1) {
					manager.competitors[index] = newName;
					console.log('Updated competitors array at index', index);
				}

				// Update in bracketData.participants
				if (manager.bracketData && manager.bracketData.participants) {
					manager.bracketData.participants = manager.bracketData.participants.map(p => {
						if (p && p.name === originalName) {
							console.log('Updating participant:', p.id);
							return { ...p, name: newName };
						}
						return p;
					});
				}

				// Update the div content
				nameDiv.innerHTML = idHTML + newName;

				// Save and re-render
				manager.saveToLocalStorage();
				
				setTimeout(() => {
					manager.renderBracket();
				}, 100);
				
				manager.showNotification(`Renamed "${originalName}" to "${newName}"`, 'success');
			} else {
				// Restore original
				nameDiv.innerHTML = originalHTML;
			}
		};

		// Cancel changes
		const cancelChanges = function() {
			nameDiv.innerHTML = originalHTML;
			console.log('Edit cancelled');
		};

		// Event listeners
		input.addEventListener('keydown', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				saveChanges();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				cancelChanges();
			}
		});

		input.addEventListener('blur', function() {
			setTimeout(saveChanges, 150);
		});
	};

	/**
	 * Delete a competitor from the bracket
	 * @param {string} competitorName - Name of competitor to delete
	 */
	BracketManager.prototype.deleteCompetitor = function(competitorName) {
		console.log('deleteCompetitor called for:', competitorName);
		
		const confirmed = confirm(
			`Delete "${competitorName}" from the bracket?\n\n` +
			`This will remove them from all matches and cannot be undone.`
		);
		
		if (!confirmed) {
			console.log('Deletion cancelled');
			return;
		}

		// Remove from competitors array
		const index = this.competitors.indexOf(competitorName);
		if (index !== -1) {
			this.competitors[index] = null;
			console.log('Removed from competitors at index', index);
		}

		// Remove from bracketData.participants
		if (this.bracketData && this.bracketData.participants) {
			this.bracketData.participants = this.bracketData.participants.filter(p => {
				return !p || p.name !== competitorName;
			});
		}

		// Save and re-render
		this.saveToLocalStorage();
		
		setTimeout(() => {
			this.renderBracket();
		}, 100);
		
		this.showNotification(`"${competitorName}" has been deleted`, 'success');
	};

	/**
	 * Show a notification message
	 */
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

	// Update the renderBracket method to add controls after rendering
	const originalRenderBracket = BracketManager.prototype.renderBracket;
	BracketManager.prototype.renderBracket = function() {
		console.log('renderBracket called, isDraftMode:', this.isDraftMode);
		
		originalRenderBracket.call(this);

		if (this.isDraftMode) {
			setTimeout(() => {
				this.addCompetitorControls();
			}, 700); // Add controls AFTER drag-and-drop is set up
		}
	};

	console.log('BracketManager extended with edit/delete functionality');
}

// Add CSS
const style = document.createElement('style');
style.textContent = `
	@keyframes slideIn {
		from { transform: translateX(400px); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	@keyframes slideOut {
		from { transform: translateX(0); opacity: 1; }
		to { transform: translateX(400px); opacity: 0; }
	}

	.competitor-item {
		transition: background-color 0.2s ease;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.competitor-item:hover {
		background-color: rgba(59, 130, 246, 0.05);
	}

	.editable-name {
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.editable-name:hover {
		background-color: rgba(59, 130, 246, 0.1);
	}

	.competitor-controls {
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.2s ease;
		margin-left: 8px;
		flex-shrink: 0;
		pointer-events: auto !important; /* Always clickable */
		z-index: 10;
	}

	.competitor-item:hover .competitor-controls {
		opacity: 1;
	}

	.competitor-controls button {
		padding: 4px;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		pointer-events: auto !important;
	}

	.competitor-controls button:hover {
		transform: scale(1.1);
	}

	.edit-competitor-btn:hover {
		background-color: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.delete-competitor-btn:hover {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.competitor-controls svg {
		width: 16px;
		height: 16px;
		pointer-events: none; /* Let clicks pass through to button */
	}
`;
document.head.appendChild(style);

console.log('Competitor edit and delete functionality loaded');