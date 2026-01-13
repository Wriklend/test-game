# ⭐ Stellar Bargains: AI Merchant Negotiation Game

An immersive single-player trading game where you negotiate with an AI merchant that has personality, mood, and trust systems. Buy low, sell high, and build relationships to maximize your profit!

## 🎮 Features

- **Dynamic AI Merchant** with 3 distinct personalities (Greedy, Honest, Impulsive)
- **Mood System** (-100 to +100) that affects negotiation behavior
- **Trust System** (0-100) that responds to bluffing and fair dealing
- **Bluff Detection** - extreme or erratic offers damage trust
- **30+ Sci-Fi Items** across 4 categories (Weapons, Tech, Artifacts, Consumables)
- **Rarity & Condition** modifiers affecting prices
- **Market Hints** with intentional inaccuracy for strategic depth
- **Hard Mode** - 4 rounds instead of 6 for increased difficulty
- **No external dependencies** - pure TypeScript/JavaScript game

## 📦 Installation & Compilation

### Prerequisites

Install TypeScript compiler if you haven't already:

```bash
npm install -g typescript
```

### Compilation Steps

1. **Navigate to the project directory:**
   ```bash
   cd /Users/alexmushegov/Documents/projects/Torgash
   ```

2. **Compile TypeScript to JavaScript:**
   ```bash
   tsc game.ts
   ```

   This will generate `game.js` in the same directory.

3. **Open the game:**
   Simply open `index.html` in any modern web browser:
   ```bash
   open index.html
   ```

   Or manually open the file in Chrome, Firefox, Safari, or Edge.

## 🎯 How to Play

### Objective
Maximize profit by buying items below their fair value and selling items above their fair value. Manage the merchant's mood and build trust for better deals!

### Game Flow

1. **Choose Mode:**
   - Click "BUY from Merchant" to purchase an item
   - Click "SELL to Merchant" to sell an item

2. **Negotiate:**
   - Each negotiation has up to 6 rounds (4 in Hard Mode)
   - Enter your offer in coins
   - The merchant will ACCEPT, COUNTER, or REJECT your offer

3. **Close the Deal:**
   - Successfully negotiate to complete the trade
   - Your profit is the difference between the fair price and final price

4. **Repeat:**
   - Continue trading to build your balance and profit score

### AI Systems Explained

#### Mood System
- **Range:** -100 (furious) to +100 (delighted)
- **Effects:**
  - Higher mood = more generous counteroffers and warmer messages
  - Lower mood = fewer concessions and may walk away early
- **Influenced by:** Offer quality, successful deals, negotiation progress

#### Trust System
- **Range:** 0 (no trust) to 100 (complete trust)
- **Effects:**
  - High trust = larger concessions and better terms
  - Low trust = merchant becomes suspicious and aggressive
- **Damaged by:** Bluffing (extreme offers, wild price swings)
- **Improved by:** Fair dealing, reasonable offers, successful trades

#### Personality Types

**Greedy Merchant**
- Target margin: 40% profit
- Patience: 6 rounds
- Behavior: High asking prices, slow concessions (3% per round)
- Best strategy: Be patient, gradually improve offers

**Honest Merchant**
- Target margin: 15% profit
- Patience: 5 rounds
- Behavior: Fair prices, accepts reasonable offers quickly (7% concessions)
- Best strategy: Offer close to estimated value, build trust

**Impulsive Merchant**
- Target margin: 25% profit
- Patience: 3 rounds (gets impatient!)
- Behavior: Quick large concessions (12%), emotional responses
- Best strategy: Act fast, be bold but not too aggressive

### Strategy Tips

1. **Use the Market Estimate** - It's not perfect, but it's a good starting point (±15-30% noise)
2. **Avoid Lowballing** - Offers below 40% of fair value (or above 160% when selling) damage trust
3. **Be Consistent** - Wild price swings (>30% between offers) trigger bluff detection
4. **Watch the Mood** - Adjust your strategy based on the merchant's emotional state
5. **Build Trust** - Fair dealing in one negotiation improves terms in future deals
6. **Round Pressure** - Merchant becomes more flexible in later rounds

## 🎨 Game Interface

### UI Elements

- **Balance Display** - Your available coins
- **Profit Tracker** - Total profit across all deals
- **Merchant Panel** - Shows personality, mood meter, and trust meter
- **Item Card** - Displays item details, rarity, condition, and market estimate
- **Negotiation Log** - Chat-style history of offers and responses
- **Round Counter** - Tracks negotiation progress
- **Deal Summary** - Shows final price, fair value, and your profit

### Visual Indicators

- **Mood Emoji:** 😊 (happy) → 🙂 → 😐 (neutral) → 😒 → 😠 (angry)
- **Mood Bar:** Color gradient from red (bad) to green (good)
- **Trust Bar:** Cyan progress bar showing trust percentage
- **Rarity Badges:** Common (gray), Rare (blue), Epic (purple)
- **Condition Badges:** New (green), Used (orange), Damaged (red)

## 🔧 Game Mechanics

### Price Calculation

```
Fair Price = Base Price × Rarity Multiplier × Condition Multiplier

Rarity Multipliers:
- Common: 1.0x
- Rare: 2.5x
- Epic: 5.0x

Condition Multipliers:
- New: 1.0x
- Used: 0.7x
- Damaged: 0.4x
```

### Acceptable Range Formula

The merchant calculates an acceptable price range based on:
- **Target Margin:** Personality-based profit goal (15-40%)
- **Mood Modifier:** ±20% adjustment based on mood
- **Trust Modifier:** ±15% adjustment based on trust
- **Round Pressure:** +30% flexibility as rounds progress

### Bluff Detection Algorithm

**Triggers:**
- 2+ extreme offers (< 40% fair price when buying, > 160% when selling)
- 3+ oscillations (> 30% swings between consecutive offers)

**Consequence:**
```
Trust Loss = 10 × Personality's Bluff Sensitivity
```

## 📊 Items Database

The game includes 32 unique items:

### Weapons (8)
- Plasma Rifle, Neural Disruptor, Mono-Blade, Gravity Hammer, Arc Pistol, Photon Lance, Sonic Stunner, Nano-Swarm Grenade

### Tech (10)
- Quantum Processor, Holo-Projector, Neural Interface, Fusion Cell, Stealth Field Generator, Gravity Boots, Translator Implant, Repair Nanites, Data Spike, Bio-Scanner

### Artifacts (7)
- Precursor Orb, Psionic Crystal, Time Shard, Void Stone, Star Chart, Memory Crystal, Harmonic Resonator

### Consumables (7)
- Stim Pack, Ration Bar, Anti-Radiation Serum, Oxygen Canister, Boost Injectable, Mind Shield Pill, Cryo Capsule

## 🚀 Development

### Project Structure

```
Torgash/
├── index.html       # Game HTML structure and CSS
├── game.ts          # TypeScript source code (edit this)
├── game.js          # Compiled JavaScript (generated by tsc)
└── README.md        # This file
```

### Making Changes

1. Edit `game.ts` with your changes
2. Recompile: `tsc game.ts`
3. Refresh `index.html` in your browser

### Architecture Overview

```
Game (main orchestrator)
├── ItemGenerator → generates Item objects
├── Merchant (personality, mood, trust)
│   └── PersonalityProfile (traits)
├── NegotiationSession (manages current deal)
│   ├── NegotiationEngine (evaluation logic)
│   └── BluffDetector (tracks suspicious offers)
├── MessageGenerator (contextual merchant responses)
└── UIController (DOM updates, event handling)
```

## 🎲 Game Balance

- **Starting Balance:** 1000 coins (allows 7-20 deals depending on item prices)
- **Negotiation Rounds:** 6 normal, 4 hard mode
- **Item Distribution:** 60% common, 30% rare, 10% epic
- **Condition Distribution:** 50% new, 30% used, 20% damaged
- **Market Hint Noise:** ±15-30% of fair price

## 🐛 Troubleshooting

**Game won't load:**
- Ensure `game.js` exists (compile `game.ts` with `tsc`)
- Check browser console for errors (F12)
- Try opening in a different browser

**TypeScript compilation errors:**
- Update TypeScript: `npm install -g typescript@latest`
- Check for syntax errors in `game.ts`
- Ensure `--target ES2015` and `--lib ES2015,DOM` are compatible with your tsc version

**Negotiation seems unfair:**
- Remember the market hint has intentional noise (±15-30%)
- Each personality has different acceptable ranges
- Mood and trust significantly affect terms
- Try the tutorial for strategy tips

## 📝 Credits

**Game Design & Implementation:** AI Merchant Negotiation Game
**Engine:** Pure TypeScript/JavaScript (no frameworks)
**Theme:** Sci-Fi Marketplace
**AI Model:** Multi-factor negotiation system with personality, mood, and trust

## 🎉 Enjoy!

Good luck in your negotiations, trader! May your profits be high and your trust remain strong.

---

**Pro Tip:** Try different strategies with each personality type. What works with an Honest merchant won't work with an Impulsive one!
