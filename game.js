// ===== Stellar Bargains: AI Merchant Negotiation Game =====
// TypeScript source code
// Compile with: tsc game.ts
// ===== ENUMS & TYPES =====
var Rarity;
(function (Rarity) {
    Rarity["COMMON"] = "common";
    Rarity["RARE"] = "rare";
    Rarity["EPIC"] = "epic";
})(Rarity || (Rarity = {}));
var Condition;
(function (Condition) {
    Condition["NEW"] = "new";
    Condition["USED"] = "used";
    Condition["DAMAGED"] = "damaged";
})(Condition || (Condition = {}));
var ItemCategory;
(function (ItemCategory) {
    ItemCategory["WEAPON"] = "weapon";
    ItemCategory["TECH"] = "tech";
    ItemCategory["ARTIFACT"] = "artifact";
    ItemCategory["CONSUMABLE"] = "consumable";
})(ItemCategory || (ItemCategory = {}));
// ===== ITEM TEMPLATES DATABASE (30+ items) =====
var ITEM_TEMPLATES = [
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
var Item = /** @class */ (function () {
    function Item(template, rarity, condition) {
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
    Item.prototype.calculateFairPrice = function (basePrice) {
        var _a, _b;
        var rarityMultipliers = (_a = {},
            _a[Rarity.COMMON] = 1.0,
            _a[Rarity.RARE] = 2.5,
            _a[Rarity.EPIC] = 5.0,
            _a);
        var conditionMultipliers = (_b = {},
            _b[Condition.NEW] = 1.0,
            _b[Condition.USED] = 0.7,
            _b[Condition.DAMAGED] = 0.4,
            _b);
        return Math.round(basePrice * rarityMultipliers[this.rarity] * conditionMultipliers[this.condition]);
    };
    /**
     * Generate market hint with intentional noise (±15-30%)
     * This creates information asymmetry
     */
    Item.prototype.generateMarketHint = function () {
        var noisePercent = 0.15 + Math.random() * 0.15; // 15% to 30%
        var direction = Math.random() > 0.5 ? 1 : -1;
        return Math.round(this.fairPrice * (1 + direction * noisePercent));
    };
    return Item;
}());
/**
 * PersonalityProfile - defines merchant behavior traits
 */
var PersonalityProfile = /** @class */ (function () {
    function PersonalityProfile(traits) {
        this.traits = traits;
    }
    PersonalityProfile.random = function () {
        var personalities = [
            PersonalityProfile.GREEDY,
            PersonalityProfile.HONEST,
            PersonalityProfile.IMPULSIVE
        ];
        var selected = personalities[Math.floor(Math.random() * personalities.length)];
        return new PersonalityProfile(selected);
    };
    // Three preset personalities
    PersonalityProfile.GREEDY = {
        name: 'Greedy',
        targetMargin: 40, // Wants 40% profit
        patience: 6, // Can handle 6 rounds
        concessionRate: 0.03, // Only moves 3% per round
        bluffSensitivity: 0.6, // Somewhat tolerant of bluffs
        moodVolatility: 8 // Moderate mood swings
    };
    PersonalityProfile.HONEST = {
        name: 'Honest',
        targetMargin: 15, // Fair 15% margin
        patience: 5,
        concessionRate: 0.07, // Reasonable 7% concessions
        bluffSensitivity: 0.9, // Doesn't like dishonesty
        moodVolatility: 5 // Stable mood
    };
    PersonalityProfile.IMPULSIVE = {
        name: 'Impulsive',
        targetMargin: 25,
        patience: 3, // Gets impatient quickly
        concessionRate: 0.12, // Large 12% concessions
        bluffSensitivity: 1.2, // Very sensitive to bluffs
        moodVolatility: 15 // Wild mood swings
    };
    return PersonalityProfile;
}());
/**
 * Merchant class - manages personality, mood, and trust
 */
var Merchant = /** @class */ (function () {
    function Merchant(personality) {
        this.personality = personality || PersonalityProfile.random();
        this.mood = 0; // Start neutral
        this.trust = 50; // Start neutral
        this.name = this.generateName();
    }
    /**
     * Adjust mood with personality volatility multiplier
     * Clamp to [-100, 100]
     */
    Merchant.prototype.adjustMood = function (delta) {
        var adjusted = delta * (this.personality.traits.moodVolatility / 10);
        this.mood = Math.max(-100, Math.min(100, this.mood + adjusted));
        // Natural decay toward neutral
        if (this.mood > 0) {
            this.mood = Math.max(0, this.mood - 2);
        }
        else if (this.mood < 0) {
            this.mood = Math.min(0, this.mood + 2);
        }
    };
    /**
     * Adjust trust, clamped to [0, 100]
     */
    Merchant.prototype.adjustTrust = function (delta) {
        this.trust = Math.max(0, Math.min(100, this.trust + delta));
    };
    /**
     * Get mood modifier: maps [-100, 100] to [0.8, 1.2]
     * Affects acceptable price ranges
     */
    Merchant.prototype.getMoodModifier = function () {
        return 1.0 + (this.mood / 500);
    };
    /**
     * Get trust modifier: maps [0, 100] to [0.7, 1.3]
     * Affects concession willingness
     */
    Merchant.prototype.getTrustModifier = function () {
        return 0.7 + (this.trust / 100) * 0.6;
    };
    /**
     * Generate random merchant name
     */
    Merchant.prototype.generateName = function () {
        var prefixes = ['Zyx', 'Kron', 'Vex', 'Nyx', 'Qor', 'Jax', 'Mek', 'Rax'];
        var suffixes = ['ar', 'ix', 'or', 'el', 'ak', 'us', 'an', 'ex'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] +
            suffixes[Math.floor(Math.random() * suffixes.length)];
    };
    return Merchant;
}());
/**
 * ItemGenerator - creates random items from templates
 */
var ItemGenerator = /** @class */ (function () {
    function ItemGenerator() {
        this.templates = ITEM_TEMPLATES;
    }
    ItemGenerator.prototype.generateRandom = function () {
        var template = this.templates[Math.floor(Math.random() * this.templates.length)];
        var rarity = this.randomRarity();
        var condition = this.randomCondition();
        return new Item(template, rarity, condition);
    };
    /**
     * Weighted rarity distribution: 60% common, 30% rare, 10% epic
     */
    ItemGenerator.prototype.randomRarity = function () {
        var roll = Math.random();
        if (roll < 0.6)
            return Rarity.COMMON;
        if (roll < 0.9)
            return Rarity.RARE;
        return Rarity.EPIC;
    };
    /**
     * Condition distribution: 50% new, 30% used, 20% damaged
     */
    ItemGenerator.prototype.randomCondition = function () {
        var roll = Math.random();
        if (roll < 0.5)
            return Condition.NEW;
        if (roll < 0.8)
            return Condition.USED;
        return Condition.DAMAGED;
    };
    return ItemGenerator;
}());
// ===== PHASE 3: AI SYSTEMS =====
/**
 * BluffDetector - tracks and analyzes offer patterns
 */
var BluffDetector = /** @class */ (function () {
    function BluffDetector() {
        this.offerHistory = [];
    }
    /**
     * Analyze offer and detect bluffing patterns
     */
    BluffDetector.prototype.analyzeOffer = function (offer, fairPrice, mode) {
        this.offerHistory.push(offer);
        return {
            extremeOffers: this.countExtremeOffers(fairPrice, mode),
            oscillations: this.detectOscillations(),
            lastOfferRatio: offer / fairPrice
        };
    };
    /**
     * Count extreme offers:
     * BUY: < 40% of fair price
     * SELL: > 160% of fair price
     */
    BluffDetector.prototype.countExtremeOffers = function (fairPrice, mode) {
        var count = 0;
        for (var _i = 0, _a = this.offerHistory; _i < _a.length; _i++) {
            var offer = _a[_i];
            var ratio = offer / fairPrice;
            if (mode === 'BUY' && ratio < 0.4)
                count++;
            if (mode === 'SELL' && ratio > 1.6)
                count++;
        }
        return count;
    };
    /**
     * Detect wild oscillations (> 30% swings between consecutive offers)
     */
    BluffDetector.prototype.detectOscillations = function () {
        var count = 0;
        for (var i = 1; i < this.offerHistory.length; i++) {
            var prev = this.offerHistory[i - 1];
            var curr = this.offerHistory[i];
            var change = Math.abs(curr - prev) / prev;
            if (change > 0.3)
                count++;
        }
        return count;
    };
    /**
     * Determine if player is bluffing
     * Triggers: 2+ extreme offers OR 3+ oscillations
     */
    BluffDetector.prototype.isBluffing = function (metrics) {
        return metrics.extremeOffers > 1 || metrics.oscillations > 2;
    };
    BluffDetector.prototype.reset = function () {
        this.offerHistory = [];
    };
    return BluffDetector;
}());
// ===== PHASE 2: NEGOTIATION ENGINE =====
/**
 * NegotiationEngine - core negotiation logic
 */
var NegotiationEngine = /** @class */ (function () {
    function NegotiationEngine(merchant, item, mode, hardMode) {
        if (hardMode === void 0) { hardMode = false; }
        this.round = 1;
        this.maxRounds = 6;
        this.lastMerchantOffer = null;
        this.merchant = merchant;
        this.item = item;
        this.mode = mode;
        this.maxRounds = hardMode ? 4 : 6;
    }
    /**
     * Calculate acceptable price range based on personality, mood, trust, and round pressure
     */
    NegotiationEngine.prototype.calculateAcceptableRange = function () {
        var fairPrice = this.item.fairPrice;
        var margin = this.merchant.personality.traits.targetMargin / 100;
        var moodMod = this.merchant.getMoodModifier();
        var trustMod = this.merchant.getTrustModifier();
        var roundPressure = 1 + (this.round / this.maxRounds) * 0.3;
        if (this.mode === 'BUY') {
            // Merchant is selling - wants price above fair
            var baseMin = fairPrice * (1 + margin);
            var adjustedMin = baseMin / (moodMod * trustMod * roundPressure);
            return {
                min: adjustedMin,
                max: fairPrice * 2
            };
        }
        else {
            // Merchant is buying - wants price below fair
            var baseMax = fairPrice * (1 - margin);
            var adjustedMax = baseMax * (moodMod * trustMod * roundPressure);
            return {
                min: 0,
                max: adjustedMax
            };
        }
    };
    /**
     * Evaluate player offer and return negotiation result
     */
    NegotiationEngine.prototype.evaluateOffer = function (playerOffer) {
        var fairPrice = this.item.fairPrice;
        var _a = this.calculateAcceptableRange(), min = _a.min, max = _a.max;
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
        var ratio = this.mode === 'BUY'
            ? playerOffer / fairPrice
            : fairPrice / playerOffer;
        // Check if within acceptable range
        var inRange = this.mode === 'BUY'
            ? (playerOffer >= min && playerOffer <= max)
            : (playerOffer >= min && playerOffer <= max);
        if (inRange) {
            return this.acceptOffer(playerOffer, ratio);
        }
        // Generate counteroffer
        var counter = this.generateCounteroffer(playerOffer);
        // Calculate mood change based on offer quality
        var moodChange = 0;
        if (ratio < 0.5) {
            moodChange = -15 * (this.merchant.personality.traits.moodVolatility / 10);
        }
        else if (ratio < 0.7) {
            moodChange = -8 * (this.merchant.personality.traits.moodVolatility / 10);
        }
        else if (ratio < 0.9) {
            moodChange = -3;
        }
        else if (ratio > 1.2) {
            moodChange = 10;
        }
        return {
            action: 'COUNTER',
            counterOffer: counter,
            message: '',
            moodChange: moodChange,
            trustChange: 0,
            reasoning: "Offer ".concat(ratio.toFixed(2), "x fair, counter at ").concat(counter)
        };
    };
    /**
     * Generate counteroffer with concessions toward fair price
     */
    NegotiationEngine.prototype.generateCounteroffer = function (playerOffer) {
        var _a;
        var fairPrice = this.item.fairPrice;
        var concessionRate = this.merchant.personality.traits.concessionRate;
        var trustMod = this.merchant.getTrustModifier();
        // Starting anchor (first offer)
        var anchor = (_a = this.lastMerchantOffer) !== null && _a !== void 0 ? _a : (this.mode === 'BUY'
            ? fairPrice * 1.4 // Start high when selling
            : fairPrice * 0.6 // Start low when buying
        );
        // Move toward player offer with concessions
        var direction = playerOffer > anchor ? 1 : -1;
        var gap = Math.abs(playerOffer - anchor);
        var concession = gap * concessionRate * trustMod;
        var counter = anchor + (direction * concession);
        this.lastMerchantOffer = Math.round(counter);
        return Math.round(counter);
    };
    /**
     * Accept offer and calculate mood/trust changes
     */
    NegotiationEngine.prototype.acceptOffer = function (playerOffer, ratio) {
        var moodChange = 20; // Base happiness from closing deal
        var trustChange = 0;
        // Bonus trust if fair deal
        if (ratio >= 0.9 && ratio <= 1.1) {
            trustChange = 5;
        }
        return {
            action: 'ACCEPT',
            message: '',
            moodChange: moodChange,
            trustChange: trustChange,
            reasoning: "Accepted offer of ".concat(playerOffer)
        };
    };
    /**
     * Check if merchant should walk away
     */
    NegotiationEngine.prototype.shouldWalkAway = function () {
        return this.merchant.mood < -60 || this.round > this.merchant.personality.traits.patience;
    };
    return NegotiationEngine;
}());
/**
 * NegotiationSession - manages current negotiation state
 */
var NegotiationSession = /** @class */ (function () {
    function NegotiationSession(engine) {
        this.history = [];
        this.engine = engine;
        this.bluffDetector = new BluffDetector();
    }
    /**
     * Process player offer through full pipeline
     */
    NegotiationSession.prototype.processPlayerOffer = function (offer) {
        // 1. Detect bluffs
        var bluffMetrics = this.bluffDetector.analyzeOffer(offer, this.engine.item.fairPrice, this.engine.mode);
        // 2. Adjust trust if bluffing
        if (this.bluffDetector.isBluffing(bluffMetrics)) {
            this.engine.merchant.adjustTrust(-10 * this.engine.merchant.personality.traits.bluffSensitivity);
        }
        // 3. Evaluate offer
        var result = this.engine.evaluateOffer(offer);
        // 4. Apply mood/trust changes
        this.engine.merchant.adjustMood(result.moodChange);
        this.engine.merchant.adjustTrust(result.trustChange);
        // 5. Record history
        this.history.push({ round: this.engine.round, playerOffer: offer, result: result });
        // 6. Increment round
        this.engine.round++;
        return result;
    };
    NegotiationSession.prototype.isComplete = function () {
        if (this.history.length === 0)
            return false;
        var lastResult = this.history[this.history.length - 1].result;
        return this.engine.round > this.engine.maxRounds || lastResult.action !== 'COUNTER';
    };
    NegotiationSession.prototype.isBluffing = function () {
        var _a;
        var lastOffer = (_a = this.history[this.history.length - 1]) === null || _a === void 0 ? void 0 : _a.playerOffer;
        if (!lastOffer)
            return false;
        var metrics = this.bluffDetector.analyzeOffer(lastOffer, this.engine.item.fairPrice, this.engine.mode);
        return this.bluffDetector.isBluffing(metrics);
    };
    return NegotiationSession;
}());
// ===== PHASE 4: MESSAGE GENERATION =====
/**
 * MessageGenerator - creates contextual merchant responses
 */
var MessageGenerator = /** @class */ (function () {
    function MessageGenerator() {
        this.templates = {
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
    }
    MessageGenerator.prototype.generate = function (context) {
        var pool = [];
        // Priority 1: Bluff detection
        if (context.isBluff && Math.random() > 0.5) {
            pool = this.templates.bluff_detected;
        }
        // Priority 2: Action type
        else if (context.action === 'ACCEPT') {
            if (context.mood > 30)
                pool = this.templates.accept_positive;
            else if (context.mood < -30)
                pool = this.templates.accept_reluctant;
            else
                pool = this.templates.accept_neutral;
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
            }
            else if (context.mood < -40) {
                pool = this.templates.reject_annoyed;
            }
            else {
                pool = this.templates.reject_polite;
            }
        }
        // Select random template from pool
        if (pool.length === 0)
            pool = this.templates.accept_neutral;
        var template = pool[Math.floor(Math.random() * pool.length)];
        // Replace placeholders
        return template
            .replace('{price}', (context.counterOffer || context.offer).toString())
            .replace('{offer}', context.offer.toString())
            .replace('{counter}', (context.counterOffer || '').toString())
            .replace('{item}', context.itemName);
    };
    return MessageGenerator;
}());
// ===== PHASE 6: UI CONTROLLER =====
/**
 * UIController - manages DOM updates and user interactions
 */
var UIController = /** @class */ (function () {
    function UIController(game) {
        this.game = game;
        this.setupEventListeners();
    }
    UIController.prototype.setupEventListeners = function () {
        var _this = this;
        // Mode buttons
        document.getElementById('btn-buy').addEventListener('click', function () {
            _this.game.startNegotiation('BUY');
        });
        document.getElementById('btn-sell').addEventListener('click', function () {
            _this.game.startNegotiation('SELL');
        });
        // Submit offer
        document.getElementById('btn-submit-offer').addEventListener('click', function () {
            var input = document.getElementById('player-offer');
            var offer = parseInt(input.value);
            if (!isNaN(offer) && offer > 0) {
                _this.game.submitOffer(offer);
                input.value = '';
            }
        });
        // Enter key to submit
        document.getElementById('player-offer').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                document.getElementById('btn-submit-offer').click();
            }
        });
        // Reset button
        document.getElementById('btn-reset').addEventListener('click', function () {
            if (confirm('Reset the game? All progress will be lost.')) {
                _this.game.reset();
            }
        });
        // Tutorial toggle
        document.getElementById('toggle-tutorial-btn').addEventListener('click', function () {
            var content = document.getElementById('tutorial-content');
            content.classList.toggle('hidden');
        });
        // Modal close
        document.getElementById('btn-close-modal').addEventListener('click', function () {
            document.getElementById('deal-modal').classList.add('hidden');
        });
    };
    UIController.prototype.displayItem = function (item) {
        document.getElementById('item-name').textContent = item.name;
        document.getElementById('item-description').textContent = item.description;
        var rarityBadge = document.getElementById('item-rarity');
        rarityBadge.textContent = item.rarity.toUpperCase();
        rarityBadge.className = "badge rarity-".concat(item.rarity);
        var conditionBadge = document.getElementById('item-condition');
        conditionBadge.textContent = item.condition.toUpperCase();
        conditionBadge.className = "badge condition-".concat(item.condition);
        document.getElementById('item-hint').textContent = "~".concat(item.marketHint, " coins");
        document.getElementById('item-panel').classList.remove('hidden');
    };
    UIController.prototype.showNegotiationPanel = function (mode, currentRound, maxRounds) {
        document.getElementById('mode-indicator').textContent = "MODE: ".concat(mode === 'BUY' ? 'BUYING' : 'SELLING');
        document.getElementById('current-round').textContent = currentRound.toString();
        document.getElementById('max-rounds').textContent = maxRounds.toString();
        // Clear log
        document.getElementById('negotiation-log').innerHTML = '';
        document.getElementById('negotiation-panel').classList.remove('hidden');
        // Disable mode buttons
        document.getElementById('btn-buy').disabled = true;
        document.getElementById('btn-sell').disabled = true;
    };
    UIController.prototype.hideNegotiationPanel = function () {
        document.getElementById('negotiation-panel').classList.add('hidden');
        document.getElementById('item-panel').classList.add('hidden');
        // Enable mode buttons
        document.getElementById('btn-buy').disabled = false;
        document.getElementById('btn-sell').disabled = false;
    };
    UIController.prototype.addNegotiationLog = function (speaker, message) {
        var log = document.getElementById('negotiation-log');
        var entry = document.createElement('div');
        entry.className = "log-entry ".concat(speaker);
        var speakerLabel = document.createElement('div');
        speakerLabel.className = 'speaker';
        speakerLabel.textContent = speaker === 'player' ? 'You' : 'Merchant';
        var messageText = document.createElement('div');
        messageText.textContent = message;
        entry.appendChild(speakerLabel);
        entry.appendChild(messageText);
        log.appendChild(entry);
        // Scroll to bottom
        log.scrollTop = log.scrollHeight;
    };
    UIController.prototype.updateMoodIndicator = function (mood) {
        // Map [-100, 100] to [0%, 100%]
        var percent = ((mood + 100) / 200) * 100;
        document.getElementById('mood-fill').style.width = "".concat(percent, "%");
        // Update emoji
        var emoji = '😐';
        if (mood > 50)
            emoji = '😊';
        else if (mood > 20)
            emoji = '🙂';
        else if (mood < -50)
            emoji = '😠';
        else if (mood < -20)
            emoji = '😒';
        document.getElementById('mood-emoji').textContent = emoji;
    };
    UIController.prototype.updateTrustIndicator = function (trust) {
        document.getElementById('trust-fill').style.width = "".concat(trust, "%");
        document.getElementById('trust-value').textContent = Math.round(trust).toString();
    };
    UIController.prototype.updatePlayerStats = function (balance, profit) {
        document.getElementById('balance').textContent = balance.toString();
        document.getElementById('profit').textContent = profit.toString();
    };
    UIController.prototype.updateMerchantInfo = function (merchant) {
        document.getElementById('merchant-name').textContent = merchant.name;
        document.getElementById('merchant-personality').textContent = "Type: ".concat(merchant.personality.traits.name);
        this.updateMoodIndicator(merchant.mood);
        this.updateTrustIndicator(merchant.trust);
    };
    UIController.prototype.updateRoundIndicator = function (currentRound, maxRounds) {
        document.getElementById('current-round').textContent = currentRound.toString();
        document.getElementById('max-rounds').textContent = maxRounds.toString();
    };
    UIController.prototype.showDealSummary = function (finalPrice, fairValue, profit, success) {
        document.getElementById('deal-result').textContent = success ? '✅ Deal Closed!' : '❌ No Deal';
        document.getElementById('final-price').textContent = finalPrice.toString();
        document.getElementById('fair-value').textContent = fairValue.toString();
        var profitEl = document.getElementById('deal-profit');
        profitEl.textContent = (profit >= 0 ? '+' : '') + profit.toString();
        profitEl.className = profit >= 0 ? 'profit-positive' : 'profit-negative';
        document.getElementById('deal-modal').classList.remove('hidden');
    };
    UIController.prototype.showError = function (message) {
        alert(message);
    };
    UIController.prototype.reset = function () {
        this.hideNegotiationPanel();
        document.getElementById('negotiation-log').innerHTML = '';
    };
    return UIController;
}());
// ===== PHASE 5: GAME LOOP & STATE =====
/**
 * Game - main orchestrator
 */
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.currentItem = null;
        this.currentSession = null;
        this.mode = 'BUY';
        this.hardMode = false;
        this.player = { balance: 1000, profit: 0 };
        this.merchant = new Merchant();
        this.itemGenerator = new ItemGenerator();
        this.messageGenerator = new MessageGenerator();
        this.ui = new UIController(this);
        // Update initial UI
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateMerchantInfo(this.merchant);
        // Hard mode toggle
        document.getElementById('hard-mode').addEventListener('change', function (e) {
            _this.hardMode = e.target.checked;
        });
    }
    Game.prototype.startNegotiation = function (mode) {
        this.mode = mode;
        this.currentItem = this.itemGenerator.generateRandom();
        // Check if player can afford (BUY mode)
        if (mode === 'BUY' && this.currentItem.marketHint > this.player.balance) {
            this.ui.showError("You don't have enough coins for this item! Try selling some items first.");
            return;
        }
        var engine = new NegotiationEngine(this.merchant, this.currentItem, mode, this.hardMode);
        this.currentSession = new NegotiationSession(engine);
        this.ui.displayItem(this.currentItem);
        this.ui.showNegotiationPanel(mode, 1, engine.maxRounds);
        // Add initial merchant greeting
        var greetings = [
            "Welcome! Let's talk business.",
            "Good to see you. What's your offer?",
            "I'm listening. Make your pitch.",
            "Alright, let's negotiate."
        ];
        this.ui.addNegotiationLog('merchant', greetings[Math.floor(Math.random() * greetings.length)]);
    };
    Game.prototype.submitOffer = function (offer) {
        if (!this.currentSession || !this.currentItem)
            return;
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
        this.ui.addNegotiationLog('player', "I offer ".concat(offer, " coins."));
        // Process offer
        var result = this.currentSession.processPlayerOffer(offer);
        // Generate message
        var message = this.messageGenerator.generate({
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
        this.ui.updateRoundIndicator(this.currentSession.engine.round, this.currentSession.engine.maxRounds);
        // Handle result
        if (result.action === 'ACCEPT') {
            this.completeDeal(offer);
        }
        else if (result.action === 'REJECT' || this.currentSession.isComplete()) {
            this.endNegotiation(false);
        }
    };
    Game.prototype.completeDeal = function (finalPrice) {
        if (!this.currentItem)
            return;
        // Calculate profit
        var profit = this.mode === 'BUY'
            ? (this.currentItem.fairPrice - finalPrice)
            : (finalPrice - this.currentItem.fairPrice);
        // Update balance
        this.player.balance += (this.mode === 'BUY' ? -finalPrice : finalPrice);
        this.player.profit += profit;
        // Mood bonus for successful deal
        this.merchant.adjustMood(20);
        // Trust bonus if no bluffing
        if (!this.currentSession.isBluffing()) {
            this.merchant.adjustTrust(5);
        }
        // Update UI
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateMoodIndicator(this.merchant.mood);
        this.ui.updateTrustIndicator(this.merchant.trust);
        // Show summary
        this.ui.showDealSummary(finalPrice, this.currentItem.fairPrice, profit, true);
        this.endNegotiation(true);
    };
    Game.prototype.endNegotiation = function (success) {
        var _this = this;
        if (!success && this.currentItem) {
            // Small mood penalty for failed negotiation
            this.merchant.adjustMood(-5);
            this.ui.updateMoodIndicator(this.merchant.mood);
            // Show summary with 0 profit
            setTimeout(function () {
                _this.ui.showDealSummary(0, _this.currentItem.fairPrice, 0, false);
            }, 500);
        }
        this.currentSession = null;
        this.currentItem = null;
        setTimeout(function () {
            _this.ui.hideNegotiationPanel();
        }, success ? 0 : 1000);
    };
    Game.prototype.reset = function () {
        this.player = { balance: 1000, profit: 0 };
        this.merchant = new Merchant();
        this.currentItem = null;
        this.currentSession = null;
        this.hardMode = document.getElementById('hard-mode').checked;
        this.ui.updatePlayerStats(this.player.balance, this.player.profit);
        this.ui.updateMerchantInfo(this.merchant);
        this.ui.reset();
    };
    return Game;
}());
// ===== INITIALIZE GAME =====
var game;
window.addEventListener('DOMContentLoaded', function () {
    game = new Game();
    console.log('🎮 Stellar Bargains initialized!');
    console.log('💡 Tip: Check the tutorial for game mechanics');
});
