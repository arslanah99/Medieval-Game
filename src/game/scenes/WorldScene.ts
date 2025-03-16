import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import { useGameStore } from '../stores/gameStore';

export class WorldScene extends Container {
  private background: Sprite;
  private currentScene: string;

  constructor() {
    super();
    this.currentScene = useGameStore.getState().currentScene;
    
    // Create a larger background
    this.background = new Sprite(Texture.WHITE);
    this.background.width = 6400;
    this.background.height = 6400;
    this.background.tint = 0x2d5a27; // Darker green for grass
    
    // Center the background
    this.background.x = -this.background.width / 2;
    this.background.y = -this.background.height / 2;
    this.addChild(this.background);

    // Add grid lines for better spatial awareness
    this.addGridLines();

    // Add some basic scenery
    this.setupLumbridge();

    // Hide the scene initially
    this.visible = false;
  }

  private addGridLines(): void {
    const grid = new Graphics();
    grid.lineStyle(1, 0x336633, 0.3);
    
    // Draw vertical lines
    for (let x = -3200; x <= 3200; x += 200) {
      grid.moveTo(x, -3200);
      grid.lineTo(x, 3200);
    }
    
    // Draw horizontal lines
    for (let y = -3200; y <= 3200; y += 200) {
      grid.moveTo(-3200, y);
      grid.lineTo(3200, y);
    }
    
    this.addChild(grid);
  }

  private setupLumbridge(): void {
    // Add Lumbridge Castle
    const castle = new Sprite(Texture.WHITE);
    castle.width = 400;
    castle.height = 600;
    castle.x = 0; // Center of the world
    castle.y = 0;
    castle.tint = 0x808080; // Gray for castle
    castle.anchor.set(0.5);
    this.addChild(castle);

    // Add castle walls
    const walls = new Graphics();
    walls.beginFill(0x666666);
    walls.drawRect(-250, -350, 500, 700);
    walls.endFill();
    this.addChild(walls);

    // Add Lumbridge Church
    const church = new Sprite(Texture.WHITE);
    church.width = 200;
    church.height = 300;
    church.x = 500;
    church.y = -200;
    church.tint = 0xdddddd; // Light gray for church
    church.anchor.set(0.5);
    this.addChild(church);

    // Add some trees in a more organized pattern
    for (let i = 0; i < 20; i++) {
      const tree = new Sprite(Texture.WHITE);
      tree.width = 60;
      tree.height = 120;
      
      // Calculate position in a circular pattern around the castle
      const angle = (i / 20) * Math.PI * 2;
      const radius = 800 + Math.random() * 400;
      tree.x = Math.cos(angle) * radius;
      tree.y = Math.sin(angle) * radius;
      
      tree.tint = 0x1a472a; // Dark green for trees
      tree.anchor.set(0.5);
      this.addChild(tree);
    }

    // Add some paths
    const paths = new Graphics();
    paths.lineStyle(30, 0xc2b280, 1); // Sandy color for paths
    
    // Main path from south to castle
    paths.moveTo(0, 1000);
    paths.lineTo(0, 200);
    
    // Path to church
    paths.moveTo(0, 0);
    paths.lineTo(500, -200);
    
    this.addChild(paths);
  }

  public update(delta: number): void {
    // Update scene based on current scene in game store
    const newScene = useGameStore.getState().currentScene;
    if (newScene !== this.currentScene) {
      this.currentScene = newScene;
      this.updateScene();
    }
  }

  private updateScene(): void {
    // Clear existing scene
    while (this.children.length > 1) { // Keep the background
      this.removeChildAt(1);
    }

    // Setup new scene based on currentScene
    switch (this.currentScene) {
      case 'lumbridge':
        this.setupLumbridge();
        break;
      // Add more scenes here as we develop them
    }
  }
} 