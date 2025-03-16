import { Game } from './game/Game';

// Create and start the game
const game = new Game();

// Game loop
function gameLoop() {
  game.update();
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop(); 