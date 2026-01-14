// ===== GAME CLASS (MAIN ORCHESTRATOR) =====
// All game logic is now powered by Claude AI

import { Merchant } from '../models/Merchant';
import { Player } from '../models/Player';
import { PersonalityProfile } from '../models/PersonalityProfile';
import { ItemGenerator } from '../models/ItemGenerator';
import { UIController } from '../ui/UIController';
import { claudeIntegration, type ClaudePersonality } from '../integrations/claude';
import type { IGame, NegotiationContext, PersonalityTraits } from '../types/interfaces';
import type { Item } from '../models/Item';
import type { NegotiationMode } from '../types/types';

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
    mode: NegotiationMode = 'BUY';
    hardMode: boolean = false;
    itemGenerator: ItemGenerator;
    ui: UIController;

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

        this.mode = mode;
        this.currentItem = this.itemGenerator.generateRandom();
        this.currentRound = 1;
        this.maxRounds = this.hardMode ? 4 : 6;
        this.offerHistory = [];

        // Check if player can afford (BUY mode)
        if (mode === 'BUY' && this.currentItem.marketHint > this.player.balance) {
            this.ui.showError("You don't have enough coins for this item! Try selling some items first.");
            return;
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
        this.ui.addNegotiationLog(
            'merchant',
            greetings[Math.floor(Math.random() * greetings.length)]
        );
    }

    /**
     * Submit player offer - processed by Claude AI
     */
    async submitOffer(offer: number): Promise<void> {
        if (!this.currentItem) return;

        // Validation
        if (offer <= 0) {
            this.ui.showError("Please enter a valid positive amount.");
            return;
        }

        if (this.mode === 'BUY' && offer > this.player.balance) {
            this.ui.showError("You don't have enough coins!");
            return;
        }

        if (this.currentRound > this.maxRounds) {
            this.ui.showError("Negotiation has ended.");
            return;
        }

        // Log player offer
        this.ui.addNegotiationLog('player', `I offer ${offer} coins.`);

        // Disable submit button during processing
        const submitBtn = document.getElementById('btn-submit-offer') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '🤖 AI thinking...';
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
                    offerHistory: [...this.offerHistory]
                },
                playerOffer: offer
            };

            // Process with Claude AI
            const result = await claudeIntegration.processNegotiation(context);

            // Update offer history
            this.offerHistory.push(offer);
            this.currentRound++;

            // Apply mood and trust changes
            this.merchant.adjustMood(result.moodChange);
            this.merchant.adjustTrust(result.trustChange);

            // Log merchant response
            this.ui.addNegotiationLog('merchant', result.message);

            // Update UI
            this.ui.updateMoodIndicator(this.merchant.mood);
            this.ui.updateTrustIndicator(this.merchant.trust);
            this.ui.updateRoundIndicator(this.currentRound, this.maxRounds);

            // Handle result
            if (result.action === 'ACCEPT') {
                this.completeDeal(offer);
            } else if (result.action === 'REJECT' || this.currentRound > this.maxRounds) {
                this.endNegotiation(false);
            }

            console.log('🤖 AI reasoning:', result.reasoning);

        } catch (error) {
            console.error('AI processing failed:', error);
            this.ui.showError(`AI error: ${(error as Error).message}`);
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Offer';
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

        // Mood bonus for successful deal
        this.merchant.adjustMood(20);

        // Trust bonus for fair dealing
        if (profit > -50 && profit < 50) {
            this.merchant.adjustTrust(5);
        }

        // Update UI
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateMoodIndicator(this.merchant.mood);
        this.ui.updateTrustIndicator(this.merchant.trust);

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
    }

    endNegotiation(success: boolean): void {
        if (!success && this.currentItem) {
            // Small mood penalty for failed negotiation
            this.merchant.adjustMood(-5);
            this.ui.updateMoodIndicator(this.merchant.mood);

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

        setTimeout(() => {
            this.ui.hideNegotiationPanel();
        }, success ? 0 : 1000);
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

    async reset(): Promise<void> {
        this.currentItem = null;
        this.currentRound = 0;
        this.offerHistory = [];
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
