// ===== GAME CLASS (MAIN ORCHESTRATOR) =====
// All game logic is now powered by Claude AI

import { Merchant } from '../models/Merchant';
import { Player } from '../models/Player';
import { PersonalityProfile } from '../models/PersonalityProfile';
import { ItemGenerator } from '../models/ItemGenerator';
import { Item } from '../models/Item';
import { UIController } from '../ui/UIController';
import { claudeIntegration, type ClaudePersonality } from '../integrations/claude';
import type { IGame, NegotiationContext, PersonalityTraits, ChatMessage } from '../types/interfaces';
import type { NegotiationMode } from '../types/types';
import { SaveManager, type GameStats } from '../utils/SaveManager';
import { Leaderboard } from '../utils/Leaderboard';
import { WEARABLE_TEMPLATES } from '../data/wearableTemplates';
import { Rarity, Condition } from '../types/enums';

/**
 * Game - main orchestrator
 * Implements IGame interface for dependency injection pattern
 * All negotiation logic is handled by Claude API
 */
export class Game implements IGame {
    player: Player;
    merchant: Merchant;
    currentItem: Item | null = null;
    currentRound: number = 0;
    maxRounds: number = 6;
    offerHistory: number[] = [];
    merchantCounterHistory: number[] = [];
    chatHistory: ChatMessage[] = [];
    mode: NegotiationMode = 'BUY';
    hardMode: boolean = false;
    itemGenerator: ItemGenerator;
    ui: UIController;
    selectedInventoryIndex: number = -1;

    // Stats tracking
    stats: GameStats = {
        totalDeals: 0,
        successfulDeals: 0,
        failedNegotiations: 0,
        score: 0
    };

    constructor() {
        this.player = new Player();
        this.merchant = new Merchant();
        this.itemGenerator = new ItemGenerator();
        this.ui = new UIController();

        // Inject game reference into UI (breaks circular dependency)
        this.ui.setGame(this);

        // Hard mode toggle
        const hardModeToggle = document.getElementById('hard-mode');
        if (hardModeToggle) {
            hardModeToggle.addEventListener('change', (e: Event) => {
                this.hardMode = (e.target as HTMLInputElement).checked;
                this.maxRounds = this.hardMode ? 4 : 6;
            });
        }
    }

    /**
     * Initialize game (async for Claude generation)
     * Generates player and merchant with loading overlay
     */
    async initializeGame(): Promise<void> {
        this.ui.showLoader('Initializing Game', 'Generating your character...');

        try {
            // Generate player
            this.player = await this.createPlayer();
            this.ui.updatePlayerInfo(this.player);

            // Generate merchant
            this.ui.updateLoaderMessage('Generating merchant...');
            this.merchant = await this.createMerchant();
            this.ui.updateMerchantInfo(this.merchant);

            // Generate starting inventory (2-3 items)
            this.generateStartingInventory();
            this.refreshInventoryDisplay();

            console.log('✅ Game initialized with AI characters');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.ui.showError('Failed to generate characters. Please check your API key in settings.');
        } finally {
            this.ui.hideLoader();
        }
    }

    startNegotiation(mode: NegotiationMode): void {
        // Check if API is configured
        if (!claudeIntegration.isConfigured()) {
            this.ui.showError('Claude API key required! Please configure it in the Claude API Settings section below.');
            return;
        }

        // For SELL mode, check if player has items and one is selected
        if (mode === 'SELL') {
            if (!this.player.hasItems()) {
                this.ui.showError('You have no items to sell! Buy something first.');
                return;
            }
            if (this.selectedInventoryIndex < 0) {
                this.ui.showError('Please select an item from your inventory to sell.');
                return;
            }
            // Use selected item from inventory
            this.currentItem = this.player.inventory[this.selectedInventoryIndex];
        } else {
            // BUY mode - generate random item from merchant
            this.currentItem = this.itemGenerator.generateRandom();
        }

        this.mode = mode;
        this.currentRound = 1;
        this.maxRounds = this.hardMode ? 4 : 6;
        this.offerHistory = [];
        this.merchantCounterHistory = [];
        this.chatHistory = [];

        // Apply mood bonus from equipped items (first impression bonus)
        const equipmentBonus = this.player.getTotalMoodBonus();
        if (equipmentBonus > 0) {
            this.merchant.adjustMood(equipmentBonus);
            console.log(`✨ Equipment bonus applied: +${equipmentBonus} mood (from ${this.player.getEquippedItems().size} equipped items)`);
            // Update UI to show the new mood with bonus
            this.ui.updateMerchantInfo(this.merchant);
        }

        this.ui.displayItem(this.currentItem);
        this.ui.showNegotiationPanel(mode, 1, this.maxRounds);

        // Add initial merchant greeting
        const greetings = [
            "Welcome! Let's talk business.",
            "Good to see you. What's your offer?",
            "I'm listening. Make your pitch.",
            "Alright, let's negotiate."
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        this.chatHistory.push({ speaker: 'merchant', message: greeting });
        this.ui.addNegotiationLog('merchant', greeting);
    }

    /**
     * Submit player message - processed by Claude AI
     * Now accepts free-form text instead of just numbers
     */
    async submitOffer(message: string): Promise<void> {
        if (!this.currentItem) return;

        // Validation
        if (!message || message.trim().length === 0) {
            this.ui.showError("Please write a message to the merchant.");
            return;
        }

        if (this.currentRound > this.maxRounds) {
            this.ui.showError("Negotiation has ended.");
            return;
        }

        // Log player message
        this.chatHistory.push({ speaker: 'player', message: message });
        this.ui.addNegotiationLog('player', message);

        // Disable submit button during processing
        const submitBtn = document.getElementById('btn-submit-offer') as HTMLButtonElement;
        const messageInput = document.getElementById('player-offer') as HTMLTextAreaElement;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '🤖 AI thinking...';
        }
        if (messageInput) {
            messageInput.disabled = true;
        }

        try {
            // Build context for Claude API
            const extended = (this.merchant.personality as any).extended as ClaudePersonality | undefined;
            const context: NegotiationContext = {
                mode: this.mode,
                item: {
                    name: this.currentItem.name,
                    description: this.currentItem.description,
                    fairPrice: this.currentItem.fairPrice,
                    marketHint: this.currentItem.marketHint
                },
                merchant: {
                    name: this.merchant.personality.traits.name,
                    personality: extended?.speakingStyle || 'neutral',
                    mood: this.merchant.mood,
                    trust: this.merchant.trust,
                    backstory: extended?.backstory
                },
                negotiation: {
                    currentRound: this.currentRound,
                    maxRounds: this.maxRounds,
                    offerHistory: [...this.offerHistory],
                    merchantCounterHistory: [...this.merchantCounterHistory],
                    chatHistory: [...this.chatHistory]
                },
                playerMessage: message
            };

            // Process with Claude AI
            const result = await claudeIntegration.processNegotiation(context);

            // Validate extracted price if player is buying and has insufficient funds
            if (result.extractedPrice && result.extractedPrice > 0) {
                if (this.mode === 'BUY' && result.extractedPrice > this.player.balance) {
                    this.ui.showError("You don't have enough coins for that offer!");
                    // Restore UI state
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Message';
                    }
                    if (messageInput) {
                        messageInput.disabled = false;
                    }
                    return;
                }

                // Update offer history with extracted price
                this.offerHistory.push(result.extractedPrice);
            }

            if (result.action === 'COUNTER' && result.counterOffer) {
                this.merchantCounterHistory.push(result.counterOffer);
            }
            this.currentRound++;

            // Apply mood and trust changes
            this.merchant.adjustMood(result.moodChange);
            this.merchant.adjustTrust(result.trustChange);

            // Log merchant response
            this.chatHistory.push({ speaker: 'merchant', message: result.message });
            this.ui.addNegotiationLog('merchant', result.message);

            // Update UI
            this.ui.updateMoodIndicator(this.merchant.mood);
            this.ui.updateTrustIndicator(this.merchant.trust);
            this.ui.updateRoundIndicator(this.currentRound, this.maxRounds);

            // Handle result
            if (result.action === 'ACCEPT') {
                // Use extracted price if available, otherwise use last offer
                const finalPrice = result.extractedPrice || this.offerHistory[this.offerHistory.length - 1] || 0;
                this.completeDeal(finalPrice);
            } else if (result.action === 'REJECT' || this.currentRound > this.maxRounds) {
                this.endNegotiation(false);
            }

            console.log('🤖 AI reasoning:', result.reasoning);
            if (result.extractedPrice) {
                console.log('💰 Extracted price:', result.extractedPrice);
            }

            // Clear input field after successful submission
            if (messageInput) {
                messageInput.value = '';
            }

        } catch (error) {
            console.error('AI processing failed:', error);
            this.ui.showError(`AI error: ${(error as Error).message}`);
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
            if (messageInput) {
                messageInput.disabled = false;
                messageInput.focus();
            }
        }
    }

    completeDeal(finalPrice: number): void {
        if (!this.currentItem) return;

        // Calculate profit
        const profit = this.mode === 'BUY'
            ? (this.currentItem.fairPrice - finalPrice)
            : (finalPrice - this.currentItem.fairPrice);

        // Update balance
        this.player.balance += (this.mode === 'BUY' ? -finalPrice : finalPrice);
        this.player.profit += profit;

        // Handle inventory
        if (this.mode === 'BUY') {
            // Add purchased item to inventory
            this.player.addItem(this.currentItem);
        } else {
            // Remove sold item from inventory
            this.player.removeItem(this.selectedInventoryIndex);
            this.selectedInventoryIndex = -1;
        }

        // Update stats
        this.stats.totalDeals++;
        this.stats.successfulDeals++;
        this.updateScore();

        // Mood bonus for successful deal
        this.merchant.adjustMood(20);

        // Trust bonus for fair dealing
        if (profit > -50 && profit < 50) {
            this.merchant.adjustTrust(5);
        }

        // Update UI
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateScore(this.stats.score);
        this.ui.updateMoodIndicator(this.merchant.mood);
        this.ui.updateTrustIndicator(this.merchant.trust);
        this.refreshInventoryDisplay();

        // Show summary
        this.ui.showDealSummary(
            finalPrice,
            this.currentItem.fairPrice,
            profit,
            true,
            this.currentItem.name,
            this.mode
        );

        this.endNegotiation(true);

        // Auto-save after successful deal
        this.autoSave();
    }

    endNegotiation(success: boolean): void {
        if (!success && this.currentItem) {
            // Update stats for failed negotiation
            this.stats.totalDeals++;
            this.stats.failedNegotiations++;
            this.updateScore();

            // Small mood penalty for failed negotiation
            this.merchant.adjustMood(-5);
            this.ui.updateMoodIndicator(this.merchant.mood);
            this.ui.updateScore(this.stats.score);

            // Capture values before they're cleared
            const itemName = this.currentItem.name;
            const fairPrice = this.currentItem.fairPrice;
            const mode = this.mode;

            // Show summary with 0 profit
            setTimeout(() => {
                this.ui.showDealSummary(0, fairPrice, 0, false, itemName, mode);
            }, 500);
        }

        this.currentItem = null;
        this.currentRound = 0;
        this.offerHistory = [];
        this.merchantCounterHistory = [];
        this.chatHistory = [];

        setTimeout(() => {
            this.ui.hideNegotiationPanel();
        }, success ? 0 : 1000);
    }

    /**
     * Update score based on current stats
     */
    updateScore(): void {
        this.stats.score = SaveManager.calculateScore(this.player.profit, this.stats);
    }

    /**
     * Auto-save game state
     */
    autoSave(): void {
        const saved = SaveManager.saveGame({
            player: {
                balance: this.player.balance,
                profit: this.player.profit,
                inventory: this.player.inventory.map(item => ({
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    rarity: item.rarity,
                    condition: item.condition,
                    fairPrice: item.fairPrice,
                    marketHint: item.marketHint
                })),
                personality: (this.player as any).personality
            },
            merchant: {
                personality: (this.merchant.personality as any).extended,
                mood: this.merchant.mood,
                trust: this.merchant.trust
            },
            stats: this.stats,
            settings: {
                hardMode: this.hardMode
            }
        });

        if (saved) {
            this.ui.showSaveIndicator();
        }
    }

    /**
     * Manually save game
     */
    saveGame(): void {
        this.autoSave();
        this.ui.showMessage('Game saved successfully!', 'success');
    }

    /**
     * Load game from save
     */
    async loadGame(): Promise<boolean> {
        const save = SaveManager.loadGame();
        if (!save) {
            this.ui.showError('No saved game found!');
            return false;
        }

        try {
            this.ui.showLoader('Loading Game', 'Restoring your progress...');

            // Restore player
            this.player = new Player(save.player.personality);
            this.player.balance = save.player.balance;
            this.player.profit = save.player.profit;

            // Restore inventory - recreate Item objects
            this.player.inventory = save.player.inventory.map(itemData => {
                // Create Item object directly without template
                const item = Object.create(Item.prototype);
                item.name = itemData.name;
                item.description = itemData.description;
                item.category = itemData.category;
                item.rarity = itemData.rarity;
                item.condition = itemData.condition;
                item.fairPrice = itemData.fairPrice;
                item.marketHint = itemData.marketHint;
                return item as Item;
            });

            // Restore merchant
            const traits: PersonalityTraits = {
                name: save.merchant.personality.name,
                targetMargin: save.merchant.personality.targetMargin,
                patience: save.merchant.personality.patience,
                concessionRate: save.merchant.personality.concessionRate,
                bluffSensitivity: save.merchant.personality.bluffSensitivity,
                moodVolatility: save.merchant.personality.moodVolatility
            };
            const profile = new PersonalityProfile(traits);
            (profile as any).extended = save.merchant.personality;
            this.merchant = new Merchant(profile);
            this.merchant.mood = save.merchant.mood;
            this.merchant.trust = save.merchant.trust;

            // Restore stats
            this.stats = save.stats;

            // Restore settings
            this.hardMode = save.settings.hardMode;
            const hardModeElement = document.getElementById('hard-mode') as HTMLInputElement;
            if (hardModeElement) {
                hardModeElement.checked = this.hardMode;
            }
            this.maxRounds = this.hardMode ? 4 : 6;

            // Update UI
            this.ui.updatePlayerInfo(this.player);
            this.ui.updateMerchantInfo(this.merchant);
            this.ui.updatePlayerStats(this.player.balance, this.player.profit);
            this.ui.updateScore(this.stats.score);
            this.ui.updateMoodIndicator(this.merchant.mood);
            this.ui.updateTrustIndicator(this.merchant.trust);
            this.refreshInventoryDisplay();

            this.ui.hideLoader();
            this.ui.showMessage('Game loaded successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            this.ui.hideLoader();
            this.ui.showError('Failed to load game. Starting fresh.');
            return false;
        }
    }

    /**
     * Submit score to leaderboard
     */
    submitToLeaderboard(playerName: string): number | null {
        const rank = Leaderboard.addEntry({
            playerName,
            score: this.stats.score,
            profit: this.player.profit,
            deals: this.stats.successfulDeals
        });

        return rank;
    }

    /**
     * Check if current score qualifies for leaderboard
     */
    qualifiesForLeaderboard(): boolean {
        return Leaderboard.wouldQualify(this.stats.score);
    }

    /**
     * Generate a new merchant after completing a deal
     * Called when user closes the deal summary modal
     */
    async generateNewMerchant(): Promise<void> {
        this.ui.showLoader('New Merchant Arriving', 'Finding a new trading partner...');

        try {
            this.merchant = await this.createMerchant();
            this.ui.updateMerchantInfo(this.merchant);
            console.log('✨ New merchant generated:', this.merchant.name);
        } catch (error) {
            console.error('Failed to generate new merchant:', error);
            this.ui.showError('Failed to find a new merchant. Please try again.');
        } finally {
            this.ui.hideLoader();
        }
    }

    /**
     * Open shop to buy wearable items
     */
    openShop(): void {
        this.ui.showShop();
        this.ui.displayShopItems(
            WEARABLE_TEMPLATES,
            this.player.balance,
            (index: number) => this.purchaseItem(index)
        );
    }

    /**
     * Purchase item from shop
     */
    purchaseItem(index: number): void {
        const template = WEARABLE_TEMPLATES[index];
        if (!template) return;

        // Check if player can afford
        if (this.player.balance < template.basePrice) {
            this.ui.showError('Not enough coins!');
            return;
        }

        // Create item (wearables are always NEW condition, COMMON rarity for simplicity)
        const item = new Item(template, Rarity.COMMON, Condition.NEW);

        // Deduct cost
        this.player.balance -= template.basePrice;

        // Add to inventory
        this.player.addItem(item);

        // Update UI
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.refreshInventoryDisplay();

        // Show success message
        this.ui.showMessage(`Purchased ${item.name} for ${template.basePrice} coins!`, 'success');

        // Refresh shop display
        this.ui.displayShopItems(
            WEARABLE_TEMPLATES,
            this.player.balance,
            (i: number) => this.purchaseItem(i)
        );

        console.log(`✅ Purchased ${item.name} (+${item.moodBonus} mood bonus)`);
    }

    async reset(): Promise<void> {
        this.currentItem = null;
        this.currentRound = 0;
        this.offerHistory = [];
        this.merchantCounterHistory = [];
        this.chatHistory = [];
        const hardModeElement = document.getElementById('hard-mode') as HTMLInputElement;
        if (hardModeElement) {
            this.hardMode = hardModeElement.checked;
            this.maxRounds = this.hardMode ? 4 : 6;
        }

        this.ui.showLoader('Resetting Game', 'Generating new character...');

        try {
            // Generate new player
            this.player = await this.createPlayer();
            this.ui.updatePlayerInfo(this.player);

            // Generate new merchant
            this.ui.updateLoaderMessage('Generating new merchant...');
            this.merchant = await this.createMerchant();
            this.ui.updateMerchantInfo(this.merchant);
        } catch (error) {
            console.error('Failed to reset game:', error);
            this.ui.showError('Failed to generate new characters. Please check your API key.');
        } finally {
            this.ui.hideLoader();
        }

        this.ui.reset();

        // Generate starting inventory for new player
        this.generateStartingInventory();
        this.refreshInventoryDisplay();
    }

    /**
     * Generate starting inventory items (2-3 random items)
     */
    private generateStartingInventory(): void {
        const numItems = 2 + Math.floor(Math.random() * 2); // 2-3 items
        for (let i = 0; i < numItems; i++) {
            const item = this.itemGenerator.generateRandom();
            this.player.addItem(item);
        }
        console.log(`📦 Generated ${numItems} starting items`);
    }

    /**
     * Refresh inventory display in UI
     */
    private refreshInventoryDisplay(): void {
        this.selectedInventoryIndex = -1;
        this.ui.updateInventory(
            this.player.inventory,
            (index) => {
                this.selectedInventoryIndex = index;
                console.log(`Selected inventory item: ${this.player.inventory[index].name}`);
            },
            (index) => {
                // Toggle equip/unequip
                const item = this.player.inventory[index];
                if (item.isEquipped) {
                    this.player.unequipItem(index);
                    this.ui.showMessage(`Unequipped ${item.name}`, 'success');
                } else {
                    this.player.equipItem(index);
                    this.ui.showMessage(`Equipped ${item.name} (+${item.moodBonus} first impression)`, 'success');
                }
                this.refreshInventoryDisplay();
            }
        );
    }

    /**
     * Create player with Claude-generated personality
     * API key is required - no fallback
     */
    private async createPlayer(): Promise<Player> {
        if (!claudeIntegration.isConfigured()) {
            throw new Error('Claude API key not configured');
        }

        console.log('✨ Generating Claude player...');
        const claudeData = await claudeIntegration.generatePlayerPersonality();

        return new Player(claudeData);
    }

    /**
     * Create merchant with Claude-generated personality
     * API key is required - no fallback
     */
    private async createMerchant(): Promise<Merchant> {
        if (!claudeIntegration.isConfigured()) {
            throw new Error('Claude API key not configured');
        }

        console.log('✨ Generating Claude merchant...');
        const claudeData = await claudeIntegration.generatePersonality();

        // Create PersonalityProfile with extended data
        const traits: PersonalityTraits = {
            name: claudeData.name,
            targetMargin: claudeData.targetMargin,
            patience: claudeData.patience,
            concessionRate: claudeData.concessionRate,
            bluffSensitivity: claudeData.bluffSensitivity,
            moodVolatility: claudeData.moodVolatility
        };
        const profile = new PersonalityProfile(traits);
        (profile as any).extended = claudeData;

        return new Merchant(profile);
    }
}
