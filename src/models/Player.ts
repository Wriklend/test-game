// ===== PLAYER CLASS =====
// AI-generated player character with personality and stats

import type { ClaudePlayerPersonality } from '../integrations/claude';
import type { Item } from './Item';

export class Player {
    name: string;
    species: string;
    profession: string;
    backstory: string;
    tradingStyle: string;
    balance: number;
    profit: number;
    specialAbility: string;
    weakness: string;
    avatar: string;
    catchphrases: string[];
    inventory: Item[];

    constructor(personality?: ClaudePlayerPersonality) {
        if (personality) {
            this.name = personality.name;
            this.species = personality.species;
            this.profession = personality.profession;
            this.backstory = personality.backstory;
            this.tradingStyle = personality.tradingStyle;
            this.balance = personality.startingBalance;
            this.specialAbility = personality.specialAbility;
            this.weakness = personality.weakness;
            this.avatar = personality.avatar;
            this.catchphrases = personality.catchphrases;
        } else {
            // Default player (fallback)
            this.name = 'Unknown Trader';
            this.species = 'Human';
            this.profession = 'Freelance Trader';
            this.backstory = 'A mysterious trader with unknown origins.';
            this.tradingStyle = 'cautious';
            this.balance = 1000;
            this.specialAbility = 'None';
            this.weakness = 'None';
            this.avatar = '👤';
            this.catchphrases = ['Let\'s make a deal.', 'Fair price for fair goods.'];
        }
        this.profit = 0;
        this.inventory = [];
    }

    /**
     * Get a random catchphrase
     */
    getCatchphrase(): string {
        return this.catchphrases[Math.floor(Math.random() * this.catchphrases.length)];
    }

    /**
     * Get formatted player info
     */
    getDisplayInfo(): string {
        return `${this.avatar} ${this.name} - ${this.species} ${this.profession}`;
    }

    /**
     * Add item to inventory
     */
    addItem(item: Item): void {
        this.inventory.push(item);
    }

    /**
     * Remove item from inventory by index
     */
    removeItem(index: number): Item | null {
        if (index >= 0 && index < this.inventory.length) {
            return this.inventory.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * Check if inventory has items
     */
    hasItems(): boolean {
        return this.inventory.length > 0;
    }
}
