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

        // Submit offer
        document.getElementById('btn-submit-offer')!.addEventListener('click', () => {
            const input = document.getElementById('player-offer') as HTMLInputElement;
            const offer = parseInt(input.value);
            if (!isNaN(offer) && offer > 0) {
                this.game!.submitOffer(offer);
                input.value = '';
            }
        });

        // Enter key to submit
        document.getElementById('player-offer')!.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                document.getElementById('btn-submit-offer')!.click();
            }
        });

        // Reset button
        document.getElementById('btn-reset')!.addEventListener('click', () => {
            if (confirm('Reset the game? All progress will be lost.')) {
                this.game!.reset();
            }
        });

        // Tutorial toggle
        document.getElementById('toggle-tutorial-btn')!.addEventListener('click', () => {
            const content = document.getElementById('tutorial-content')!;
            content.classList.toggle('hidden');
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

    updateInventory(inventory: Item[], onSelectItem?: (index: number) => void): void {
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
            itemEl.dataset.index = index.toString();

            itemEl.innerHTML = `
                <div class="inventory-item-name">${item.name}</div>
                <div class="inventory-item-badges">
                    <span class="badge rarity-${item.rarity}">${item.rarity.toUpperCase()}</span>
                    <span class="badge condition-${item.condition}">${item.condition.toUpperCase()}</span>
                </div>
                <div class="inventory-item-value">Est. ~<span>${item.marketHint}</span> coins</div>
            `;

            if (onSelectItem) {
                itemEl.addEventListener('click', () => {
                    // Remove selected from all
                    grid.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
                    // Add selected to this
                    itemEl.classList.add('selected');
                    onSelectItem(index);
                });
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
}
