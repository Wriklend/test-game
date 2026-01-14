# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stellar Bargains** - A sci-fi trading game where all merchant behavior is powered by Claude AI. The AI generates unique merchant personalities and makes real-time negotiation decisions (accept/counter/reject) based on mood, trust, offer history, and game context.

**Features:**
- **Free-form text negotiation**: Players write messages to merchants (not just prices)
- **Score system**: Tracks player progression based on profit, deals, and efficiency
- **Save/Load**: Persistent game state with auto-save after each deal
- **Local Leaderboard**: Top 10 high scores stored in localStorage

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Type check without building
npm run type-check

# Build for production (runs type-check first, outputs single HTML file via vite-plugin-singlefile)
npm run build

# Preview production build
npm run preview
```

## Architecture

### AI-First Design

This game has a unique architecture where **Claude AI makes all negotiation decisions**. There is no deterministic rule engine - the AI evaluates each offer contextually and decides whether to accept, counter, or reject based on the full negotiation state.

**Three main AI operations:**
1. **Merchant Personality Generation** ([src/integrations/claude.ts:103-140](src/integrations/claude.ts#L103-L140)): Creates unique merchants with backstory, quirks, catchphrases, and negotiation parameters
2. **Player Character Generation** ([src/integrations/claude.ts:145-181](src/integrations/claude.ts#L145-L181)): Creates unique player characters with species, profession, backstory, and trading style
3. **Negotiation Processing** ([src/integrations/claude.ts:187-278](src/integrations/claude.ts#L187-L278)): AI evaluates player offers and decides action + mood/trust changes

### Claude API Security Architecture

**Development mode** (current setup):
- API key stored in `.env` file (never committed)
- Vite plugin middleware intercepts `/api/claude` requests ([vite.config.ts:35-85](vite.config.ts#L35-L85))
- Middleware adds API key server-side and forwards to Anthropic API via fetch
- Browser never sees the API key

**Production deployment**: The Vite proxy only works in dev mode. For production, you must create a proper backend server (Express, serverless function, etc.) to proxy API requests. See [README.md:196-248](README.md#L196-L248) for deployment options.

### Module Structure

```
src/
├── main.ts                 # Entry point, HMR support, exposes window.__game in dev
├── game/
│   └── Game.ts            # Orchestrates negotiation flow, state management, stats tracking
├── integrations/
│   └── claude.ts          # Claude API client (model: claude-sonnet-4-20250514)
├── models/
│   ├── Merchant.ts        # Tracks mood, trust, personality
│   ├── Player.ts          # Player balance, profit, AI-generated character
│   ├── Item.ts            # Price calculation (fair vs market hint)
│   ├── PersonalityProfile.ts  # Container for AI-generated personality
│   └── ItemGenerator.ts   # Random item generation from templates
├── ui/
│   └── UIController.ts    # All DOM manipulation and event handling
├── utils/
│   ├── SaveManager.ts     # Game save/load and score calculation
│   └── Leaderboard.ts     # Local high scores management
├── data/
│   ├── itemTemplates.ts   # 32 sci-fi items (weapons, tech, artifacts, consumables)
│   └── wearableTemplates.ts  # 12 wearable items for equipment shop
├── styles/
│   └── main.css           # All CSS styling with CSS variables
└── types/
    ├── enums.ts           # Rarity, Condition, ItemCategory, WearableSlot
    ├── types.ts           # NegotiationMode, NegotiationAction
    ├── interfaces.ts      # All interfaces (NegotiationContext, ClaudeNegotiationResponse, ItemTemplate with wearable fields, etc.)
    └── index.ts           # Barrel export
```

### Path Aliases

Configured in both [tsconfig.json:28-37](tsconfig.json#L28-L37) and [vite.config.ts:19-29](vite.config.ts#L19-L29):

```typescript
import { Game } from '@game/Game';
import { Item } from '@models/Item';
import { claudeIntegration } from '@integrations/claude';
import { NegotiationContext } from '@types/interfaces';
import { SaveManager } from '../utils/SaveManager'; // No @utils alias - use relative imports
```

**Note**: The `@ai` alias still exists in configs but the `src/ai/` folder was removed (AI logic is now handled by Claude API). The `@utils` directory doesn't have an alias - use relative imports for SaveManager and Leaderboard.

### Key Architectural Patterns

**1. Separation of Concerns:**
- `Game.ts` - State management, game logic, orchestration
- `UIController.ts` - Pure DOM manipulation, no business logic
- `claude.ts` - AI integration abstraction layer
- Models - Data structures with methods (Merchant, Item)

**2. Negotiation Flow:**
1. Player makes offer in UI
2. `Game.startNegotiation()` builds `NegotiationContext` ([src/types/interfaces.ts](src/types/interfaces.ts))
3. `claudeIntegration.processNegotiation()` sends context to AI
4. AI returns `ClaudeNegotiationResponse` (action, counterOffer, message, mood/trust changes)
5. `Game` applies changes to merchant state
6. `UIController` updates DOM with AI response

**3. Merchant Personality System:**
- AI generates unique personality at game start/reset
- Personality affects AI decision-making (target margin, patience, bluff sensitivity)
- Merchant state (mood, trust) evolves through negotiations
- Mood: -100 (furious) to +100 (delighted) - HEAVILY affects acceptance threshold and decision-making
  - AI analyzes tone deeply: compliments (+30 to +50), insults (-40 to -60), threats (-50 to -70)
  - Good mood (60+) = accept offers within 15-25% of fair price
  - Bad mood (below 20) = accept only near-perfect offers within 5-10%
  - Mood can override price considerations - kind treatment beats better prices
- Trust: 0 (suspicious) to 100 (trusting) - affects bluff tolerance and willingness to believe player
- **Tone matters more than price**: A polite player with a borderline offer can succeed over a rude player with a better offer

**4. Price Mechanics:**
- Each item has a `fairPrice` (actual market value, hidden from player)
- Players see `marketHint` (fair price ± 15-30% noise)
- AI knows the fair price and evaluates offers against it
- Profit calculation: actual deal price vs fair price

**5. Inventory System:**
- Player starts with 2-3 random items generated at game start
- Items can be purchased (added to inventory) or sold (removed from inventory)
- Selling requires selecting an item from inventory first
- New merchant is generated after each completed deal

**5a. Equipment Shop & Wearables System:**
- Separate shop (🏪 Visit Shop button) sells wearable items (hats, clothes, accessories)
- Wearables have fixed prices (no negotiation) and provide mood bonuses
- 12 unique wearable items across 3 slots: Head, Body, Accessory ([src/data/wearableTemplates.ts](src/data/wearableTemplates.ts))
- Equipment bonuses range from +10 to +20 initial mood boost with merchants
- Players can equip one item per slot (head/body/accessory) from inventory
- Equipped items apply their mood bonus at the START of each negotiation (first impression)
- Wearables can also be sold to merchants like regular items
- Equipment UI shows "EQUIPPED" badge and mood bonus on items
- Total equipped bonus visible when negotiation starts (logged to console)

**6. Score System:**
- Formula: `profit + (successful_deals × 50) + efficiency_bonus - (failed × 25)`
- Efficiency bonus: awarded when average profit per deal > 100
- Score calculation in [src/utils/SaveManager.ts:51-65](src/utils/SaveManager.ts#L51-L65) (`calculateScore()` method)
- Displayed in header alongside balance and profit

**7. Save/Load System:**
- Auto-save after each successful deal
- Saves player state, merchant state, stats, and settings
- Stored in localStorage with key `stellar-bargains-save`
- Load prompt on startup if save exists
- Manual save/load buttons in game controls

**8. Leaderboard:**
- Top 10 high scores stored locally
- Entries include: player name, score, profit, deals, timestamp
- Persistent across sessions (localStorage)
- Submit score button in leaderboard modal
- Highlights new entry if it makes the board

**9. TypeScript Strictness:**
- All strict flags enabled ([tsconfig.json:7-18](tsconfig.json#L7-L18))
- No implicit `any`
- Full type safety enforced
- Declaration maps generated for debugging

## Environment Setup

**Required:** Create `.env` file with Claude API key:
```bash
cp .env.example .env
# Edit .env and add your API key
```

```env
CLAUDE_API_KEY=sk-ant-your-api-key-here
```

Get API key from: https://console.anthropic.com/

The `.env` file is in `.gitignore` and must never be committed.

## Important Implementation Notes

**When modifying negotiation logic:**
- Never bypass Claude AI - all decisions must go through `claudeIntegration.processNegotiation()`
- Build complete `NegotiationContext` with all state (mood, trust, history, round pressure)
- AI prompt engineering is in [src/integrations/claude.ts:195-310](src/integrations/claude.ts#L195-L310) (the main negotiation prompt)
- **Mood system is emotion-driven**: AI deeply analyzes tone (compliments, insults, humor, threats) and reacts with large mood swings (-70 to +50)
- **Mood heavily influences decisions**: Good mood = generous acceptance (20-25% tolerance), bad mood = strict requirements (5% tolerance)

**When adding new features:**
- Maintain separation: Game (logic) vs UIController (DOM)
- Use path aliases for imports
- Follow strict TypeScript (no `any`)
- AI responses are JSON parsed from Claude - handle parsing errors

**Testing changes:**
- Run `npm run type-check` before committing
- Test with `npm run dev` (HMR enabled, localStorage state persistence)
- Each negotiation costs ~$0.01-0.02 in API calls
- Personality generation takes 2-3 seconds - loading overlay manages UX during AI calls

## Item Database

The game includes **32 unique sci-fi items** across 4 categories in [src/data/itemTemplates.ts](src/data/itemTemplates.ts):
- **Weapons** (8): Plasma Rifle, Neural Disruptor, Mono-Blade, Gravity Hammer, etc.
- **Tech** (10): Quantum Processor, Holo-Projector, Neural Interface, Fusion Cell, etc.
- **Artifacts** (7): Precursor Orb, Psionic Crystal, Time Shard, Void Stone, etc.
- **Consumables** (7): Stim Pack, Ration Bar, Anti-Radiation Serum, Oxygen Canister, etc.

Each item has rarity (Common/Uncommon/Rare/Epic), condition (Poor/Fair/Good/Excellent/Pristine), and generated fair prices.

## Common Gotchas

1. **HMR State Persistence**: Player balance/profit persists across hot reloads via localStorage ([src/main.ts](src/main.ts))
2. **API Proxy Dev-Only**: The Vite proxy in [vite.config.ts](vite.config.ts) only works with `npm run dev`. Production needs a real backend.
3. **Strict Mode**: TypeScript will catch null/undefined issues - all properties must be properly typed
4. **AI Response Parsing**: Claude sometimes wraps JSON in markdown code blocks - responses are cleaned before parsing (see `cleanJson` pattern in [src/integrations/claude.ts:131](src/integrations/claude.ts#L131) and [line 268](src/integrations/claude.ts#L268))
5. **Dev Debugging**: Game instance exposed as `window.__game` in dev mode for console debugging ([src/main.ts:60-68](src/main.ts#L60-L68))
6. **Single-File Build**: Production build uses `vite-plugin-singlefile` to inline all assets into one HTML file - useful for distribution but the API proxy won't work without a backend
7. **New Merchant After Deals**: A fresh merchant with unique personality is generated after each completed deal - this is intentional to provide variety
8. **Save Data**: Game saves include full merchant personality (extended ClaudePersonality object) - make sure this is preserved when loading
9. **Free-form Messages**: AI extracts prices from player messages - no strict format required, just natural text
10. **Score Updates**: Score is recalculated after every deal (success or failure) using SaveManager.calculateScore()
