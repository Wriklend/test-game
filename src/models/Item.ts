// ===== ITEM CLASS =====

import { ItemCategory, Rarity, Condition, WearableSlot } from '../types/enums';
import type { ItemTemplate } from '../types/interfaces';

/**
 * Item class - represents a tradeable item with hidden fair price
 */
export class Item {
    name: string;
    description: string;
    category: ItemCategory;
    rarity: Rarity;
    condition: Condition;
    fairPrice: number;      // Hidden from player
    marketHint: number;     // Shown to player (inaccurate)
    slot?: WearableSlot;    // For wearable items
    moodBonus?: number;     // Mood boost when equipped
    isEquipped: boolean;    // Whether item is currently equipped

    constructor(template: ItemTemplate, rarity: Rarity, condition: Condition) {
        this.name = template.name;
        this.description = template.description;
        this.category = template.category;
        this.rarity = rarity;
        this.condition = condition;
        this.fairPrice = this.calculateFairPrice(template.basePrice);
        this.marketHint = this.generateMarketHint();
        this.slot = template.slot;
        this.moodBonus = template.moodBonus;
        this.isEquipped = false;
    }

    /**
     * Calculate fair price based on rarity and condition modifiers
     */
    private calculateFairPrice(basePrice: number): number {
        const rarityMultipliers = {
            [Rarity.COMMON]: 1.0,
            [Rarity.RARE]: 2.5,
            [Rarity.EPIC]: 5.0
        };

        const conditionMultipliers = {
            [Condition.NEW]: 1.0,
            [Condition.USED]: 0.7,
            [Condition.DAMAGED]: 0.4
        };

        return Math.round(basePrice * rarityMultipliers[this.rarity] * conditionMultipliers[this.condition]);
    }

    /**
     * Generate market hint with intentional noise (±15-30%)
     * This creates information asymmetry
     */
    private generateMarketHint(): number {
        const noisePercent = 0.15 + Math.random() * 0.15; // 15% to 30%
        const direction = Math.random() > 0.5 ? 1 : -1;
        return Math.round(this.fairPrice * (1 + direction * noisePercent));
    }
}
