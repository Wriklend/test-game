// ===== PERSONALITY PROFILE CLASS =====

import type { PersonalityTraits } from '../types/interfaces';

/**
 * PersonalityProfile - defines merchant behavior traits
 */
export class PersonalityProfile {
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
