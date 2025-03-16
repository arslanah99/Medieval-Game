import { WorldScene } from './scenes/WorldScene';
import { Scene3D } from './scenes/Scene3D';
import { CharacterCreationScene } from './scenes/CharacterCreationScene';
import { useGameStore } from './stores/gameStore';
import { LoadingScreen } from './ui/LoadingScreen';
import { useQuestStore } from './systems/QuestSystem';
import { CutsceneUI, useCutsceneStore, gamePrologueCutscene } from './systems/CutsceneSystem';
import { NecromancerBoss } from './entities/Boss';
import * as THREE from 'three';

export class Game {
  private worldScene: WorldScene;
  private scene3D: Scene3D | null = null;
  private characterCreationScene: CharacterCreationScene | null = null;
  private currentScene: string = 'character-creation';
  private isTransitioning: boolean = false;
  private loadingScreen: LoadingScreen;
  private cutsceneUI: CutsceneUI;

  constructor() {
    console.log('Game constructor started');
    
    // Initialize loading screen
    this.loadingScreen = new LoadingScreen();
    this.loadingScreen.show();
    this.loadingScreen.setProgress(0, 'Initializing game...');
    
    // Initialize cutscene UI
    this.cutsceneUI = new CutsceneUI();
    
    // Initialize game state
    useGameStore.getState().initialize();
    console.log('Game state initialized');
    this.loadingScreen.setProgress(10, 'Game state initialized');
    
    // Initialize quest system
    useQuestStore.getState().initializeQuests();
    console.log('Quest system initialized');
    this.loadingScreen.setProgress(20, 'Quest system initialized');
    
    // Register cutscenes
    this.registerCutscenes();
    console.log('Cutscenes registered');
    this.loadingScreen.setProgress(30, 'Cutscenes registered');
    
    // Start with character creation scene
    this.characterCreationScene = new CharacterCreationScene();
    console.log('Character creation scene created');
    this.loadingScreen.setProgress(50, 'Character creation ready');
    
    // Create world scene (but keep it hidden for now)
    this.worldScene = new WorldScene();
    console.log('World scene created');
    this.loadingScreen.setProgress(80, 'World loaded');
    
    // Setup scene management
    this.setupSceneManagement();
    console.log('Scene management setup complete');
    this.loadingScreen.setProgress(90, 'Game setup complete');

    // Start game loop
    this.gameLoop();
    console.log('Game loop started');
    
    // Complete loading and show intro cutscene
    setTimeout(() => {
      this.loadingScreen.setProgress(100, 'Ready to play!');
      setTimeout(() => {
        this.loadingScreen.hide();
        // Play intro cutscene after a short delay
        setTimeout(() => {
          useCutsceneStore.getState().playCutscene('game_prologue');
        }, 500);
      }, 500);
    }, 1000);
  }

  private registerCutscenes(): void {
    // Register the prologue cutscene
    useCutsceneStore.getState().registerCutscene(gamePrologueCutscene);
    
    // Register other cutscenes here as needed
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
    
    // Show loading screen during scene transitions
    this.loadingScreen.show();
    this.loadingScreen.setProgress(0, `Loading ${newScene}...`);

    try {
      // Clean up current scene
      await this.cleanupCurrentScene();
      this.loadingScreen.setProgress(30, 'Cleaning up previous scene...');

      // Initialize new scene
      switch (newScene) {
        case 'character-creation':
          if (!this.characterCreationScene) {
            console.log('Creating new character creation scene');
            this.characterCreationScene = new CharacterCreationScene();
          }
          this.loadingScreen.setProgress(60, 'Preparing character creation...');
          break;
          
        case 'lumbridge':
          console.log('Creating Lumbridge scene');
          if (!this.scene3D) {
            console.log('Initializing new Scene3D instance');
            this.scene3D = new Scene3D();
          }
          this.loadingScreen.setProgress(60, 'Loading Lumbridge...');
          
          // Add a 1-second delay for effect
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          break;
          
        case 'boss_necromancer':
          console.log('Loading Necromancer boss fight');
          if (!this.scene3D) {
            console.log('Initializing new Scene3D instance');
            this.scene3D = new Scene3D();
          }
          
          // Create necromancer boss
          const necromancerPosition = new THREE.Vector3(0, 0, -20);
          const boss = new NecromancerBoss(necromancerPosition);
          
          // Add boss to the scene - we'll need to implement this in Scene3D later
          if (this.scene3D) {
            // Use the appropriate method from Scene3D to add the boss
            // this.scene3D.addEntity(boss);
            console.log('Boss created and ready for battle');
          }
          
          this.loadingScreen.setProgress(60, 'Preparing boss battle...');
          
          // Add a 2-second delay for effect
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          break;
          
        default:
          console.warn(`Unknown scene: ${newScene}`);
          this.isTransitioning = false;
          this.loadingScreen.hide();
          return;
      }

      this.currentScene = newScene;
      console.log('Scene transition complete to:', newScene);
      
      // Fade out loading screen
      this.loadingScreen.setProgress(100, 'Ready!');
      setTimeout(() => {
        this.loadingScreen.hide();
        
        // Play scene-specific cutscene if needed
        if (newScene === 'boss_necromancer') {
          // Play boss intro cutscene
          setTimeout(() => {
            useCutsceneStore.getState().playCutscene('necromancer_intro');
          }, 500);
        }
      }, 500);
    } catch (error) {
      console.error('Error during scene transition:', error);
      this.loadingScreen.hide();
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
        case 'boss_necromancer':
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
    // Don't update scenes if in a cutscene
    if (useCutsceneStore.getState().isPlaying) {
      requestAnimationFrame(this.gameLoop);
      return;
    }
    
    if (!this.isTransitioning) {
      switch (this.currentScene) {
        case 'character-creation':
          if (this.characterCreationScene) {
            this.characterCreationScene.update();
          }
          break;
          
        case 'lumbridge':
        case 'boss_necromancer':
          if (this.scene3D) {
            this.scene3D.update();
            
            // Check for quest updates here
            this.updateQuestProgress();
          }
          break;
      }
    }
    requestAnimationFrame(this.gameLoop);
  }
  
  private updateQuestProgress(): void {
    // Example: Check for nearby enemies, collectibles, locations
    // and update quest objectives accordingly
    
    // This would be implemented based on player position, interactions, etc.
    console.log('Checking quest progress...');
  }

  public destroy(): void {
    this.cleanupCurrentScene();
    if (this.worldScene) {
      this.worldScene.destroy();
    }
    
    if (this.loadingScreen) {
      this.loadingScreen.destroy();
    }
    
    if (this.cutsceneUI) {
      this.cutsceneUI.destroy();
    }
  }
} 