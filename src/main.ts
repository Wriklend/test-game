// ===== ENTRY POINT =====

import './styles/main.css';
import { Game } from '@game/Game';

let game: Game;

/**
 * Initialize game after DOM is loaded
 */
async function initGame(): Promise<void> {
    game = new Game();

    // Initialize player and merchant (async for Claude generation)
    await game.initializeGame();

    // Restore state from HMR if available
    const savedBalance = localStorage.getItem('hmr_player_balance');
    const savedProfit = localStorage.getItem('hmr_player_profit');

    if (savedBalance !== null && savedProfit !== null) {
        game.player.balance = parseInt(savedBalance);
        game.player.profit = parseInt(savedProfit);
        game.ui.updatePlayerInfo(game.player);

        // Clear HMR state after restoration
        localStorage.removeItem('hmr_player_balance');
        localStorage.removeItem('hmr_player_profit');

        console.log('🔥 HMR: State restored');
    }

    console.log('✅ Game initialized');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM already loaded
    initGame();
}

// ===== HOT MODULE REPLACEMENT (HMR) SUPPORT =====
if (import.meta.hot) {
    import.meta.hot.accept();

    // Save state before reload
    import.meta.hot.dispose(() => {
        if (game) {
            localStorage.setItem('hmr_player_balance', String(game.player.balance));
            localStorage.setItem('hmr_player_profit', String(game.player.profit));
            console.log('🔥 HMR: State saved');
        }
    });
}

// ===== DEVELOPMENT DEBUGGING =====
// Expose game instance for console debugging (dev mode only)
if (import.meta.env.DEV) {
    // Wait for game to be initialized before exposing
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            (window as any).__game = game;
            console.log('💡 Dev mode: Access game instance via window.__game');
        }, 100);
    });
}
