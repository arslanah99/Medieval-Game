import { WorldScene } from './scenes/WorldScene';
import { Scene3D } from './scenes/Scene3D';
import { CharacterCreationScene } from './scenes/CharacterCreationScene';
import { useGameStore } from './stores/gameStore';

export class Game {
  private worldScene: WorldScene;
  private scene3D: Scene3D | null = null;
  private characterCreationScene: CharacterCreationScene | null = null;
  private currentScene: string = 'character-creation';
  private isTransitioning: boolean = false;

  constructor() {
    console.log('Game constructor started');
    
    // Initialize game state
    useGameStore.getState().initialize();
    console.log('Game state initialized');
    
    // Start with character creation scene
    this.characterCreationScene = new CharacterCreationScene();
    console.log('Character creation scene created');
    
    // Create world scene (but keep it hidden for now)
    this.worldScene = new WorldScene();
    console.log('World scene created');
    
    // Setup scene management
    this.setupSceneManagement();
    console.log('Scene management setup complete');

    // Start game loop
    this.gameLoop();
    console.log('Game loop started');
  }

  private setupSceneManagement(): void {
    // Subscribe to game state changes
    useGameStore.subscribe((state: any) => {
      const newScene = state.currentScene;
      if (newScene !== this.currentScene) {
        this.handleSceneChange(newScene);
      }
    });
  }

  private async handleSceneChange(newScene: string): Promise<void> {
    console.log('Transitioning to scene:', newScene);
    
    if (this.isTransitioning) {
      console.log('Scene transition already in progress, skipping');
      return;
    }
    
    this.isTransitioning = true;

    try {
      // Clean up current scene
      await this.cleanupCurrentScene();

      // Initialize new scene
      switch (newScene) {
        case 'character-creation':
          if (!this.characterCreationScene) {
            console.log('Creating new character creation scene');
            this.characterCreationScene = new CharacterCreationScene();
          }
          break;
          
        case 'lumbridge':
          console.log('Creating Lumbridge scene');
          if (!this.scene3D) {
            console.log('Initializing new Scene3D instance');
            this.scene3D = new Scene3D();
          }
          break;
          
        default:
          console.warn(`Unknown scene: ${newScene}`);
          this.isTransitioning = false;
          return;
      }

      this.currentScene = newScene;
      console.log('Scene transition complete to:', newScene);
    } catch (error) {
      console.error('Error during scene transition:', error);
    } finally {
      this.isTransitioning = false;
    }
  }

  private async cleanupCurrentScene(): Promise<void> {
    console.log('Cleaning up current scene:', this.currentScene);
    
    try {
      switch (this.currentScene) {
        case 'character-creation':
          if (this.characterCreationScene) {
            this.characterCreationScene.destroy();
            this.characterCreationScene = null;
          }
          break;
          
        case 'lumbridge':
          if (this.scene3D) {
            this.scene3D.destroy();
            this.scene3D = null;
          }
          break;
      }
    } catch (error) {
      console.error('Error cleaning up scene:', error);
    }
  }

  private gameLoop = (): void => {
    if (!this.isTransitioning) {
      switch (this.currentScene) {
        case 'character-creation':
          if (this.characterCreationScene) {
            this.characterCreationScene.update();
          }
          break;
          
        case 'lumbridge':
          if (this.scene3D) {
            this.scene3D.update();
          }
          break;
      }
    }
    requestAnimationFrame(this.gameLoop);
  }

  public destroy(): void {
    this.cleanupCurrentScene();
    if (this.worldScene) {
      this.worldScene.destroy();
    }
  }
} 