# ⭐ Stellar Bargains - AI Merchant Negotiation Game

A sci-fi trading game **fully powered by Claude AI**. Negotiate with AI-generated alien merchants, each with unique personalities, backstories, and negotiation styles. Every decision—accept, counter, reject—is made by Claude in real-time.

## 🤖 AI-Powered Features

- **AI-Generated Merchants**: Every merchant is uniquely created by Claude with backstory, quirks, catchphrases, and personality
- **Real AI Decisions**: Claude AI decides whether to accept, counter, or reject your offers based on full negotiation context
- **Dynamic Dialogue**: All merchant responses are generated in real-time by Claude
- **Adaptive Behavior**: The AI tracks mood, trust, and offer history to make realistic, contextual decisions
- **Infinite Variety**: Every merchant and negotiation is completely unique

## 🛠️ Tech Stack

- **Frontend**: TypeScript + Vite
- **AI**: Claude API (Sonnet 4.5)
- **Architecture**: Modular ES6 with path aliases
- **Dev Proxy**: Vite middleware for API security
- **Styling**: Vanilla CSS with CSS variables

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Claude API Key

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:

```env
CLAUDE_API_KEY=sk-ant-your-api-key-here
```

**Get your API key:** https://console.anthropic.com/

⚠️ **Important**: The API key is stored server-side and **never exposed to the browser**.

### 3. Run Development Server

```bash
npm run dev
```

The game will open at http://localhost:3000/

## 📦 Available Scripts

- `npm run dev` - Start dev server with HMR (Hot Module Replacement)
- `npm run build` - Build for production (TypeScript → Vite bundle)
- `npm run preview` - Preview production build locally
- `npm run type-check` - Check TypeScript types without building

## 🎮 How to Play

### Objective
Maximize profit by buying items below their fair value and selling items above their fair value. The AI merchant tracks mood and trust to create realistic negotiations.

### Game Flow

1. **Start Negotiation:**
   - Click "🛒 BUY from Merchant" to purchase an item
   - Click "💵 SELL to Merchant" to sell an item

2. **Make Offers:**
   - Each negotiation has up to 6 rounds (4 in Hard Mode)
   - Enter your offer in coins
   - Claude AI decides: ACCEPT, COUNTER, or REJECT

3. **AI Decision Factors:**
   - **Fair Price**: The actual market value (hidden from you)
   - **Market Hint**: Rough estimate shown to you (±15-30% noise)
   - **Mood**: Ranges from -100 (angry) to +100 (happy)
   - **Trust**: Ranges from 0 (suspicious) to 100 (trusting)
   - **Offer History**: AI remembers all previous offers
   - **Round Pressure**: AI gets more desperate as rounds progress

4. **Complete the Deal:**
   - If AI accepts, the trade is completed
   - Your profit = Fair Price - Final Price (when buying)
   - Your profit = Final Price - Fair Price (when selling)

### Strategy Tips

1. **Use the Market Estimate** - It's intentionally noisy, but a good starting point
2. **Avoid Lowballing** - Extreme offers damage trust and anger the merchant
3. **Be Consistent** - Wild price swings make the AI suspicious
4. **Watch Mood & Trust** - The AI reacts realistically to your behavior
5. **Round Pressure Works** - AI becomes more flexible in later rounds
6. **Every Merchant is Different** - Claude generates unique personalities each time

## 🏗️ Project Structure

```
src/
├── main.ts                     # Entry point with HMR support
├── types/
│   ├── enums.ts               # Rarity, Condition, ItemCategory
│   ├── types.ts               # NegotiationMode, NegotiationAction
│   ├── interfaces.ts          # All interfaces (NegotiationContext, ClaudeNegotiationResponse, etc.)
│   └── index.ts               # Barrel export
├── data/
│   └── itemTemplates.ts       # 32 sci-fi items (weapons, tech, artifacts, consumables)
├── models/
│   ├── Item.ts                # Item model with price calculation
│   ├── PersonalityProfile.ts  # Merchant personality container
│   ├── Merchant.ts            # Merchant with mood/trust tracking
│   └── ItemGenerator.ts       # Random item generation
├── integrations/
│   └── claude.ts              # Claude API integration (proxy mode)
├── ui/
│   └── UIController.ts        # DOM manipulation & event handling
├── game/
│   └── Game.ts                # Main game orchestrator
└── styles/
    └── main.css               # All CSS styling
```

## 🔌 How the AI Integration Works

### Architecture

```
Browser → Vite Dev Server → Claude API
          (proxy /api/claude)
```

1. **Browser** makes POST request to `/api/claude`
2. **Vite Middleware** (see `vite.config.ts`) intercepts the request
3. **Proxy** adds API key from `.env` and forwards to Claude API
4. **Claude API** processes the request (personality generation or negotiation decision)
5. **Response** flows back to browser with AI-generated content

### API Security

- ✅ API key stored in `.env` file (server-side only)
- ✅ Never exposed to browser JavaScript
- ✅ `.env` is in `.gitignore` (never committed)
- ✅ Proxy validates requests before forwarding

### API Usage & Cost

Each game session makes approximately:
- **1 call** to generate merchant personality (~1000 tokens)
- **1-6 calls** per negotiation (~500 tokens each)

**Estimated cost**: ~$0.01-0.02 per negotiation with Claude Sonnet 4.5

## 🎯 What's Different from Original?

### Before (Deterministic Logic)
- 3 static personality types (Greedy, Honest, Impulsive)
- Rule-based negotiation engine with formulas
- Template-based message generation
- Bluff detection with hardcoded thresholds
- Predictable behavior

### Now (AI-Powered)
- ♾️ Infinite unique merchants generated by Claude
- 🤖 All decisions made by AI based on context
- 💬 Real-time dialogue generation
- 🧠 Adaptive behavior that feels human-like
- 🎭 Every negotiation is unique

### Architecture Changes
- ❌ Removed: `src/ai/` folder (BluffDetector, NegotiationEngine, MessageGenerator)
- ❌ Removed: Message templates
- ✅ Added: Vite proxy middleware
- ✅ Added: Full Claude API integration
- ✅ Simplified: Game orchestrator

## 📊 Items Database

The game includes **32 unique items** across 4 categories:

### Weapons (8)
Plasma Rifle, Neural Disruptor, Mono-Blade, Gravity Hammer, Arc Pistol, Photon Lance, Sonic Stunner, Nano-Swarm Grenade

### Tech (10)
Quantum Processor, Holo-Projector, Neural Interface, Fusion Cell, Stealth Field Generator, Gravity Boots, Translator Implant, Repair Nanites, Data Spike, Bio-Scanner

### Artifacts (7)
Precursor Orb, Psionic Crystal, Time Shard, Void Stone, Star Chart, Memory Crystal, Harmonic Resonator

### Consumables (7)
Stim Pack, Ration Bar, Anti-Radiation Serum, Oxygen Canister, Boost Injectable, Mind Shield Pill, Cryo Capsule

## 🚢 Production Deployment

⚠️ **Important**: The current setup uses Vite dev server proxy which **only works in development**.

For production, you need to create a proper backend:

### Option 1: Express Backend

```javascript
// server.js
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('dist'));

app.post('/api/claude', async (req, res) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.json(data);
});

app.listen(3000);
```

### Option 2: Serverless Functions

Deploy to Vercel/Netlify with serverless functions:

```javascript
// api/claude.js (Vercel) or netlify/functions/claude.js
export default async function handler(req, res) {
  // Same logic as above
}
```

### Deployment Steps

1. Build frontend: `npm run build`
2. Deploy `dist/` folder to CDN/static hosting
3. Deploy backend API to server/serverless
4. Update `src/integrations/claude.ts` to point to production API URL

## 🐛 Troubleshooting

### "CLAUDE_API_KEY not configured"
- Make sure `.env` file exists in root directory
- Check that `CLAUDE_API_KEY=sk-ant-...` is set correctly
- Restart dev server after changing `.env`

### "API error 400" or CORS error
- This happens when trying to call Claude API directly from browser
- Solution is already implemented: use the Vite proxy
- Make sure you're running `npm run dev` (not just opening HTML)

### TypeScript errors
```bash
npm run type-check  # See all type errors
```

### Build fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Development Notes

### HMR (Hot Module Replacement)
- Player balance/profit persists across hot reloads
- State saved to `localStorage` during HMR
- Automatically restored on reload

### Path Aliases
```typescript
import { Game } from '@game/Game';
import { Item } from '@models/Item';
import { claudeIntegration } from '@integrations/claude';
```

Configured in both `tsconfig.json` and `vite.config.ts`.

### Strict TypeScript
- All strict mode flags enabled
- No implicit `any`
- Full type safety across codebase

## 🎉 Credits

**Game Design**: AI Merchant Negotiation
**AI Model**: Claude Sonnet 4.5 by Anthropic
**Engine**: TypeScript + Vite
**Theme**: Sci-Fi Marketplace
**Architecture**: Modular ES6 with AI-first design

Built with Claude Code assistance.

## 📄 License

MIT

---

**Pro Tip**: Every merchant is unique! Try different strategies and see how Claude adapts to your negotiation style. 🚀
