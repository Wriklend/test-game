// ===== WEARABLE ITEMS FOR SHOP =====
// These items give mood bonuses when equipped

import { ItemCategory, WearableSlot } from '../types/enums';
import type { ItemTemplate } from '../types/interfaces';

export const WEARABLE_TEMPLATES: ItemTemplate[] = [
    // ===== HEAD ITEMS =====
    {
        name: 'Silk Trader Hat',
        description: 'An elegant hat worn by successful merchants across the galaxy',
        category: ItemCategory.WEARABLE,
        basePrice: 150,
        slot: WearableSlot.HEAD,
        moodBonus: 10
    },
    {
        name: 'Neural Crown',
        description: 'Sophisticated headwear with subtle psionic enhancers',
        category: ItemCategory.WEARABLE,
        basePrice: 300,
        slot: WearableSlot.HEAD,
        moodBonus: 15
    },
    {
        name: 'Captain\'s Beret',
        description: 'A distinguished military beret that commands respect',
        category: ItemCategory.WEARABLE,
        basePrice: 200,
        slot: WearableSlot.HEAD,
        moodBonus: 12
    },

    // ===== BODY ITEMS =====
    {
        name: 'Business Suit',
        description: 'Professional attire that makes you look trustworthy',
        category: ItemCategory.WEARABLE,
        basePrice: 250,
        slot: WearableSlot.BODY,
        moodBonus: 12
    },
    {
        name: 'Diplomat\'s Robe',
        description: 'Flowing robes that signal peaceful intentions and high status',
        category: ItemCategory.WEARABLE,
        basePrice: 400,
        slot: WearableSlot.BODY,
        moodBonus: 18
    },
    {
        name: 'Merchant\'s Vest',
        description: 'Practical vest with many pockets, worn by successful traders',
        category: ItemCategory.WEARABLE,
        basePrice: 180,
        slot: WearableSlot.BODY,
        moodBonus: 10
    },
    {
        name: 'Noble\'s Coat',
        description: 'Luxurious coat that screams wealth and influence',
        category: ItemCategory.WEARABLE,
        basePrice: 500,
        slot: WearableSlot.BODY,
        moodBonus: 20
    },

    // ===== ACCESSORIES =====
    {
        name: 'Golden Watch',
        description: 'Expensive timepiece that shows you value time and money',
        category: ItemCategory.WEARABLE,
        basePrice: 300,
        slot: WearableSlot.ACCESSORY,
        moodBonus: 15
    },
    {
        name: 'Guild Badge',
        description: 'Official badge from the Merchant\'s Guild - instant credibility',
        category: ItemCategory.WEARABLE,
        basePrice: 350,
        slot: WearableSlot.ACCESSORY,
        moodBonus: 16
    },
    {
        name: 'Charm Bracelet',
        description: 'Bracelet adorned with exotic charms from distant worlds',
        category: ItemCategory.WEARABLE,
        basePrice: 200,
        slot: WearableSlot.ACCESSORY,
        moodBonus: 12
    },
    {
        name: 'Holographic Pin',
        description: 'Shimmering pin that displays your wealth',
        category: ItemCategory.WEARABLE,
        basePrice: 180,
        slot: WearableSlot.ACCESSORY,
        moodBonus: 10
    },
    {
        name: 'Platinum Ring',
        description: 'Stunning ring that catches the eye and demands respect',
        category: ItemCategory.WEARABLE,
        basePrice: 450,
        slot: WearableSlot.ACCESSORY,
        moodBonus: 18
    }
];
