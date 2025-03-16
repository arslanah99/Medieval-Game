import './styles.css';
import * as THREE from 'three';
import { Scene3D } from './game/scenes/Scene3D';
import { GameUI } from './game/ui/GameUI';
import { Game } from './game/Game';

// Ensure the document body has the right styling
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.width = '100vw';
document.body.style.height = '100vh';

// Create the game instance (this handles scene creation and management)
const game = new Game();

// The game's internal loop will handle rendering and updates
// No need to call animate manually

// Clean up resources when window is closed
window.addEventListener('beforeunload', () => {
  game.destroy();
}); 