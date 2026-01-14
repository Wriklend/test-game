// ===== UI CONTROLLER CLASS (REFACTORED) =====

import type { IGame } from '../types/interfaces';
import type { Item } from '../models/Item';
import type { Merchant } from '../models/Merchant';
import type { Player } from '../models/Player';
import type { NegotiationMode } from '../types/types';

/**
 * UIController - manages DOM updates and user interactions
 *
 * IMPORTANT: Uses IGame interface to break circular dependency with Game class
 * Game reference is injected after construction via setGame()
 */
export class UIController {
    private game: IGame | null = null;

    constructor() {
        // NOTE: setupEventListeners() is called from setGame() after game injection
    }

    /**
     * Inject game reference and setup event listeners
     * Called by Game class after construction
     */
    setGame(game: IGame): void {
        this.game = game;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Mode buttons
        document.getElementById('btn-buy')!.addEventListener('click', () => {
            this.game!.startNegotiation('BUY');
        });

        document.getElementById('btn-sell')!.addEventListener('click', () => {
            this.game!.startNegotiation('SELL');
        });

        // Submit message
        document.getElementById('btn-submit-offer')!.addEventListener('click', () => {
            const input = document.getElementById('player-offer') as HTMLTextAreaElement;
            const message = input.value.trim();
            if (message.length > 0) {
                this.game!.submitOffer(message);
                // Input is cleared in Game.ts after successful submission
            }
        });

        // Ctrl/Cmd+Enter to submit (Enter alone creates new line in textarea)
        document.getElementById('player-offer')!.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                document.getElementById('btn-submit-offer')!.click();
            }
        });

        // Save button
        document.getElementById('btn-save')!.addEventListener('click', () => {
            this.hideMenu();
            this.game!.saveGame();
        });

        // Load button
        document.getElementById('btn-load')!.addEventListener('click', async () => {
            this.hideMenu();
            if (confirm('Load saved game? Current progress will be lost if not saved.')) {
                await this.game!.loadGame();
            }
        });

        // Leaderboard button
        document.getElementById('btn-leaderboard')!.addEventListener('click', () => {
            this.hideMenu();
            this.displayLeaderboard();
        });

        // Close leaderboard
        document.getElementById('btn-close-leaderboard')!.addEventListener('click', () => {
            this.hideLeaderboard();
        });

        // Submit score to leaderboard
        document.getElementById('btn-submit-score')!.addEventListener('click', async () => {
            const name = await this.promptPlayerName();
            if (name) {
                const rank = this.game!.submitToLeaderboard(name);
                if (rank) {
                    this.showMessage(`Congratulations! You're rank #${rank}!`, 'success');
                    this.displayLeaderboard(rank);
                } else {
                    this.showMessage('Score submitted!', 'success');
                    this.displayLeaderboard();
                }
            }
        });

        // Reset button
        document.getElementById('btn-reset')!.addEventListener('click', () => {
            this.hideMenu();
            if (confirm('Reset the game? All progress will be lost.')) {
                this.game!.reset();
            }
        });

        // Shop button
        document.getElementById('btn-shop')!.addEventListener('click', () => {
            this.game!.openShop();
        });

        // Close shop
        document.getElementById('btn-close-shop')!.addEventListener('click', () => {
            this.hideShop();
        });

        // Close shop when clicking outside
        document.getElementById('shop-modal')!.addEventListener('click', (e: MouseEvent) => {
            if ((e.target as HTMLElement).id === 'shop-modal') {
                this.hideShop();
            }
        });

        // Tutorial toggle
        document.getElementById('toggle-tutorial-btn')!.addEventListener('click', () => {
            const content = document.getElementById('tutorial-content')!;
            content.classList.toggle('hidden');
        });

        // Menu modal
        document.getElementById('btn-menu')!.addEventListener('click', () => {
            this.showMenu();
        });

        document.getElementById('btn-close-menu')!.addEventListener('click', () => {
            this.hideMenu();
        });

        // Close menu when clicking outside
        document.getElementById('menu-modal')!.addEventListener('click', (e: MouseEvent) => {
            if ((e.target as HTMLElement).id === 'menu-modal') {
                this.hideMenu();
            }
        });

        // Close menu with Escape key
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const menuModal = document.getElementById('menu-modal');
                if (menuModal && !menuModal.classList.contains('hidden')) {
                    this.hideMenu();
                }
            }
        });

        // Modal close - generate new merchant after deal
        document.getElementById('btn-close-modal')!.addEventListener('click', () => {
            document.getElementById('deal-modal')!.classList.add('hidden');
            // Generate a new merchant for the next trade
            this.game!.generateNewMerchant();
        });
    }

    displayItem(item: Item): void {
        document.getElementById('item-name')!.textContent = item.name;
        document.getElementById('item-description')!.textContent = item.description;

        const rarityBadge = document.getElementById('item-rarity')!;
        rarityBadge.textContent = item.rarity.toUpperCase();
        rarityBadge.className = `badge rarity-${item.rarity}`;

        const conditionBadge = document.getElementById('item-condition')!;
        conditionBadge.textContent = item.condition.toUpperCase();
        conditionBadge.className = `badge condition-${item.condition}`;

        document.getElementById('item-hint')!.textContent = `~${item.marketHint} coins`;

        document.getElementById('item-panel')!.classList.remove('hidden');
    }

    showNegotiationPanel(mode: NegotiationMode, currentRound: number, maxRounds: number): void {
        document.getElementById('mode-indicator')!.textContent = `MODE: ${mode === 'BUY' ? 'BUYING' : 'SELLING'}`;
        document.getElementById('current-round')!.textContent = currentRound.toString();
        document.getElementById('max-rounds')!.textContent = maxRounds.toString();

        // Clear log
        document.getElementById('negotiation-log')!.innerHTML = '';

        document.getElementById('negotiation-panel')!.classList.remove('hidden');

        // Disable mode buttons
        (document.getElementById('btn-buy') as HTMLButtonElement).disabled = true;
        (document.getElementById('btn-sell') as HTMLButtonElement).disabled = true;
    }

    hideNegotiationPanel(): void {
        document.getElementById('negotiation-panel')!.classList.add('hidden');
        document.getElementById('item-panel')!.classList.add('hidden');

        // Enable mode buttons
        (document.getElementById('btn-buy') as HTMLButtonElement).disabled = false;
        (document.getElementById('btn-sell') as HTMLButtonElement).disabled = false;
    }

    addNegotiationLog(speaker: 'player' | 'merchant', message: string): void {
        const log = document.getElementById('negotiation-log')!;
        const entry = document.createElement('div');
        entry.className = `log-entry ${speaker}`;

        const speakerLabel = document.createElement('div');
        speakerLabel.className = 'speaker';
        speakerLabel.textContent = speaker === 'player' ? 'You' : 'Merchant';

        const messageText = document.createElement('div');
        messageText.textContent = message;

        entry.appendChild(speakerLabel);
        entry.appendChild(messageText);
        log.appendChild(entry);

        // Scroll to bottom
        log.scrollTop = log.scrollHeight;
    }

    updateMoodIndicator(mood: number): void {
        // Map [-100, 100] to [0%, 100%]
        const percent = ((mood + 100) / 200) * 100;
        document.getElementById('mood-fill')!.style.width = `${percent}%`;

        // Update emoji
        let emoji = '😐';
        if (mood > 50) emoji = '😊';
        else if (mood > 20) emoji = '🙂';
        else if (mood < -50) emoji = '😠';
        else if (mood < -20) emoji = '😒';

        document.getElementById('mood-emoji')!.textContent = emoji;
    }

    updateTrustIndicator(trust: number): void {
        document.getElementById('trust-fill')!.style.width = `${trust}%`;
        document.getElementById('trust-value')!.textContent = Math.round(trust).toString();
    }

    updatePlayerStats(balance: number, profit: number): void {
        document.getElementById('balance')!.textContent = balance.toString();
        document.getElementById('profit')!.textContent = profit.toString();
    }

    updateMerchantInfo(merchant: Merchant): void {
        document.getElementById('merchant-name')!.textContent = merchant.name;
        document.getElementById('merchant-personality')!.textContent = `Type: ${merchant.personality.traits.name}`;
        this.updateMoodIndicator(merchant.mood);
        this.updateTrustIndicator(merchant.trust);
    }

    updateRoundIndicator(currentRound: number, maxRounds: number): void {
        document.getElementById('current-round')!.textContent = currentRound.toString();
        document.getElementById('max-rounds')!.textContent = maxRounds.toString();
    }

    showDealSummary(
        finalPrice: number,
        fairValue: number,
        profit: number,
        success: boolean,
        itemName?: string,
        mode?: 'BUY' | 'SELL'
    ): void {
        // Icon and result title
        const dealIcon = document.getElementById('deal-icon')!;
        const dealResult = document.getElementById('deal-result')!;

        if (success) {
            dealIcon.textContent = profit >= 0 ? '🎉' : '😅';
            dealResult.textContent = 'Deal Closed!';
        } else {
            dealIcon.textContent = '❌';
            dealResult.textContent = 'No Deal';
        }

        // Mode description
        const dealMode = document.getElementById('deal-mode')!;
        if (mode === 'BUY') {
            dealMode.textContent = 'You bought from the merchant';
        } else if (mode === 'SELL') {
            dealMode.textContent = 'You sold to the merchant';
        } else {
            dealMode.textContent = success ? 'Transaction completed' : 'Negotiation failed';
        }

        // Item name
        const itemNameEl = document.getElementById('deal-item-name')!;
        itemNameEl.textContent = itemName || 'Unknown Item';

        // Prices
        document.getElementById('final-price')!.textContent = `${finalPrice} coins`;
        document.getElementById('fair-value')!.textContent = `${fairValue} coins`;

        // Profit label and value
        const profitLabel = document.getElementById('profit-label')!;
        const profitEl = document.getElementById('deal-profit')!;

        if (success) {
            if (mode === 'BUY') {
                profitLabel.textContent = profit >= 0 ? 'You Saved' : 'You Overpaid';
            } else {
                profitLabel.textContent = profit >= 0 ? 'Extra Earnings' : 'You Lost';
            }
            profitEl.textContent = `${profit >= 0 ? '+' : ''}${profit} coins`;
            profitEl.className = `deal-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`;
        } else {
            profitLabel.textContent = 'Result';
            profitEl.textContent = 'No transaction';
            profitEl.className = 'deal-value muted';
        }

        // Verdict
        const verdict = document.getElementById('deal-verdict')!;
        const verdictEmoji = verdict.querySelector('.verdict-emoji')!;
        const verdictText = verdict.querySelector('.verdict-text')!;

        // Remove all verdict classes first
        verdict.className = 'deal-verdict';

        if (!success) {
            verdict.classList.add('verdict-failed');
            verdictEmoji.textContent = '🚫';
            verdictText.textContent = 'Deal fell through';
        } else if (profit >= 100) {
            verdict.classList.add('verdict-great');
            verdictEmoji.textContent = '🌟';
            verdictText.textContent = 'Amazing deal!';
        } else if (profit >= 30) {
            verdict.classList.add('verdict-good');
            verdictEmoji.textContent = '👍';
            verdictText.textContent = 'Good trade!';
        } else if (profit >= -30) {
            verdict.classList.add('verdict-fair');
            verdictEmoji.textContent = '🤝';
            verdictText.textContent = 'Fair exchange';
        } else {
            verdict.classList.add('verdict-bad');
            verdictEmoji.textContent = '📉';
            verdictText.textContent = 'Bad deal...';
        }

        document.getElementById('deal-modal')!.classList.remove('hidden');
    }

    showError(message: string): void {
        alert(message);
    }

    reset(): void {
        this.hideNegotiationPanel();
        document.getElementById('negotiation-log')!.innerHTML = '';
    }

    // ===== LOADING OVERLAY =====

    showLoader(title: string, message: string): void {
        document.getElementById('loading-title')!.textContent = title;
        document.getElementById('loading-message')!.textContent = message;
        document.getElementById('loading-overlay')!.classList.remove('hidden');
    }

    updateLoaderMessage(message: string): void {
        document.getElementById('loading-message')!.textContent = message;
    }

    hideLoader(): void {
        document.getElementById('loading-overlay')!.classList.add('hidden');
    }

    // ===== PLAYER INFO =====

    updatePlayerInfo(player: Player): void {
        document.getElementById('player-avatar')!.textContent = player.avatar;
        document.getElementById('player-name')!.textContent = player.name;
        document.getElementById('player-info')!.textContent = `${player.species} | ${player.profession}`;
        document.getElementById('player-backstory')!.textContent = player.backstory;
        document.getElementById('player-ability')!.textContent = `⚡ ${player.specialAbility}`;
        document.getElementById('player-weakness')!.textContent = `⚠️ ${player.weakness}`;
        this.updatePlayerStats(player.balance, player.profit);
    }

    // ===== INVENTORY =====

    updateInventory(inventory: Item[], onSelectItem?: (index: number) => void, onEquipItem?: (index: number) => void): void {
        const grid = document.getElementById('inventory-grid')!;
        const countEl = document.getElementById('inventory-count')!;
        const emptyEl = document.getElementById('inventory-empty');

        // Update count
        countEl.textContent = `(${inventory.length} item${inventory.length !== 1 ? 's' : ''})`;

        // Clear existing items (except empty message)
        const existingItems = grid.querySelectorAll('.inventory-item');
        existingItems.forEach(item => item.remove());

        // Show/hide empty message
        if (emptyEl) {
            if (inventory.length === 0) {
                emptyEl.classList.remove('hidden');
            } else {
                emptyEl.classList.add('hidden');
            }
        }

        // Add inventory items
        inventory.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            if (item.isEquipped) {
                itemEl.classList.add('equipped');
            }
            itemEl.dataset.index = index.toString();

            const isWearable = item.slot !== undefined;
            const equippedBadge = item.isEquipped ? '<span class="badge equipped-badge">EQUIPPED</span>' : '';
            const bonusBadge = isWearable && item.moodBonus ? `<span class="bonus-badge">+${item.moodBonus} mood</span>` : '';

            itemEl.innerHTML = `
                <div class="inventory-item-name">${item.name}</div>
                <div class="inventory-item-badges">
                    <span class="badge rarity-${item.rarity}">${item.rarity.toUpperCase()}</span>
                    <span class="badge condition-${item.condition}">${item.condition.toUpperCase()}</span>
                    ${equippedBadge}
                </div>
                ${bonusBadge}
                <div class="inventory-item-value">Est. ~<span>${item.marketHint}</span> coins</div>
                ${isWearable && onEquipItem ? `<button class="equip-btn" data-index="${index}">${item.isEquipped ? 'Unequip' : 'Equip'}</button>` : ''}
            `;

            if (onSelectItem) {
                itemEl.addEventListener('click', (e) => {
                    // Don't select if clicking equip button
                    if ((e.target as HTMLElement).classList.contains('equip-btn')) {
                        return;
                    }
                    // Remove selected from all
                    grid.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
                    // Add selected to this
                    itemEl.classList.add('selected');
                    onSelectItem(index);
                });
            }

            // Add equip button handler
            if (isWearable && onEquipItem) {
                const equipBtn = itemEl.querySelector('.equip-btn');
                if (equipBtn) {
                    equipBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        onEquipItem(index);
                    });
                }
            }

            grid.appendChild(itemEl);
        });

        // Update sell button state
        this.updateSellButtonState(inventory.length > 0);
    }

    updateSellButtonState(hasItems: boolean): void {
        const sellBtn = document.getElementById('btn-sell') as HTMLButtonElement;
        if (sellBtn) {
            sellBtn.disabled = !hasItems;
            if (!hasItems) {
                sellBtn.title = 'No items to sell - buy something first!';
            } else {
                sellBtn.title = '';
            }
        }
    }

    clearInventorySelection(): void {
        const grid = document.getElementById('inventory-grid');
        if (grid) {
            grid.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
        }
    }

    updateScore(score: number): void {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = score.toString();
        }
    }

    showSaveIndicator(): void {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }
    }

    showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showLeaderboard(): void {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideLeaderboard(): void {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showMenu(): void {
        const modal = document.getElementById('menu-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideMenu(): void {
        const modal = document.getElementById('menu-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showShop(): void {
        const modal = document.getElementById('shop-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideShop(): void {
        const modal = document.getElementById('shop-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    displayShopItems(items: any[], playerBalance: number, onPurchase: (index: number) => void): void {
        const container = document.getElementById('shop-items');
        if (!container) return;

        container.innerHTML = '';

        items.forEach((item, index) => {
            const canAfford = playerBalance >= item.basePrice;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.setAttribute('data-slot', item.slot || 'all');

            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                    <div class="shop-item-bonus">+${item.moodBonus} First Impression Bonus</div>
                </div>
                <div class="shop-item-actions">
                    <div class="shop-item-price">${item.basePrice} coins</div>
                    <button class="shop-buy-btn" ${!canAfford ? 'disabled' : ''} data-index="${index}">
                        ${canAfford ? 'Buy' : 'Too Expensive'}
                    </button>
                </div>
            `;

            container.appendChild(itemDiv);
        });

        // Add event listeners to buy buttons
        container.querySelectorAll('.shop-buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const index = parseInt(target.getAttribute('data-index') || '0');
                onPurchase(index);
            });
        });

        // Category filter buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const category = target.getAttribute('data-category');

                // Update active state
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');

                // Filter items
                const allItems = container.querySelectorAll('.shop-item') as NodeListOf<HTMLElement>;
                allItems.forEach(item => {
                    if (category === 'all' || item.getAttribute('data-slot') === category) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    promptPlayerName(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = document.getElementById('player-name-modal');
            const input = document.getElementById('player-name-input') as HTMLInputElement;
            const submitBtn = document.getElementById('submit-player-name');
            const cancelBtn = document.getElementById('cancel-player-name');

            if (!modal || !input || !submitBtn || !cancelBtn) {
                resolve(null);
                return;
            }

            // Clear input
            input.value = '';
            modal.classList.remove('hidden');
            input.focus();

            const handleSubmit = () => {
                const name = input.value.trim();
                if (name) {
                    modal.classList.add('hidden');
                    cleanup();
                    resolve(name);
                }
            };

            const handleCancel = () => {
                modal.classList.add('hidden');
                cleanup();
                resolve(null);
            };

            const cleanup = () => {
                submitBtn.removeEventListener('click', handleSubmit);
                cancelBtn.removeEventListener('click', handleCancel);
                input.removeEventListener('keypress', handleKeyPress);
            };

            const handleKeyPress = (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            };

            submitBtn.addEventListener('click', handleSubmit);
            cancelBtn.addEventListener('click', handleCancel);
            input.addEventListener('keypress', handleKeyPress);
        });
    }

    displayLeaderboard(highlightRank?: number): void {
        // Import Leaderboard dynamically
        import('../utils/Leaderboard').then(({ Leaderboard }) => {
            const entries = Leaderboard.getEntries();
            const listContainer = document.getElementById('leaderboard-list');

            if (!listContainer) return;

            // Clear existing entries
            listContainer.innerHTML = '';

            if (entries.length === 0) {
                listContainer.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
            } else {
                entries.forEach((entry, index) => {
                    const rank = index + 1;
                    const entryEl = document.createElement('div');
                    entryEl.className = 'leaderboard-entry';

                    if (rank === highlightRank) {
                        entryEl.classList.add('highlight');
                    }

                    const rankEl = document.createElement('div');
                    rankEl.className = rank <= 3 ? 'leaderboard-rank top3' : 'leaderboard-rank';
                    rankEl.textContent = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`;

                    const nameEl = document.createElement('div');
                    nameEl.className = 'leaderboard-name';
                    nameEl.textContent = entry.playerName;

                    const scoreEl = document.createElement('div');
                    scoreEl.className = 'leaderboard-score';
                    scoreEl.textContent = `🏆 ${entry.score}`;

                    const profitEl = document.createElement('div');
                    profitEl.className = 'leaderboard-profit';
                    profitEl.textContent = `📈 ${entry.profit}`;

                    entryEl.appendChild(rankEl);
                    entryEl.appendChild(nameEl);
                    entryEl.appendChild(scoreEl);
                    entryEl.appendChild(profitEl);

                    listContainer.appendChild(entryEl);
                });
            }

            // Show modal
            this.showLeaderboard();
        });
    }
}
