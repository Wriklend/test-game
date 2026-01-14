// ===== MERCHANT CLASS =====

import { PersonalityProfile } from './PersonalityProfile';

/**
 * Merchant class - manages personality, mood, and trust
 */
export class Merchant {
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
