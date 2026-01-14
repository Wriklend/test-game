// ===== ITEM GENERATOR CLASS =====

import { Rarity, Condition } from '../types/enums';
import type { ItemTemplate } from '../types/interfaces';
import { ITEM_TEMPLATES } from '../data/itemTemplates';
import { Item } from './Item';

/**
 * ItemGenerator - creates random items from templates
 */
export class ItemGenerator {
    private templates: ItemTemplate[] = ITEM_TEMPLATES;

    generateRandom(): Item {
        const template = this.templates[Math.floor(Math.random() * this.templates.length)];
        const rarity = this.randomRarity();
        const condition = this.randomCondition();
        return new Item(template, rarity, condition);
    }

    /**
     * Weighted rarity distribution: 60% common, 30% rare, 10% epic
     */
    private randomRarity(): Rarity {
        const roll = Math.random();
        if (roll < 0.6) return Rarity.COMMON;
        if (roll < 0.9) return Rarity.RARE;
        return Rarity.EPIC;
    }

    /**
     * Condition distribution: 50% new, 30% used, 20% damaged
     */
    private randomCondition(): Condition {
        const roll = Math.random();
        if (roll < 0.5) return Condition.NEW;
        if (roll < 0.8) return Condition.USED;
        return Condition.DAMAGED;
    }
}
