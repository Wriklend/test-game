// ===== LEADERBOARD MANAGER =====
// Manages local high scores leaderboard

export interface LeaderboardEntry {
    playerName: string;
    score: number;
    profit: number;
    deals: number;
    timestamp: number;
}

export class Leaderboard {
    private static readonly LEADERBOARD_KEY = 'stellar-bargains-leaderboard';
    private static readonly MAX_ENTRIES = 10;

    /**
     * Get all leaderboard entries, sorted by score descending
     */
    static getEntries(): LeaderboardEntry[] {
        try {
            const data = localStorage.getItem(this.LEADERBOARD_KEY);
            if (!data) return [];

            const entries = JSON.parse(data) as LeaderboardEntry[];
            return entries.sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            return [];
        }
    }

    /**
     * Add a new entry to the leaderboard
     * Returns the rank (1-10) if entry made it to the board, null otherwise
     */
    static addEntry(entry: Omit<LeaderboardEntry, 'timestamp'>): number | null {
        try {
            const entries = this.getEntries();
            const newEntry: LeaderboardEntry = {
                ...entry,
                timestamp: Date.now()
            };

            // Add new entry
            entries.push(newEntry);

            // Sort by score (descending)
            entries.sort((a, b) => b.score - a.score);

            // Keep only top MAX_ENTRIES
            const topEntries = entries.slice(0, this.MAX_ENTRIES);

            // Save back to localStorage
            localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(topEntries));

            // Find rank of new entry
            const rank = topEntries.findIndex(e =>
                e.playerName === newEntry.playerName &&
                e.score === newEntry.score &&
                e.timestamp === newEntry.timestamp
            );

            // Return rank (1-indexed) if entry made it to the board
            return rank >= 0 ? rank + 1 : null;
        } catch (error) {
            console.error('Failed to add leaderboard entry:', error);
            return null;
        }
    }

    /**
     * Check if a score would qualify for the leaderboard
     */
    static wouldQualify(score: number): boolean {
        const entries = this.getEntries();

        // If board isn't full, always qualifies
        if (entries.length < this.MAX_ENTRIES) {
            return true;
        }

        // Check if score beats the lowest entry
        const lowestScore = entries[entries.length - 1].score;
        return score > lowestScore;
    }

    /**
     * Clear all leaderboard entries
     */
    static clear(): boolean {
        try {
            localStorage.removeItem(this.LEADERBOARD_KEY);
            console.log('✓ Leaderboard cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear leaderboard:', error);
            return false;
        }
    }

    /**
     * Get rank for a specific score (what rank would this score be?)
     */
    static getRankForScore(score: number): number {
        const entries = this.getEntries();
        let rank = 1;

        for (const entry of entries) {
            if (score > entry.score) {
                break;
            }
            rank++;
        }

        return rank;
    }
}
