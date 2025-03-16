import './styles.css';
import { Game } from './game/Game';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing game...');
    const game = new Game();
    console.log('Game initialized successfully');

    // Handle cleanup on window unload
    window.addEventListener('unload', () => {
      game.destroy();
    });
  } catch (error) {
    console.error('Error initializing game:', error);
  }
}); 