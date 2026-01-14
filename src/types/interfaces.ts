// ===== INTERFACES =====

import type { ItemCategory, WearableSlot } from './enums';
import type { NegotiationAction, NegotiationMode } from './types';
import type { Item } from '../models/Item';
import type { Merchant } from '../models/Merchant';
import type { Player } from '../models/Player';

export interface ItemTemplate {
    name: string;
    description: string;
    category: ItemCategory;
    basePrice: number;
    slot?: WearableSlot;        // For wearable items
    moodBonus?: number;         // Mood boost when equipped (for wearables)
}

export interface PersonalityTraits {
    name: string;
    targetMargin: number;        // % profit they aim for
    patience: number;             // rounds before frustration
    concessionRate: number;       // % price movement per round
    bluffSensitivity: number;     // how easily offended by bluffs
    moodVolatility: number;       // mood swing magnitude
}

// Claude API response for negotiation
export interface ClaudeNegotiationResponse {
    action: NegotiationAction;           // ACCEPT, COUNTER, or REJECT
    counterOffer?: number;               // If action is COUNTER
    message: string;                     // Merchant's response message
    moodChange: number;                  // -100 to +100
    trustChange: number;                 // -100 to +100
    reasoning: string;                   // AI's reasoning (for debugging)
    extractedPrice?: number;             // Price extracted from player's message (if any)
}

// Chat message for negotiation history
export interface ChatMessage {
    speaker: 'player' | 'merchant';
    message: string;
}

// Context sent to Claude API for each offer
export interface NegotiationContext {
    mode: NegotiationMode;               // BUY or SELL
    item: {
        name: string;
        description: string;
        fairPrice: number;               // Actual fair price (not shown to player)
        marketHint: number;              // Price hint shown to player
    };
    merchant: {
        name: string;
        personality: string;
        mood: number;                    // Current mood (-100 to +100)
        trust: number;                   // Current trust (0 to 100)
        backstory?: string;              // Optional extended personality
    };
    negotiation: {
        currentRound: number;
        maxRounds: number;
        offerHistory: number[];          // All previous player offers (extracted prices)
        merchantCounterHistory: number[]; // All previous merchant counter-offers
        chatHistory: ChatMessage[];      // Full dialogue history
    };
    playerMessage: string;               // Current message from player (free-form text)
}

// ===== GAME INTERFACE (for breaking circular dependency) =====

export interface IGame {
    startNegotiation(mode: NegotiationMode): void;
    submitOffer(message: string): Promise<void>;
    reset(): Promise<void>;
    generateNewMerchant(): Promise<void>;
    saveGame(): void;
    loadGame(): Promise<boolean>;
    submitToLeaderboard(playerName: string): number | null;
    qualifiesForLeaderboard(): boolean;
    openShop(): void;
    merchant: Merchant;
    player: Player;
    currentItem: Item | null;
    currentRound: number;
    maxRounds: number;
    mode: NegotiationMode;
    offerHistory: number[];
    merchantCounterHistory: number[];
    chatHistory: ChatMessage[];
}
