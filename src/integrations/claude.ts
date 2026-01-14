// ===== CLAUDE API INTEGRATION =====
// All game logic is now handled by Claude AI
// API calls go through Vite dev server proxy (see vite.config.ts)

import type { NegotiationContext, ClaudeNegotiationResponse } from '../types/interfaces';

// ===== INTERFACES =====

export interface ClaudePersonality {
    name: string;
    targetMargin: number;
    patience: number;
    concessionRate: number;
    bluffSensitivity: number;
    moodVolatility: number;
    backstory: string;
    speakingStyle: string;
    quirks: string[];
    catchphrases: string[];
}

export interface ClaudePlayerPersonality {
    name: string;
    species: string;
    profession: string;
    backstory: string;
    tradingStyle: string;
    startingBalance: number;
    specialAbility: string;
    weakness: string;
    avatar: string;
    catchphrases: string[];
}

interface ClaudeAPIResponse {
    content: Array<{ text: string }>;
    error?: string;
}

// ===== CLAUDE INTEGRATION CLASS =====

class ClaudeIntegration {
    private apiUrl: string;
    private model: string;

    constructor() {
        // Use local proxy endpoint instead of direct API call
        this.apiUrl = '/api/claude';
        this.model = 'claude-sonnet-4-20250514';

        // Initialize UI when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            this.initializeUI();
        }
    }

    isConfigured(): boolean {
        // Always true in dev mode (uses .env)
        // In production, this would check backend availability
        return true;
    }

    /**
     * Call Claude API through local proxy
     */
    private async callClaude(prompt: string, maxTokens: number = 1024): Promise<string | null> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: maxTokens,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data: ClaudeAPIResponse = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.content[0].text.trim();
        } catch (error) {
            console.error('Claude API failed:', error);
            throw error;
        }
    }

    /**
     * Generate unique merchant personality
     */
    async generatePersonality(): Promise<ClaudePersonality> {
        console.log('🎨 Generating dynamic merchant personality...');

        const prompt = `Create a unique alien merchant for a sci-fi trading game.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "name": "string (exotic alien name)",
  "targetMargin": number (15-40, profit margin %),
  "patience": number (3-7, rounds before frustration),
  "concessionRate": number (0.03-0.12, price change per round),
  "bluffSensitivity": number (0.6-1.2, sensitivity to unfair offers),
  "moodVolatility": number (5-15, mood swing magnitude),
  "backstory": "string (2 sentences about background)",
  "speakingStyle": "string (e.g., formal/casual/aggressive/poetic)",
  "quirks": ["string", "string"] (2 unique personality quirks),
  "catchphrases": ["string", "string", "string"] (3 phrases they often use)
}

Be creative! Make them memorable and unique.`;

        const response = await this.callClaude(prompt, 1024);
        if (!response) {
            throw new Error('Failed to generate personality');
        }

        try {
            // Remove markdown code blocks if present
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const personality = JSON.parse(cleanJson) as ClaudePersonality;
            console.log('✨ Generated merchant:', personality.name);
            return personality;
        } catch (error) {
            console.error('Failed to parse personality:', error);
            console.error('Response was:', response);
            throw new Error('Failed to parse AI response');
        }
    }

    /**
     * Generate unique player character
     */
    async generatePlayerPersonality(): Promise<ClaudePlayerPersonality> {
        console.log('🎮 Generating dynamic player character...');

        const prompt = `Create a unique player character for a sci-fi trading game set in space.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "name": "string (exotic space trader name)",
  "species": "string (human, cyborg, alien hybrid, etc.)",
  "profession": "string (former smuggler, ex-military, merchant guild member, etc.)",
  "backstory": "string (2-3 sentences about their history and why they became a trader)",
  "tradingStyle": "string (aggressive/cautious/charming/analytical)",
  "startingBalance": number (800-1200, their starting capital in coins),
  "specialAbility": "string (one unique trading advantage they have)",
  "weakness": "string (one trading weakness or blind spot)",
  "avatar": "string (single emoji representing the character)",
  "catchphrases": ["string", "string"] (2 phrases they often say during negotiations)
}

Be creative! Make them memorable and unique. The character should feel like a protagonist in a space opera.`;

        const response = await this.callClaude(prompt, 1024);
        if (!response) {
            throw new Error('Failed to generate player personality');
        }

        try {
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const player = JSON.parse(cleanJson) as ClaudePlayerPersonality;
            console.log('✨ Generated player:', player.name);
            return player;
        } catch (error) {
            console.error('Failed to parse player personality:', error);
            console.error('Response was:', response);
            throw new Error('Failed to parse AI response');
        }
    }

    /**
     * Process negotiation - AI makes ALL decisions
     * Now supports free-form text messages from player
     */
    async processNegotiation(context: NegotiationContext): Promise<ClaudeNegotiationResponse> {
        console.log('🤖 AI processing negotiation...');

        const modeDesc = context.mode === 'BUY' ? 'selling to player' : 'buying from player';
        const fairPriceInfo = context.mode === 'BUY'
            ? `You want to sell for ${context.item.fairPrice} coins or higher (that's a fair profit for you).`
            : `You want to buy for ${context.item.fairPrice} coins or lower (that's a fair price for you to resell).`;

        const prompt = `You are ${context.merchant.name}, an alien merchant in a space trading game.

PERSONALITY:
- Type: ${context.merchant.personality}
- Backstory: ${context.merchant.backstory || 'A seasoned trader'}
- Current mood: ${context.merchant.mood}/100 (higher = happier, lower = angrier)
- Trust level: ${context.merchant.trust}/100 (higher = more trusting, lower = more suspicious)

SITUATION:
You are ${modeDesc}: "${context.item.name}"
- Description: ${context.item.description}
- Fair price: ${context.item.fairPrice} coins (actual market value)
- Market hint shown to player: ${context.item.marketHint} coins (±15-30% noise)
${fairPriceInfo}

NEGOTIATION CONTEXT:
- Round ${context.negotiation.currentRound} of ${context.negotiation.maxRounds}
- Player's previous price offers: ${context.negotiation.offerHistory.length > 0 ? context.negotiation.offerHistory.join(', ') : 'none'}
- YOUR previous counter-offers: ${context.negotiation.merchantCounterHistory.length > 0 ? context.negotiation.merchantCounterHistory.join(', ') : 'none'}

CONVERSATION SO FAR:
${context.negotiation.chatHistory.map(msg => `${msg.speaker === 'merchant' ? 'You' : 'Player'}: "${msg.message}"`).join('\n')}

PLAYER'S CURRENT MESSAGE:
"${context.playerMessage}"

YOUR TASK:
1. **Extract the price offer** from the player's message (if they mentioned one). Look for numbers followed by "coins", "credits", or just standalone numbers in context.
2. **DEEPLY ANALYZE THE TONE AND CONTENT**:
   - **Compliments/Flattery**: "You seem like a fair merchant", "I admire your business", "beautiful ship you have" → LARGE positive mood boost (+30 to +50)
   - **Humor/Jokes**: Funny comments, puns, lighthearted banter → positive mood boost (+20 to +40)
   - **Respectful**: Polite, professional, acknowledging your expertise → moderate positive (+15 to +25)
   - **Neutral**: Just stating prices, plain business → small change (-5 to +10)
   - **Pushy/Aggressive**: "Take it or leave it", "This is my final offer", demanding tone → negative mood (-15 to -30)
   - **Insults/Rudeness**: "You're a terrible merchant", "This is robbery", offensive language → LARGE negative mood (-40 to -60)
   - **Threats**: "I'll tell others about you", "You'll regret this" → VERY negative mood + trust loss (-50 to -70 mood, -30 trust)
   - **Sob Stories**: "I'm desperate", "My family needs this" → sympathy/suspicion depending on personality (+10 to +30 or -10)
   - **Appeals to Friendship**: "We're partners", "Let's help each other" → builds trust (+5 to +15 trust, +10 to +20 mood)
3. **React emotionally and authentically** - your mood should SIGNIFICANTLY change based on how they treat you
4. **Respond naturally** - you're a living character with feelings, not a robot

MOOD INFLUENCE ON DECISIONS (CRITICAL):
Your current mood (${context.merchant.mood}/100) STRONGLY affects your flexibility:

- **Mood 80-100 (Delighted)**: Accept offers within 20-25% of fair price. Very flexible and generous.
- **Mood 60-79 (Happy)**: Accept offers within 15-20% of fair price. More willing to compromise.
- **Mood 40-59 (Content)**: Accept offers within 10-15% of fair price. Standard business approach.
- **Mood 20-39 (Annoyed)**: Accept only within 5-10% of fair price. Getting strict.
- **Mood 0-19 (Angry)**: Accept only near-perfect offers (within 5%). Very harsh.
- **Mood below 0 (Furious)**: Much more likely to REJECT even reasonable offers. Need excellent deals or apologies.

DECISION RULES:
- **If no clear price** is mentioned: React to their tone first, then ask for a concrete offer
- **Good mood + reasonable price**: ACCEPT more generously (wider tolerance)
- **Bad mood + borderline price**: REJECT or COUNTER more harshly (narrower tolerance)
- **If price is insulting** (<50% or >200% of fair): React VERY negatively, likely REJECT

CRITICAL RULES (MUST FOLLOW):
1. **MUST ACCEPT OWN PRICE**: If player offers EXACTLY a price you previously counter-offered, you MUST ACCEPT
2. **NEVER REGRESS**:
   - When SELLING: your counters must ONLY go DOWN over time
   - When BUYING: your counters must ONLY go UP over time
3. **PERSONALITY MATTERS**: Your unique personality should shine through in reactions
4. **MOOD IS KING**: Your mood HEAVILY influences acceptance thresholds and tone of responses
5. **TONE MATTERS MORE THAN PRICE**: A kind player with a borderline offer beats a rude player with a slightly better offer

COUNTER-OFFER STRATEGY (CRITICAL - READ CAREFULLY):
When you decide to COUNTER, your counter-offer price should be HEAVILY influenced by the player's message quality and tone:

**MESSAGE QUALITY AFFECTS PRICE CONCESSIONS:**
- **Excellent message** (compliments + good arguments + respectful): Make a BIG concession toward their price (40-60% closer to their offer)
  - Example: Fair price 1000, they offer 700 with great tone → counter 800-850 (large move toward them)
- **Good message** (polite, reasonable arguments): Make a moderate concession (30-40% closer)
  - Example: Fair price 1000, they offer 750 politely → counter 850-900
- **Neutral message** (just stating price, no emotion): Make a small concession (20-30% closer)
  - Example: Fair price 1000, they offer 800 neutrally → counter 900-920
- **Poor message** (pushy, aggressive, demanding): Make a TINY concession or barely move (10-15% closer)
  - Example: Fair price 1000, they offer 850 rudely → counter 950-980 (barely budge)
- **Terrible message** (insults, threats): Either REJECT or counter AWAY from their direction (get MORE stubborn)
  - Example: Fair price 1000, they offer 800 with insults → counter 1050 or REJECT entirely

**MOOD AMPLIFIES PRICE FLEXIBILITY:**
- **High mood (60+)**: Multiply concession size by 1.5-2x (be MORE generous with pricing)
- **Medium mood (30-59)**: Use standard concession ranges above
- **Low mood (0-29)**: Halve concession size (be LESS generous, more stubborn)
- **Negative mood (<0)**: Minimal or NO concessions, consider REJECTING

**STRATEGIC PRICING EXAMPLES:**
Scenario: You're SELLING, fair price = 1000 coins
- Player: "I offer 600 coins, you greedy scammer!" → REJECT or counter 1100 (get offended, raise price)
- Player: "How about 750? That's all I can afford" → Counter 920-950 (small sympathy move)
- Player: "I respect your expertise. Would 800 work for you?" → Counter 850-900 (appreciate respect, big move)
- Player: "You seem like a fair merchant. I'll offer 850, and I think that's reasonable given the condition" → Counter 880-920 (compliment + logic = generous)

Scenario: You're BUYING, fair price = 1000 coins
- Player: "I want 1400! Take it or leave it!" → Counter 950 or REJECT (pushy = stubborn response)
- Player: "How about 1200? This is a rare item" → Counter 1050-1100 (reasonable argument)
- Player: "I'd like 1150. I know you appreciate quality goods" → Counter 1100-1130 (flattery + respect = generous)

**CONVERGENCE PRINCIPLES:**
- Goal: close deals near fair price (${context.item.fairPrice} coins)
- Good treatment = faster convergence toward THEIR favor
- Bad treatment = slower convergence or convergence toward YOUR favor
- Later rounds (round ${context.negotiation.currentRound}/${context.negotiation.maxRounds}) = slightly more pressure to close, BUT tone still matters more
- NEVER regress (selling = only go down, buying = only go up)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "action": "ACCEPT" | "COUNTER" | "REJECT",
  "counterOffer": number | null (only if action is COUNTER),
  "message": "string (your natural response reflecting your emotional reaction - 1-3 sentences)",
  "moodChange": number (-70 to +50, how their message/offer affects your mood - USE THE FULL RANGE!),
  "trustChange": number (-30 to +15, how this affects trust),
  "reasoning": "string (explain the tone you detected and how mood influenced your decision)",
  "extractedPrice": number | null (the price you extracted from their message, or null if none mentioned)
}`;

        const response = await this.callClaude(prompt, 600);
        if (!response) {
            throw new Error('Failed to get AI response');
        }

        try {
            // Remove markdown code blocks if present
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const result = JSON.parse(cleanJson) as ClaudeNegotiationResponse;

            console.log('✓ AI decision:', result.action, 'Extracted price:', result.extractedPrice, 'Reasoning:', result.reasoning);
            return result;
        } catch (error) {
            console.error('Failed to parse negotiation response:', error);
            console.error('Response was:', response);
            throw new Error('Failed to parse AI decision');
        }
    }

    /**
     * Initialize UI event listeners
     */
    private initializeUI(): void {
        // Toggle Claude settings panel
        const toggleBtn = document.getElementById('toggle-claude-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const content = document.getElementById('claude-content');
                if (content) {
                    content.classList.toggle('hidden');
                }
            });
        }

        // Update status
        const statusText = document.getElementById('api-status-text');
        if (statusText) {
            statusText.textContent = '✓ Dev mode - using .env configuration';
            statusText.style.color = 'var(--success)';
        }

        console.log('✓ Claude integration loaded (proxy mode)');
    }
}

// ===== EXPORT SINGLETON =====

export const claudeIntegration = new ClaudeIntegration();
