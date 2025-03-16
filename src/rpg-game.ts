import * as THREE from 'three';
import { Scene3D } from './game/scenes/Scene3D';
import { GameUI } from './game/ui/GameUI';

// Create game UI
const gameUI = new GameUI();

// Create main game scene
const scene = new Scene3D();

// Handle window resize
window.addEventListener('resize', () => {
  // Update camera aspect ratio and renderer size
  const camera = scene.getCamera();
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  
  const renderer = scene.getRenderer();
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// Start the game loop
const animate = () => {
  requestAnimationFrame(animate);
  scene.update();
};
animate();

// Clean up resources when window is closed
window.addEventListener('beforeunload', () => {
  scene.destroy();
}); 