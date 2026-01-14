// ===== SAVE MANAGER =====
// Handles game save/load and persistent storage

import type { ClaudePersonality, ClaudePlayerPersonality } from '../integrations/claude';

export interface GameSave {
    version: string;
    timestamp: number;
    player: {
        balance: number;
        profit: number;
        inventory: Array<{
            name: string;
            description: string;
            category: string;
            rarity: string;
            condition: string;
            fairPrice: number;
            marketHint: number;
        }>;
        personality: ClaudePlayerPersonality;
    };
    merchant: {
        personality: ClaudePersonality;
        mood: number;
        trust: number;
    };
    stats: {
        totalDeals: number;
        successfulDeals: number;
        failedNegotiations: number;
        score: number;
    };
    settings: {
        hardMode: boolean;
    };
}

export interface GameStats {
    totalDeals: number;
    successfulDeals: number;
    failedNegotiations: number;
    score: number;
}

export class SaveManager {
    private static readonly SAVE_KEY = 'stellar-bargains-save';
    private static readonly VERSION = '1.0.0';

    /**
     * Calculate score based on game stats
     * Formula: profit + (successful_deals × 50) + efficiency_bonus - (failed × 25)
     */
    static calculateScore(profit: number, stats: GameStats): number {
        const baseScore = Math.max(0, profit); // Can't go negative
        const dealBonus = stats.successfulDeals * 50;
        const failurePenalty = stats.failedNegotiations * 25;

        // Efficiency bonus: if profit per deal > 100, add bonus
        const avgProfitPerDeal = stats.successfulDeals > 0
            ? profit / stats.successfulDeals
            : 0;
        const efficiencyBonus = avgProfitPerDeal > 100
            ? Math.floor(stats.successfulDeals * 25)
            : 0;

        return Math.max(0, Math.floor(baseScore + dealBonus + efficiencyBonus - failurePenalty));
    }

    /**
     * Save game state to localStorage
     */
    static saveGame(saveData: Omit<GameSave, 'version' | 'timestamp'>): boolean {
        try {
            const fullSave: GameSave = {
                version: this.VERSION,
                timestamp: Date.now(),
                ...saveData
            };

            localStorage.setItem(this.SAVE_KEY, JSON.stringify(fullSave));
            console.log('✓ Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    /**
     * Load game state from localStorage
     */
    static loadGame(): GameSave | null {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) {
                console.log('No saved game found');
                return null;
            }

            const save = JSON.parse(savedData) as GameSave;

            // Version check (for future migrations)
            if (save.version !== this.VERSION) {
                console.warn(`Save version mismatch: ${save.version} vs ${this.VERSION}`);
                // Could add migration logic here
            }

            console.log('✓ Game loaded successfully');
            return save;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    /**
     * Check if a saved game exists
     */
    static hasSavedGame(): boolean {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    /**
     * Delete saved game
     */
    static deleteSave(): boolean {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            console.log('✓ Save deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * Get save file info without loading full state
     */
    static getSaveInfo(): { timestamp: number; profit: number; score: number } | null {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) return null;

            const save = JSON.parse(savedData) as GameSave;
            return {
                timestamp: save.timestamp,
                profit: save.player.profit,
                score: save.stats.score
            };
        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }
}
