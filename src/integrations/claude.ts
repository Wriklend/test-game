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
2. **Understand the player's intent**: Are they being friendly? Aggressive? Trying to flatter you? Making a threat? Just stating a price?
3. **React in character** based on:
   - The price they offered (if any)
   - Their tone and approach
   - Your current mood and trust level
   - The negotiation history
4. **Respond naturally** - you're a living character, not a robot

DECISION RULES:
- **If no clear price** is mentioned: Ask them to make a concrete offer (or make a counter-offer yourself)
- **If price is fair** (within 10-15% of ${context.item.fairPrice}): ACCEPT
- **If price is reasonable but not ideal**: COUNTER with a price moving toward ${context.item.fairPrice}
- **If price is insulting** (<50% or >200% of fair): React negatively, maybe REJECT if you're out of patience

CRITICAL RULES (MUST FOLLOW):
1. **MUST ACCEPT OWN PRICE**: If player offers EXACTLY a price you previously counter-offered, you MUST ACCEPT
2. **NEVER REGRESS**:
   - When SELLING: your counters must ONLY go DOWN over time
   - When BUYING: your counters must ONLY go UP over time
3. **PERSONALITY MATTERS**: React to flattery, insults, humor based on your personality
4. **MOOD AFFECTS DECISIONS**: Good mood = more generous, bad mood = stricter (but still negotiate)

PRICE CONVERGENCE:
- Goal: close deals near fair price (${context.item.fairPrice} coins)
- Each counter should move closer to fair price
- Get more flexible in later rounds (round ${context.negotiation.currentRound}/${context.negotiation.maxRounds})

Return ONLY valid JSON (no markdown, no code blocks):
{
  "action": "ACCEPT" | "COUNTER" | "REJECT",
  "counterOffer": number | null (only if action is COUNTER),
  "message": "string (your natural response to the player, in character - 1-3 sentences)",
  "moodChange": number (-30 to +30, how their message/offer affects your mood),
  "trustChange": number (-20 to +10, how this affects trust),
  "reasoning": "string (brief explanation for debugging)",
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
