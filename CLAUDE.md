# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stellar Bargains** - A sci-fi trading game where all merchant behavior is powered by Claude AI. The AI generates unique merchant personalities and makes real-time negotiation decisions (accept/counter/reject) based on mood, trust, offer history, and game context.

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
3. **Negotiation Processing** ([src/integrations/claude.ts:186-254](src/integrations/claude.ts#L186-L254)): AI evaluates player offers and decides action + mood/trust changes

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
│   └── Game.ts            # Orchestrates negotiation flow, state management
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
├── data/
│   └── itemTemplates.ts   # 32 sci-fi items (weapons, tech, artifacts, consumables)
├── styles/
│   └── main.css           # All CSS styling with CSS variables
└── types/
    ├── enums.ts           # Rarity, Condition, ItemCategory
    ├── types.ts           # NegotiationMode, NegotiationAction
    ├── interfaces.ts      # All interfaces (NegotiationContext, ClaudeNegotiationResponse, etc.)
    └── index.ts           # Barrel export
```

### Path Aliases

Configured in both [tsconfig.json:28-37](tsconfig.json#L28-L37) and [vite.config.ts:19-29](vite.config.ts#L19-L29):

```typescript
import { Game } from '@game/Game';
import { Item } from '@models/Item';
import { claudeIntegration } from '@integrations/claude';
import { NegotiationContext } from '@types/interfaces';
```

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
- Mood: -100 (angry) to +100 (happy) - affects acceptance threshold
- Trust: 0 (suspicious) to 100 (trusting) - affects bluff tolerance

**4. Price Mechanics:**
- Each item has a `fairPrice` (actual market value, hidden from player)
- Players see `marketHint` (fair price ± 15-30% noise)
- AI knows the fair price and evaluates offers against it
- Profit calculation: actual deal price vs fair price

**5. TypeScript Strictness:**
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
- AI prompt engineering is in [src/integrations/claude.ts:194-235](src/integrations/claude.ts#L194-L235)

**When adding new features:**
- Maintain separation: Game (logic) vs UIController (DOM)
- Use path aliases for imports
- Follow strict TypeScript (no `any`)
- AI responses are JSON parsed from Claude - handle parsing errors

**Testing changes:**
- Run `npm run type-check` before committing
- Test with `npm run dev` (HMR enabled, localStorage state persistence)
- Each negotiation costs ~$0.01-0.02 in API calls

## Common Gotchas

1. **HMR State Persistence**: Player balance/profit persists across hot reloads via localStorage ([src/main.ts](src/main.ts))
2. **API Proxy Dev-Only**: The Vite proxy in [vite.config.ts](vite.config.ts) only works with `npm run dev`. Production needs a real backend.
3. **Strict Mode**: TypeScript will catch null/undefined issues - all properties must be properly typed
4. **AI Response Parsing**: Claude sometimes wraps JSON in markdown code blocks - responses are cleaned before parsing ([src/integrations/claude.ts:131](src/integrations/claude.ts#L131), [line 244](src/integrations/claude.ts#L244))
5. **Dev Debugging**: Game instance exposed as `window.__game` in dev mode for console debugging ([src/main.ts:60-68](src/main.ts#L60-L68))
6. **Single-File Build**: Production build uses `vite-plugin-singlefile` to inline all assets into one HTML file - useful for distribution but the API proxy won't work without a backend
