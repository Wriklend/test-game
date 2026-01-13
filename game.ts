// ===== Stellar Bargains: AI Merchant Negotiation Game =====
// TypeScript source code
// Compile with: tsc game.ts

// ===== ENUMS & TYPES =====

enum Rarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic'
}

enum Condition {
    NEW = 'new',
    USED = 'used',
    DAMAGED = 'damaged'
}

enum ItemCategory {
    WEAPON = 'weapon',
    TECH = 'tech',
    ARTIFACT = 'artifact',
    CONSUMABLE = 'consumable'
}

type NegotiationMode = 'BUY' | 'SELL';
type NegotiationAction = 'ACCEPT' | 'COUNTER' | 'REJECT';

// ===== INTERFACES =====

interface ItemTemplate {
    name: string;
    description: string;
    category: ItemCategory;
    basePrice: number;
}

interface PersonalityTraits {
    name: string;
    targetMargin: number;        // % profit they aim for
    patience: number;             // rounds before frustration
    concessionRate: number;       // % price movement per round
    bluffSensitivity: number;     // how easily offended by bluffs
    moodVolatility: number;       // mood swing magnitude
}

interface NegotiationResult {
    action: NegotiationAction;
    counterOffer?: number;
    message: string;
    moodChange: number;
    trustChange: number;
    reasoning: string;
}

interface BluffMetrics {
    extremeOffers: number;
    oscillations: number;
    lastOfferRatio: number;
}

interface MessageContext {
    action: NegotiationAction;
    mood: number;
    trust: number;
    personality: string;
    round: number;
    offerRatio: number;
    isBluff: boolean;
    offer: number;
    counterOffer?: number;
    itemName: string;
}

// ===== ITEM TEMPLATES DATABASE (30+ items) =====

const ITEM_TEMPLATES: ItemTemplate[] = [
    // WEAPONS (8)
    { name: "Plasma Rifle", description: "Military-grade energy weapon", category: ItemCategory.WEAPON, basePrice: 450 },
    { name: "Neural Disruptor", description: "Non-lethal incapacitation device", category: ItemCategory.WEAPON, basePrice: 320 },
    { name: "Mono-Blade", description: "Monomolecular edge sword", category: ItemCategory.WEAPON, basePrice: 280 },
    { name: "Gravity Hammer", description: "Crushes targets with localized gravity fields", category: ItemCategory.WEAPON, basePrice: 550 },
    { name: "Arc Pistol", description: "Compact electrical discharge sidearm", category: ItemCategory.WEAPON, basePrice: 180 },
    { name: "Photon Lance", description: "Long-range beam weapon", category: ItemCategory.WEAPON, basePrice: 720 },
    { name: "Sonic Stunner", description: "Area-effect sound weapon", category: ItemCategory.WEAPON, basePrice: 240 },
    { name: "Nano-Swarm Grenade", description: "Deploys destructive nanobots", category: ItemCategory.WEAPON, basePrice: 390 },

    // TECH (10)
    { name: "Quantum Processor", description: "Advanced computing core", category: ItemCategory.TECH, basePrice: 680 },
    { name: "Holo-Projector", description: "3D holographic display system", category: ItemCategory.TECH, basePrice: 220 },
    { name: "Neural Interface", description: "Direct brain-computer connection", category: ItemCategory.TECH, basePrice: 510 },
    { name: "Fusion Cell", description: "Compact power source", category: ItemCategory.TECH, basePrice: 340 },
    { name: "Stealth Field Generator", description: "Personal cloaking device", category: ItemCategory.TECH, basePrice: 890 },
    { name: "Gravity Boots", description: "Walk on any surface", category: ItemCategory.TECH, basePrice: 420 },
    { name: "Translator Implant", description: "Universal language decoder", category: ItemCategory.TECH, basePrice: 290 },
    { name: "Repair Nanites", description: "Self-healing technology", category: ItemCategory.TECH, basePrice: 460 },
    { name: "Data Spike", description: "Hacking tool for electronic systems", category: ItemCategory.TECH, basePrice: 310 },
    { name: "Bio-Scanner", description: "Life-form detection and analysis", category: ItemCategory.TECH, basePrice: 270 },

    // ARTIFACTS (7)
    { name: "Precursor Orb", description: "Ancient alien artifact of unknown purpose", category: ItemCategory.ARTIFACT, basePrice: 950 },
    { name: "Psionic Crystal", description: "Amplifies mental abilities", category: ItemCategory.ARTIFACT, basePrice: 770 },
    { name: "Time Shard", description: "Fragment from a collapsed timeline", category: ItemCategory.ARTIFACT, basePrice: 1100 },
    { name: "Void Stone", description: "Absorbs exotic radiation", category: ItemCategory.ARTIFACT, basePrice: 640 },
    { name: "Star Chart", description: "Ancient navigation data", category: ItemCategory.ARTIFACT, basePrice: 530 },
    { name: "Memory Crystal", description: "Contains lost civilization's knowledge", category: ItemCategory.ARTIFACT, basePrice: 820 },
    { name: "Harmonic Resonator", description: "Emits reality-bending frequencies", category: ItemCategory.ARTIFACT, basePrice: 710 },

    // CONSUMABLES (7)
    { name: "Stim Pack", description: "Emergency medical injection", category: ItemCategory.CONSUMABLE, basePrice: 85 },
    { name: "Ration Bar", description: "Nutritionally complete food", category: ItemCategory.CONSUMABLE, basePrice: 25 },
    { name: "Anti-Radiation Serum", description: "Protects against ionizing radiation", category: ItemCategory.CONSUMABLE, basePrice: 140 },
    { name: "Oxygen Canister", description: "Emergency life support", category: ItemCategory.CONSUMABLE, basePrice: 60 },
    { name: "Boost Injectable", description: "Temporary physical enhancement", category: ItemCategory.CONSUMABLE, basePrice: 110 },
    { name: "Mind Shield Pill", description: "Blocks psionic intrusion", category: ItemCategory.CONSUMABLE, basePrice: 95 },
    { name: "Cryo Capsule", description: "Suspended animation pod", category: ItemCategory.CONSUMABLE, basePrice: 380 },
];

// ===== PHASE 1: CORE DATA MODELS =====

/**
 * Item class - represents a tradeable item with hidden fair price
 */
class Item {
    name: string;
    description: string;
    category: ItemCategory;
    rarity: Rarity;
    condition: Condition;
    fairPrice: number;      // Hidden from player
    marketHint: number;     // Shown to player (inaccurate)

    constructor(template: ItemTemplate, rarity: Rarity, condition: Condition) {
        this.name = template.name;
        this.description = template.description;
        this.category = template.category;
        this.rarity = rarity;
        this.condition = condition;
        this.fairPrice = this.calculateFairPrice(template.basePrice);
        this.marketHint = this.generateMarketHint();
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

/**
 * PersonalityProfile - defines merchant behavior traits
 */
class PersonalityProfile {
    traits: PersonalityTraits;

    constructor(traits: PersonalityTraits) {
        this.traits = traits;
    }

    // Three preset personalities
    static GREEDY: PersonalityTraits = {
        name: 'Greedy',
        targetMargin: 40,       // Wants 40% profit
        patience: 6,            // Can handle 6 rounds
        concessionRate: 0.03,   // Only moves 3% per round
        bluffSensitivity: 0.6,  // Somewhat tolerant of bluffs
        moodVolatility: 8       // Moderate mood swings
    };

    static HONEST: PersonalityTraits = {
        name: 'Honest',
        targetMargin: 15,       // Fair 15% margin
        patience: 5,
        concessionRate: 0.07,   // Reasonable 7% concessions
        bluffSensitivity: 0.9,  // Doesn't like dishonesty
        moodVolatility: 5       // Stable mood
    };

    static IMPULSIVE: PersonalityTraits = {
        name: 'Impulsive',
        targetMargin: 25,
        patience: 3,            // Gets impatient quickly
        concessionRate: 0.12,   // Large 12% concessions
        bluffSensitivity: 1.2,  // Very sensitive to bluffs
        moodVolatility: 15      // Wild mood swings
    };

    static random(): PersonalityProfile {
        const personalities = [
            PersonalityProfile.GREEDY,
            PersonalityProfile.HONEST,
            PersonalityProfile.IMPULSIVE
        ];
        const selected = personalities[Math.floor(Math.random() * personalities.length)];
        return new PersonalityProfile(selected);
    }
}

/**
 * Merchant class - manages personality, mood, and trust
 */
class Merchant {
    personality: PersonalityProfile;
    mood: number;       // -100 to +100
    trust: number;      // 0 to 100
    name: string;

    constructor(personality?: PersonalityProfile) {
        this.personality = personality || PersonalityProfile.random();
        this.mood = 0;      // Start neutral
        this.trust = 50;    // Start neutral
        this.name = this.generateName();
    }

    /**
     * Adjust mood with personality volatility multiplier
     * Clamp to [-100, 100]
     */
    adjustMood(delta: number): void {
        const adjusted = delta * (this.personality.traits.moodVolatility / 10);
        this.mood = Math.max(-100, Math.min(100, this.mood + adjusted));

        // Natural decay toward neutral
        if (this.mood > 0) {
            this.mood = Math.max(0, this.mood - 2);
        } else if (this.mood < 0) {
            this.mood = Math.min(0, this.mood + 2);
        }
    }

    /**
     * Adjust trust, clamped to [0, 100]
     */
    adjustTrust(delta: number): void {
        this.trust = Math.max(0, Math.min(100, this.trust + delta));
    }

    /**
     * Get mood modifier: maps [-100, 100] to [0.8, 1.2]
     * Affects acceptable price ranges
     */
    getMoodModifier(): number {
        return 1.0 + (this.mood / 500);
    }

    /**
     * Get trust modifier: maps [0, 100] to [0.7, 1.3]
     * Affects concession willingness
     */
    getTrustModifier(): number {
        return 0.7 + (this.trust / 100) * 0.6;
    }

    /**
     * Generate random merchant name
     */
    private generateName(): string {
        const prefixes = ['Zyx', 'Kron', 'Vex', 'Nyx', 'Qor', 'Jax', 'Mek', 'Rax'];
        const suffixes = ['ar', 'ix', 'or', 'el', 'ak', 'us', 'an', 'ex'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] +
               suffixes[Math.floor(Math.random() * suffixes.length)];
    }
}

/**
 * ItemGenerator - creates random items from templates
 */
class ItemGenerator {
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

// ===== PHASE 3: AI SYSTEMS =====

/**
 * BluffDetector - tracks and analyzes offer patterns
 */
class BluffDetector {
    private offerHistory: number[] = [];

    /**
     * Analyze offer and detect bluffing patterns
     */
    analyzeOffer(offer: number, fairPrice: number, mode: NegotiationMode): BluffMetrics {
        this.offerHistory.push(offer);

        return {
            extremeOffers: this.countExtremeOffers(fairPrice, mode),
            oscillations: this.detectOscillations(),
            lastOfferRatio: offer / fairPrice
        };
    }

    /**
     * Count extreme offers:
     * BUY: < 40% of fair price
     * SELL: > 160% of fair price
     */
    private countExtremeOffers(fairPrice: number, mode: NegotiationMode): number {
        let count = 0;
        for (const offer of this.offerHistory) {
            const ratio = offer / fairPrice;
            if (mode === 'BUY' && ratio < 0.4) count++;
            if (mode === 'SELL' && ratio > 1.6) count++;
        }
        return count;
    }

    /**
     * Detect wild oscillations (> 30% swings between consecutive offers)
     */
    private detectOscillations(): number {
        let count = 0;
        for (let i = 1; i < this.offerHistory.length; i++) {
            const prev = this.offerHistory[i - 1];
            const curr = this.offerHistory[i];
            const change = Math.abs(curr - prev) / prev;
            if (change > 0.3) count++;
        }
        return count;
    }

    /**
     * Determine if player is bluffing
     * Triggers: 2+ extreme offers OR 3+ oscillations
     */
    isBluffing(metrics: BluffMetrics): boolean {
        return metrics.extremeOffers > 1 || metrics.oscillations > 2;
    }

    reset(): void {
        this.offerHistory = [];
    }
}

// ===== PHASE 2: NEGOTIATION ENGINE =====

/**
 * NegotiationEngine - core negotiation logic
 */
class NegotiationEngine {
    merchant: Merchant;
    item: Item;
    mode: NegotiationMode;
    round: number = 1;
    maxRounds: number = 6;
    lastMerchantOffer: number | null = null;

    constructor(merchant: Merchant, item: Item, mode: NegotiationMode, hardMode: boolean = false) {
        this.merchant = merchant;
        this.item = item;
        this.mode = mode;
        this.maxRounds = hardMode ? 4 : 6;
    }

    /**
     * Calculate acceptable price range based on personality, mood, trust, and round pressure
     */
    calculateAcceptableRange(): { min: number, max: number } {
        const fairPrice = this.item.fairPrice;
        const margin = this.merchant.personality.traits.targetMargin / 100;
        const moodMod = this.merchant.getMoodModifier();
        const trustMod = this.merchant.getTrustModifier();
        const roundPressure = 1 + (this.round / this.maxRounds) * 0.3;

        if (this.mode === 'BUY') {
            // Merchant is selling - wants price above fair
            const baseMin = fairPrice * (1 + margin);
            const adjustedMin = baseMin / (moodMod * trustMod * roundPressure);
            return {
                min: adjustedMin,
                max: fairPrice * 2
            };
        } else {
            // Merchant is buying - wants price below fair
            const baseMax = fairPrice * (1 - margin);
            const adjustedMax = baseMax * (moodMod * trustMod * roundPressure);
            return {
                min: 0,
                max: adjustedMax
            };
        }
    }

    /**
     * Evaluate player offer and return negotiation result
     */
    evaluateOffer(playerOffer: number): NegotiationResult {
        const fairPrice = this.item.fairPrice;
        const { min, max } = this.calculateAcceptableRange();

        // Check if merchant should walk away
        if (this.shouldWalkAway()) {
            return {
                action: 'REJECT',
                message: '',
                moodChange: -10,
                trustChange: -5,
                reasoning: 'Walked away due to frustration or exceeded patience'
            };
        }

        // Calculate offer quality ratio
        const ratio = this.mode === 'BUY'
            ? playerOffer / fairPrice
            : fairPrice / playerOffer;

        // Check if within acceptable range
        const inRange = this.mode === 'BUY'
            ? (playerOffer >= min && playerOffer <= max)
            : (playerOffer >= min && playerOffer <= max);

        if (inRange) {
            return this.acceptOffer(playerOffer, ratio);
        }

        // Generate counteroffer
        const counter = this.generateCounteroffer(playerOffer);

        // Calculate mood change based on offer quality
        let moodChange = 0;
        if (ratio < 0.5) {
            moodChange = -15 * (this.merchant.personality.traits.moodVolatility / 10);
        } else if (ratio < 0.7) {
            moodChange = -8 * (this.merchant.personality.traits.moodVolatility / 10);
        } else if (ratio < 0.9) {
            moodChange = -3;
        } else if (ratio > 1.2) {
            moodChange = 10;
        }

        return {
            action: 'COUNTER',
            counterOffer: counter,
            message: '',
            moodChange,
            trustChange: 0,
            reasoning: `Offer ${ratio.toFixed(2)}x fair, counter at ${counter}`
        };
    }

    /**
     * Generate counteroffer with concessions toward fair price
     */
    generateCounteroffer(playerOffer: number): number {
        const fairPrice = this.item.fairPrice;
        const concessionRate = this.merchant.personality.traits.concessionRate;
        const trustMod = this.merchant.getTrustModifier();

        // Starting anchor (first offer)
        const anchor = this.lastMerchantOffer ?? (
            this.mode === 'BUY'
                ? fairPrice * 1.4  // Start high when selling
                : fairPrice * 0.6  // Start low when buying
        );

        // Move toward player offer with concessions
        const direction = playerOffer > anchor ? 1 : -1;
        const gap = Math.abs(playerOffer - anchor);
        const concession = gap * concessionRate * trustMod;

        const counter = anchor + (direction * concession);
        this.lastMerchantOffer = Math.round(counter);

        return Math.round(counter);
    }

    /**
     * Accept offer and calculate mood/trust changes
     */
    private acceptOffer(playerOffer: number, ratio: number): NegotiationResult {
        let moodChange = 20; // Base happiness from closing deal
        let trustChange = 0;

        // Bonus trust if fair deal
        if (ratio >= 0.9 && ratio <= 1.1) {
            trustChange = 5;
        }

        return {
            action: 'ACCEPT',
            message: '',
            moodChange,
            trustChange,
            reasoning: `Accepted offer of ${playerOffer}`
        };
    }

    /**
     * Check if merchant should walk away
     */
    shouldWalkAway(): boolean {
        return this.merchant.mood < -60 || this.round > this.merchant.personality.traits.patience;
    }
}

/**
 * NegotiationSession - manages current negotiation state
 */
class NegotiationSession {
    engine: NegotiationEngine;
    bluffDetector: BluffDetector;
    history: Array<{ round: number, playerOffer: number, result: NegotiationResult }> = [];

    constructor(engine: NegotiationEngine) {
        this.engine = engine;
        this.bluffDetector = new BluffDetector();
    }

    /**
     * Process player offer through full pipeline
     */
    processPlayerOffer(offer: number): NegotiationResult {
        // 1. Detect bluffs
        const bluffMetrics = this.bluffDetector.analyzeOffer(
            offer,
            this.engine.item.fairPrice,
            this.engine.mode
        );

        // 2. Adjust trust if bluffing
        if (this.bluffDetector.isBluffing(bluffMetrics)) {
            this.engine.merchant.adjustTrust(-10 * this.engine.merchant.personality.traits.bluffSensitivity);
        }

        // 3. Evaluate offer
        const result = this.engine.evaluateOffer(offer);

        // 4. Apply mood/trust changes
        this.engine.merchant.adjustMood(result.moodChange);
        this.engine.merchant.adjustTrust(result.trustChange);

        // 5. Record history
        this.history.push({ round: this.engine.round, playerOffer: offer, result });

        // 6. Increment round
        this.engine.round++;

        return result;
    }

    isComplete(): boolean {
        if (this.history.length === 0) return false;
        const lastResult = this.history[this.history.length - 1].result;
        return this.engine.round > this.engine.maxRounds || lastResult.action !== 'COUNTER';
    }

    isBluffing(): boolean {
        const lastOffer = this.history[this.history.length - 1]?.playerOffer;
        if (!lastOffer) return false;

        const metrics = this.bluffDetector.analyzeOffer(
            lastOffer,
            this.engine.item.fairPrice,
            this.engine.mode
        );
        return this.bluffDetector.isBluffing(metrics);
    }
}

// ===== PHASE 4: MESSAGE GENERATION =====

/**
 * MessageGenerator - creates contextual merchant responses
 */
class MessageGenerator {
    private templates = {
        accept_positive: [
            "Excellent! I think we have a deal at {price} coins. Pleasure doing business!",
            "That works for me! {price} coins it is. You drive a fair bargain.",
            "I like your style. {price} coins and the {item} is yours!",
            "Perfect! {price} coins is exactly what I was hoping for. Deal!"
        ],
        accept_neutral: [
            "Alright, {price} coins. Deal.",
            "Fine. {price} coins. Let's close this.",
            "{price} coins is acceptable. We have an agreement.",
            "I can work with {price} coins. Done."
        ],
        accept_reluctant: [
            "...Fine. {price} coins. But I'm not happy about it.",
            "You're pushing hard, but okay. {price} coins.",
            "Against my better judgment, {price} coins. Deal.",
            "I shouldn't do this, but... {price} coins. Take it."
        ],

        counter_greedy_high: [
            "Ha! {offer} coins? I'm thinking more like {counter} coins.",
            "Nice try. This {item} is worth {counter} coins at least.",
            "You're funny. Counter: {counter} coins.",
            "{offer}? Not even close. I need {counter} coins for this beauty."
        ],
        counter_honest_fair: [
            "I appreciate the offer, but {counter} coins is closer to fair value.",
            "Let's be reasonable. How about {counter} coins?",
            "I can meet you at {counter} coins. That's fair for both of us.",
            "I understand your position. {counter} coins is my counteroffer."
        ],
        counter_impulsive_emotional: [
            "Whoa! {counter} coins! Take it or leave it!",
            "Nah, nah, nah. {counter} coins. Right now!",
            "I'm feeling {counter} coins. What do you say?",
            "Okay okay, {counter} coins! But you need to decide fast!"
        ],
        counter_frustrated: [
            "We're wasting time. {counter} coins is my offer.",
            "Look, I'll go to {counter} coins but we need to wrap this up.",
            "I'm losing patience. {counter} coins. Final offer soon.",
            "This is taking too long. {counter} coins. Take it."
        ],
        counter_suspicious: [
            "I'm not sure I trust your assessment. {counter} coins.",
            "Something feels off here. I'll counter with {counter} coins.",
            "You're playing games. {counter} coins, and I'm watching you.",
            "I don't like this. {counter} coins is my counter."
        ],

        reject_polite: [
            "I'm sorry, but I can't accept that. Let's try another time.",
            "We couldn't reach an agreement. Perhaps next time.",
            "I respect your position, but I have to decline.",
            "Unfortunately, we're too far apart. Maybe another deal."
        ],
        reject_annoyed: [
            "This isn't working. I'm done here.",
            "No deal. We're too far apart.",
            "Forget it. I can't do this anymore.",
            "I'm out. This is a waste of time."
        ],
        reject_offended: [
            "Are you serious? That's insulting. We're done.",
            "I don't appreciate being played with. No deal.",
            "You've wasted my time with ridiculous offers. Goodbye.",
            "That's it. Your offers are an insult. I'm walking."
        ],

        bluff_detected: [
            "I can tell you're not being straight with me. That affects my trust.",
            "Those wild offers aren't helping your case.",
            "You keep changing your story. I'm getting suspicious.",
            "Stop playing games. Your inconsistency is noted."
        ]
    };

    generate(context: MessageContext): string {
        let pool: string[] = [];

        // Priority 1: Bluff detection
        if (context.isBluff && Math.random() > 0.5) {
            pool = this.templates.bluff_detected;
        }
        // Priority 2: Action type
        else if (context.action === 'ACCEPT') {
            if (context.mood > 30) pool = this.templates.accept_positive;
            else if (context.mood < -30) pool = this.templates.accept_reluctant;
            else pool = this.templates.accept_neutral;
        }
        else if (context.action === 'COUNTER') {
            // Check trust for suspicion
            if (context.trust < 30) {
                pool = this.templates.counter_suspicious;
            }
            // Check mood for frustration
            else if (context.mood < -40) {
                pool = this.templates.counter_frustrated;
            }
            // Use personality
            else {
                switch (context.personality) {
                    case 'Greedy':
                        pool = this.templates.counter_greedy_high;
                        break;
                    case 'Honest':
                        pool = this.templates.counter_honest_fair;
                        break;
                    case 'Impulsive':
                        pool = this.templates.counter_impulsive_emotional;
                        break;
                }
            }
        }
        else if (context.action === 'REJECT') {
            if (context.isBluff || context.trust < 20) {
                pool = this.templates.reject_offended;
            } else if (context.mood < -40) {
                pool = this.templates.reject_annoyed;
            } else {
                pool = this.templates.reject_polite;
            }
        }

        // Select random template from pool
        if (pool.length === 0) pool = this.templates.accept_neutral;
        const template = pool[Math.floor(Math.random() * pool.length)];

        // Replace placeholders
        return template
            .replace('{price}', (context.counterOffer || context.offer).toString())
            .replace('{offer}', context.offer.toString())
            .replace('{counter}', (context.counterOffer || '').toString())
            .replace('{item}', context.itemName);
    }
}

// ===== PHASE 6: UI CONTROLLER =====

/**
 * UIController - manages DOM updates and user interactions
 */
class UIController {
    game: Game;

    constructor(game: Game) {
        this.game = game;
        this.setupEventListeners();
    }

    setupEventListeners(): void {
        // Mode buttons
        document.getElementById('btn-buy')!.addEventListener('click', () => {
            this.game.startNegotiation('BUY');
        });

        document.getElementById('btn-sell')!.addEventListener('click', () => {
            this.game.startNegotiation('SELL');
        });

        // Submit offer
        document.getElementById('btn-submit-offer')!.addEventListener('click', () => {
            const input = document.getElementById('player-offer') as HTMLInputElement;
            const offer = parseInt(input.value);
            if (!isNaN(offer) && offer > 0) {
                this.game.submitOffer(offer);
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
                this.game.reset();
            }
        });

        // Tutorial toggle
        document.getElementById('toggle-tutorial-btn')!.addEventListener('click', () => {
            const content = document.getElementById('tutorial-content')!;
            content.classList.toggle('hidden');
        });

        // Modal close
        document.getElementById('btn-close-modal')!.addEventListener('click', () => {
            document.getElementById('deal-modal')!.classList.add('hidden');
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

    showDealSummary(finalPrice: number, fairValue: number, profit: number, success: boolean): void {
        document.getElementById('deal-result')!.textContent = success ? '✅ Deal Closed!' : '❌ No Deal';
        document.getElementById('final-price')!.textContent = finalPrice.toString();
        document.getElementById('fair-value')!.textContent = fairValue.toString();

        const profitEl = document.getElementById('deal-profit')!;
        profitEl.textContent = (profit >= 0 ? '+' : '') + profit.toString();
        profitEl.className = profit >= 0 ? 'profit-positive' : 'profit-negative';

        document.getElementById('deal-modal')!.classList.remove('hidden');
    }

    showError(message: string): void {
        alert(message);
    }

    reset(): void {
        this.hideNegotiationPanel();
        document.getElementById('negotiation-log')!.innerHTML = '';
    }
}

// ===== PHASE 5: GAME LOOP & STATE =====

/**
 * Game - main orchestrator
 */
class Game {
    player: { balance: number, profit: number };
    merchant: Merchant;
    currentItem: Item | null = null;
    currentSession: NegotiationSession | null = null;
    mode: NegotiationMode = 'BUY';
    hardMode: boolean = false;
    itemGenerator: ItemGenerator;
    messageGenerator: MessageGenerator;
    ui: UIController;

    constructor() {
        this.player = { balance: 1000, profit: 0 };
        this.merchant = new Merchant();
        this.itemGenerator = new ItemGenerator();
        this.messageGenerator = new MessageGenerator();
        this.ui = new UIController(this);

        // Update initial UI
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateMerchantInfo(this.merchant);

        // Hard mode toggle
        document.getElementById('hard-mode')!.addEventListener('change', (e: Event) => {
            this.hardMode = (e.target as HTMLInputElement).checked;
        });
    }

    startNegotiation(mode: NegotiationMode): void {
        this.mode = mode;
        this.currentItem = this.itemGenerator.generateRandom();

        // Check if player can afford (BUY mode)
        if (mode === 'BUY' && this.currentItem.marketHint > this.player.balance) {
            this.ui.showError("You don't have enough coins for this item! Try selling some items first.");
            return;
        }

        const engine = new NegotiationEngine(
            this.merchant,
            this.currentItem,
            mode,
            this.hardMode
        );

        this.currentSession = new NegotiationSession(engine);

        this.ui.displayItem(this.currentItem);
        this.ui.showNegotiationPanel(mode, 1, engine.maxRounds);

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

    submitOffer(offer: number): void {
        if (!this.currentSession || !this.currentItem) return;

        // Validation
        if (offer <= 0) {
            this.ui.showError("Please enter a valid positive amount.");
            return;
        }

        if (this.mode === 'BUY' && offer > this.player.balance) {
            this.ui.showError("You don't have enough coins!");
            return;
        }

        if (this.currentSession.isComplete()) {
            this.ui.showError("Negotiation has ended.");
            return;
        }

        // Log player offer
        this.ui.addNegotiationLog('player', `I offer ${offer} coins.`);

        // Process offer
        const result = this.currentSession.processPlayerOffer(offer);

        // Generate message
        const message = this.messageGenerator.generate({
            action: result.action,
            mood: this.merchant.mood,
            trust: this.merchant.trust,
            personality: this.merchant.personality.traits.name,
            round: this.currentSession.engine.round - 1,
            offerRatio: offer / this.currentItem.fairPrice,
            isBluff: this.currentSession.isBluffing(),
            offer: offer,
            counterOffer: result.counterOffer,
            itemName: this.currentItem.name
        });

        // Log merchant response
        this.ui.addNegotiationLog('merchant', message);

        // Update UI
        this.ui.updateMoodIndicator(this.merchant.mood);
        this.ui.updateTrustIndicator(this.merchant.trust);
        this.ui.updateRoundIndicator(
            this.currentSession.engine.round,
            this.currentSession.engine.maxRounds
        );

        // Handle result
        if (result.action === 'ACCEPT') {
            this.completeDeal(offer);
        } else if (result.action === 'REJECT' || this.currentSession.isComplete()) {
            this.endNegotiation(false);
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

        // Trust bonus if no bluffing
        if (!this.currentSession!.isBluffing()) {
            this.merchant.adjustTrust(5);
        }

        // Update UI
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateMoodIndicator(this.merchant.mood);
        this.ui.updateTrustIndicator(this.merchant.trust);

        // Show summary
        this.ui.showDealSummary(finalPrice, this.currentItem.fairPrice, profit, true);

        this.endNegotiation(true);
    }

    endNegotiation(success: boolean): void {
        if (!success && this.currentItem) {
            // Small mood penalty for failed negotiation
            this.merchant.adjustMood(-5);
            this.ui.updateMoodIndicator(this.merchant.mood);

            // Show summary with 0 profit
            setTimeout(() => {
                this.ui.showDealSummary(0, this.currentItem!.fairPrice, 0, false);
            }, 500);
        }

        this.currentSession = null;
        this.currentItem = null;

        setTimeout(() => {
            this.ui.hideNegotiationPanel();
        }, success ? 0 : 1000);
    }

    reset(): void {
        this.player = { balance: 1000, profit: 0 };
        this.merchant = new Merchant();
        this.currentItem = null;
        this.currentSession = null;
        this.hardMode = (document.getElementById('hard-mode') as HTMLInputElement).checked;

        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateMerchantInfo(this.merchant);
        this.ui.reset();
    }
}

// ===== INITIALIZE GAME =====

let game: Game;

window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    console.log('🎮 Stellar Bargains initialized!');
    console.log('💡 Tip: Check the tutorial for game mechanics');
});
