import * as THREE from 'three';
import { Character3D } from '../entities/Character3D';
import { useGameStore } from '../stores/gameStore';
import { GameState } from '../types/GameState';
import { Castle } from '../environment/Castle';
import { Enemy, EnemyType } from '../entities/Enemy';
import { GameUI } from '../ui/GameUI';
import { QuestSystem } from '../systems/QuestSystem';

// Define types for imported modules until they are properly available
interface Town {
  getCollisionObjects(): THREE.Mesh[];
  getPosition(): THREE.Vector3;
}

interface NPCType {
  mayor: string;
  shopkeeper: string;
  guard: string;
  villager: string;
  instructor: string;
}

interface DialogueOption {
  text: string;
  response: string;
  action?: () => void;
}

interface NPC {
  getPosition(): THREE.Vector3;
  getInteractionRadius(): number;
  getMesh(): THREE.Group;
  getName(): string;
  getType(): string;
  getDialogueOptions(dialogueKey?: string): DialogueOption[];
  setCurrentDialogue(dialogueKey: string | null): void;
  getCurrentDialogue(): string | null;
  interact(): void;
  endInteraction(): void;
  isInteracting(): boolean;
}

// Enemy types
const ENEMY_TYPES: { [key: string]: EnemyType } = {
  GOBLIN: {
    name: 'Goblin',
    health: 30,
    attackPower: 5,
    defense: 2,
    moveSpeed: 2,
    attackRange: 1.5,
    aggroRange: 8,
    experience: 20,
    color: 0x22cc22,
    scale: 0.8
  },
  TROLL: {
    name: 'Troll',
    health: 80,
    attackPower: 12,
    defense: 5,
    moveSpeed: 1.2,
    attackRange: 2,
    aggroRange: 10,
    experience: 50,
    color: 0x664422,
    scale: 1.5
  },
  SKELETON: {
    name: 'Skeleton',
    health: 40,
    attackPower: 8,
    defense: 1,
    moveSpeed: 1.8,
    attackRange: 1.8,
    aggroRange: 12,
    experience: 30,
    color: 0xdddddd,
    scale: 1
  }
};

export class Scene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private character: Character3D | null = null;
  private ground!: THREE.Mesh;
  private resizeHandler: () => void;
  private isDestroyed = false;
  private collisionObjects: THREE.Mesh[] = [];
  private lastTime: number;
  private enemies: Enemy[] = [];
  private ui: GameUI;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private lastCombatTime: number = 0;
  private combatCooldown: number = 0.5; // seconds
  private respawnTimer: number = 0;
  private respawnInterval: number = 20; // seconds
  private questSystem: QuestSystem;
  private npcs: any[] = []; // Use any type to avoid import errors
  private activeTowns: any[] = []; // Use any type to avoid import errors
  private lastInteractionTime: number = 0;
  private interactionCooldown: number = 500; // milliseconds
  private animationRunning = false;

  constructor() {
    console.log('Scene3D constructor started');
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    console.log('Scene created with background');

    // Initialize camera with better defaults for third-person view
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    this.camera.position.set(0, 5, 10); // Set initial camera position
    this.camera.lookAt(0, 0, 0);
    console.log('Camera initialized');

    // Initialize renderer with better defaults
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha
    console.log('Renderer initialized');
    
    // Initialize lastTime for animation loop
    this.lastTime = performance.now();
    
    // Initialize QuestSystem before it's used
    this.questSystem = new QuestSystem();
    
    try {
      // Create container and append renderer
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.zIndex = '0'; // Ensure proper layering
      document.body.appendChild(container);
      container.appendChild(this.renderer.domElement);
      console.log('Renderer added to DOM');

      // Start animation immediately
      this.animationRunning = true;
      this.animate();
      console.log('Animation loop started');

      // Add lights
      this.setupLights();
      console.log('Lights set up');

      // Create environment
      this.createTerrain();
      this.createBuildings();
      this.createWater();
      this.createPaths();
      this.createTrees();
      this.createLumbridgeTown();
      console.log('Environment created');

      // Initialize UI
      this.ui = new GameUI();
      console.log('UI initialized');

      // Create character with customization
      const gameState = useGameStore.getState() as GameState;
      console.log('Character customization:', gameState.characterCustomization);
      
      // Create character with customization
      this.character = new Character3D(
        this.scene, 
        this.camera, 
        this.collisionObjects,
        gameState.characterCustomization
      );
      console.log('Character created successfully');

      // Connect character to UI
      this.character.setUIElements({
        healthBar: document.querySelector('.health-bar'),
        staminaBar: document.querySelector('.stamina-bar'),
        manaBar: document.querySelector('.mana-bar'),
        levelText: document.querySelector('.level-text'),
        experienceBar: document.querySelector('.experience-bar')
      });
      console.log('Character connected to UI');

      // Spawn initial enemies
      this.spawnEnemies(5);
      console.log('Enemies spawned');

      // Handle window resize
      this.resizeHandler = () => {
        if (!this.isDestroyed) {
          this.camera.aspect = window.innerWidth / window.innerHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', this.resizeHandler);

      // Show welcome message
      this.ui.showAlert("Welcome to RuneScape RPG! Press SPACE to attack, SHIFT to dodge, B to block", 5000);
      this.ui.addCombatLogMessage("You have entered the world. NPCs in town have quests for you!");

      // Debug log
      console.log('Scene3D initialized with RPG elements');
    } catch (error) {
      console.error('Error during Scene3D initialization:', error);
      throw error;
    }
  }

  private setupLights(): void {
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffeb, 1);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    
    // Optimize shadows
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    
    // Adjust shadow camera to scene size
    const shadowSize = 100;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;
    
    this.scene.add(sunLight);
    
    // Add ambient light for better visibility in shadows
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Add hemisphere light for more natural landscape lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x556B2F, 0.6);
    this.scene.add(hemisphereLight);
  }

  private createTerrain(): void {
    // Create a larger ground plane
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
    
    // Add some subtle height variations
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Don't modify castle area
      const x = vertices[i];
      const z = vertices[i + 2];
      const distFromCenter = Math.sqrt(x * x + z * z);
      
      if (distFromCenter > 30) {
        // Increasing height variation based on distance from center
        vertices[i + 1] = (Math.sin(x * 0.05) + Math.sin(z * 0.05)) * 2;
        
        // Add some random noise
        vertices[i + 1] += Math.random() * 0.5;
      }
    }
    
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    // More realistic ground texture
    const grassTexture = new THREE.TextureLoader().load('/textures/grass.jpg');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(50, 50);
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x55aa55,
      roughness: 0.9,
      metalness: 0.0,
      map: grassTexture
    });
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  private createBuildings(): void {
    // Create and add the castle to the scene
    const castle = new Castle(this.scene);
    
    // Add castle collision objects to the scene's collision objects
    this.collisionObjects.push(...castle.getCollisionObjects());
  }

  private createWater(): void {
    // Create a river
    const riverGeometry = new THREE.PlaneGeometry(20, 200, 20, 20);
    
    // Animate water
    const waterTexture = new THREE.TextureLoader().load('/textures/water.jpg');
    waterTexture.wrapS = THREE.RepeatWrapping;
    waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.repeat.set(5, 20);
    
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0077be,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8,
      map: waterTexture
    });
    
    const river = new THREE.Mesh(riverGeometry, waterMaterial);
    river.rotation.x = -Math.PI / 2;
    river.position.set(50, 0.1, 0);
    this.scene.add(river);
    
    // Create a lake
    const lakeGeometry = new THREE.CircleGeometry(30, 32);
    const lake = new THREE.Mesh(lakeGeometry, waterMaterial);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-60, 0.1, -60);
    this.scene.add(lake);
  }

  private createPaths(): void {
    // Create path to castle
    const pathGeometry = new THREE.PlaneGeometry(6, 30, 10, 10);
    
    const pathTexture = new THREE.TextureLoader().load('/textures/path.jpg');
    pathTexture.wrapS = THREE.RepeatWrapping;
    pathTexture.wrapT = THREE.RepeatWrapping;
    pathTexture.repeat.set(2, 10);
    
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0xc2b280,
      roughness: 0.9,
      metalness: 0.0,
      map: pathTexture
    });
    
    const pathToCastle = new THREE.Mesh(pathGeometry, pathMaterial);
    pathToCastle.rotation.x = -Math.PI / 2;
    pathToCastle.position.set(0, 0.12, 35);
    this.scene.add(pathToCastle);
    
    // Create additional paths
    const path2 = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 40, 10, 10),
      pathMaterial
    );
    path2.rotation.x = -Math.PI / 2;
    path2.rotation.z = Math.PI / 4;
    path2.position.set(30, 0.12, 40);
    this.scene.add(path2);
    
    const path3 = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 50, 10, 10),
      pathMaterial
    );
    path3.rotation.x = -Math.PI / 2;
    path3.rotation.z = -Math.PI / 3;
    path3.position.set(-35, 0.12, 40);
    this.scene.add(path3);
  }

  private createTrees(): void {
    // Create forest areas
    this.createForest(-40, -30, 15, 0x1e6320); // Dark green forest
    this.createForest(60, 20, 20, 0x3a9d23);  // Light green forest
  }

  private createForest(x: number, z: number, count: number, color: number): void {
    const treePositions: THREE.Vector3[] = [];
    
    for (let i = 0; i < count; i++) {
      // Random position within the forest area
      const posX = x + (Math.random() - 0.5) * 40;
      const posZ = z + (Math.random() - 0.5) * 40;
      
      // Avoid placing trees too close to each other
      if (treePositions.some(pos => 
        Math.sqrt(Math.pow(pos.x - posX, 2) + Math.pow(pos.z - posZ, 2)) < 5
      )) {
        i--; // Try again
        continue;
      }
      
      const treePos = new THREE.Vector3(posX, 0, posZ);
      treePositions.push(treePos);
      
      // Create tree
      this.createTree(treePos, color);
    }
  }

  private createTree(position: THREE.Vector3, color: number): void {
    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.0
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, 2, position.z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.scene.add(trunk);
    
    // Create leaves
    const leavesGeometry = new THREE.ConeGeometry(3, 6, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.0
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(position.x, 6, position.z);
    leaves.castShadow = true;
    this.scene.add(leaves);
    
    // Add to collision objects
    this.collisionObjects.push(trunk);
  }

  private spawnEnemies(count: number): void {
    const enemyTypes = Object.keys(ENEMY_TYPES);
    
    for (let i = 0; i < count; i++) {
      // Choose random enemy type
      const enemyType = ENEMY_TYPES[enemyTypes[Math.floor(Math.random() * enemyTypes.length)]];
      
      // Choose random position away from castle and player
      let x, z;
      let validPosition = false;
      
      while (!validPosition) {
        // Random position within a radius of 50-100 units from center
        const angle = Math.random() * Math.PI * 2;
        const radius = 50 + Math.random() * 50;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        
        // Check if far enough from player and other enemies
        const playerPos = this.character?.getPosition() || new THREE.Vector3();
        const distToPlayer = Math.sqrt(Math.pow(x - playerPos.x, 2) + Math.pow(z - playerPos.z, 2));
        
        // Ensure enemy is at least 20 units from player
        if (distToPlayer > 20) {
          validPosition = true;
          
          // Also check distance from other enemies
          for (const enemy of this.enemies) {
            const enemyPos = enemy.getPosition();
            const distToEnemy = Math.sqrt(Math.pow(x - enemyPos.x, 2) + Math.pow(z - enemyPos.z, 2));
            
            if (distToEnemy < 10) {
              validPosition = false;
              break;
            }
          }
        }
      }
      
      // Create and add enemy
      const enemy = new Enemy(
        new THREE.Vector3(x, 0, z),
        this.scene,
        enemyType,
        this.collisionObjects
      );
      
      this.enemies.push(enemy);
      console.log(`Spawned ${enemyType.name} at (${x}, 0, ${z})`);
      this.ui.addCombatLogMessage(`A ${enemyType.name} has appeared!`);
    }
  }

  private animate(): void {
    if (this.isDestroyed) return;

    try {
      // Request next frame
      requestAnimationFrame(this.animate.bind(this));
      
      // Calculate delta time for consistent animation speed
      const currentTime = performance.now();
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap delta time to avoid large jumps
      this.lastTime = currentTime;
      
      // Update game components
      if (this.character) {
        this.character.update(deltaTime);
        
        // Get player position for enemy updates
        const playerPosition = this.character.getPosition();
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          
          // Only update if alive
          if (enemy.isAlive()) {
            enemy.update(deltaTime, playerPosition);
            
            // Check for combat
            this.checkCombat(enemy, playerPosition, deltaTime);
          }
        }
        
        // Clean up dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.isAlive());
        
        // Update NPCs and check for player interactions
        this.updateNPCs(playerPosition, deltaTime);
      }
      
      // Respawn timer
      this.respawnTimer += deltaTime;
      if (this.respawnTimer >= this.respawnInterval) {
        this.respawnTimer = 0;
        const newEnemyCount = Math.max(0, 10 - this.enemies.length);
        if (newEnemyCount > 0) {
          this.spawnEnemies(newEnemyCount);
        }
      }
      
      // Render the scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      } else {
        console.error('Unable to render: missing renderer, scene, or camera');
      }
    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  }

  private checkCombat(enemy: Enemy, playerPosition: THREE.Vector3, delta: number): void {
    // Get distance to player
    const distToPlayer = enemy.getPosition().distanceTo(playerPosition);
    
    // Check if enemy is in range to attack player
    if (distToPlayer < enemy.getAttackRange()) {
      // Check combat cooldown
      const currentTime = performance.now() / 1000;
      if (currentTime - this.lastCombatTime > this.combatCooldown) {
        this.lastCombatTime = currentTime;
        
        // Enemy attacks player
        if (!this.character?.isPlayerDodging()) {
          const damage = enemy.getAttackPower();
          this.character?.takeDamage(damage);
          
          // Log the attack
          this.ui.addCombatLogMessage(`${enemy.getType()} hits you for ${damage} damage!`);
          
          // Convert 3D position to screen position for damage indicator
          const screenPosition = this.worldToScreen(playerPosition);
          this.ui.showDamageIndicator(damage, true, screenPosition);
        } else {
          // Player dodged
          this.ui.addCombatLogMessage(`You dodged ${enemy.getType()}'s attack!`);
        }
      }
    }
    
    // Check if player is attacking and in range of enemy
    if (this.character?.isPlayerAttacking()) {
      if (distToPlayer < this.character.getAttackRange()) {
        // Apply damage to enemy
        enemy.takeDamage(this.character.getAttackPower());
        
        // Log the attack
        this.ui.addCombatLogMessage(`You hit ${enemy.getType()} for ${this.character.getAttackPower()} damage!`);
        
        // Convert 3D position to screen position for damage indicator
        const screenPosition = this.worldToScreen(enemy.getPosition());
        this.ui.showDamageIndicator(this.character.getAttackPower(), false, screenPosition);
        
        // Check if enemy died and award experience
        if (!enemy.isAlive()) {
          const expGained = enemy.getExperienceValue();
          this.character.gainExperience(expGained);
          this.ui.addCombatLogMessage(`You defeated ${enemy.getType()} and gained ${expGained} experience!`);
        }
      }
    }
  }

  private worldToScreen(position: THREE.Vector3): { x: number, y: number } {
    // Convert 3D position to screen position
    const vector = position.clone();
    vector.project(this.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    return { x, y };
  }

  private createLumbridgeTown(): void {
    try {
      // Create town at position near the castle but not too close
      const townPosition = new THREE.Vector3(50, 0, 50);
      const town = new Town(this.scene, townPosition, this.collisionObjects);
      
      // Add town collision objects to the scene
      town.getCollisionObjects().forEach((obj: any) => {
        this.collisionObjects.push(obj);
      });
      
      this.activeTowns.push(town);
      
      // Create path from castle to town
      this.createPathBetweenPoints(
        new THREE.Vector2(0, 25), // Castle entrance
        new THREE.Vector2(townPosition.x, townPosition.z), // Town center
        10, // Path width
        0.2 // Path height
      );
      
      // Create NPCs
      this.createTownNPCs(townPosition);
    } catch (error) {
      console.error("Error creating Lumbridge town:", error);
    }
  }
  
  private createPathBetweenPoints(start: THREE.Vector2, end: THREE.Vector2, width: number, height: number): void {
    // Calculate path direction and length
    const direction = new THREE.Vector2().subVectors(end, start).normalize();
    const length = start.distanceTo(end);
    
    // Create path geometry
    const pathGeometry = new THREE.PlaneGeometry(width, length);
    const pathTexture = new THREE.TextureLoader().load('/textures/path.jpg');
    pathTexture.wrapS = THREE.RepeatWrapping;
    pathTexture.wrapT = THREE.RepeatWrapping;
    pathTexture.repeat.set(2, Math.floor(length / 10));
    
    const pathMaterial = new THREE.MeshStandardMaterial({
      map: pathTexture,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    
    // Position and rotate path
    path.rotation.x = -Math.PI / 2;
    path.position.y = height;
    
    // Calculate the angle to rotate the path
    const angle = Math.atan2(direction.y, direction.x);
    path.rotation.z = angle - Math.PI / 2;
    
    // Calculate the midpoint for positioning
    const midpoint = new THREE.Vector2().addVectors(
      start,
      new THREE.Vector2().subVectors(end, start).multiplyScalar(0.5)
    );
    
    path.position.x = midpoint.x;
    path.position.z = midpoint.y;
    
    this.scene.add(path);
  }
  
  private createTownNPCs(townPosition: THREE.Vector3): void {
    // Create the Mayor
    const mayorPos = new THREE.Vector3(townPosition.x + 15, 0, townPosition.z - 10);
    const mayorDialogue = new Map<string, DialogueOption[]>();
    
    mayorDialogue.set('default', [
      {
        text: "What's happening in the town?",
        response: "We've been having problems with goblins attacking from the nearby forest. Can you help us?"
      },
      {
        text: "Tell me about Lumbridge.",
        response: "Lumbridge is a peaceful town that was established 200 years ago. We are known for our fine crafting and agriculture."
      },
      {
        text: "I'm looking for work.",
        response: "We could use help defending our town from goblins.",
        action: () => {
          // Offer the town defense quest
          const quest = this.questSystem.getQuest('quest_town_defense');
          if (quest && !quest.accepted && !quest.completed) {
            this.ui?.showQuestOffer(
              quest,
              () => {
                this.questSystem.acceptQuest('quest_town_defense');
                this.ui?.updateActiveQuests(this.questSystem.getActiveQuests());
                this.ui?.addCombatLogMessage('New quest accepted: Town Defense');
              },
              () => {
                // Declined quest
                this.ui?.addCombatLogMessage('Quest declined');
              }
            );
          }
        }
      }
    ]);
    
    const mayor = new NPC(
      this.scene,
      mayorPos,
      "Mayor Harlow",
      'mayor',
      mayorDialogue,
      this.questSystem.getQuestsByGiver('Mayor')
    );
    
    this.npcs.push(mayor);
    
    // Create the Shopkeeper
    const shopkeeperPos = new THREE.Vector3(townPosition.x - 12, 0, townPosition.z - 10);
    const shopkeeperDialogue = new Map<string, DialogueOption[]>();
    
    shopkeeperDialogue.set('default', [
      {
        text: "What do you sell?",
        response: "I have potions, food, and basic equipment. Take a look at my wares!"
      },
      {
        text: "Any special items today?",
        response: "I've got some fresh health potions just brewed this morning!"
      },
      {
        text: "Need any deliveries made?",
        response: "Actually, I do need a package delivered to the blacksmith. Would you be willing to help?",
        action: () => {
          // Offer the delivery quest
          const quest = this.questSystem.getQuest('quest_delivery');
          if (quest && !quest.accepted && !quest.completed) {
            this.ui?.showQuestOffer(
              quest,
              () => {
                this.questSystem.acceptQuest('quest_delivery');
                this.ui?.updateActiveQuests(this.questSystem.getActiveQuests());
                this.ui?.addCombatLogMessage('New quest accepted: Special Delivery');
              },
              () => {
                // Declined quest
                this.ui?.addCombatLogMessage('Quest declined');
              }
            );
          }
        }
      },
      {
        text: "Heard any rumors lately?",
        response: "There are some rare glowing mushrooms in the forest that have magical properties. I'd pay well for some of those!"
      }
    ]);
    
    const shopkeeper = new NPC(
      this.scene,
      shopkeeperPos,
      "Shopkeeper Morgan",
      'shopkeeper',
      shopkeeperDialogue,
      this.questSystem.getQuestsByGiver('Shopkeeper')
    );
    
    this.npcs.push(shopkeeper);
    
    // Create the Combat Instructor
    const instructorPos = new THREE.Vector3(townPosition.x, 0, townPosition.z + 15);
    const instructorDialogue = new Map<string, DialogueOption[]>();
    
    instructorDialogue.set('default', [
      {
        text: "Can you teach me how to fight?",
        response: "Of course! The best way to learn is by doing. I've set up some training dummies for practice."
      },
      {
        text: "What combat techniques should I know?",
        response: "Remember to use space to attack, shift to dodge, and 'B' to block. Timing is everything in combat!"
      },
      {
        text: "I want to train with you.",
        response: "Excellent! Start by defeating some training dummies to get a feel for combat.",
        action: () => {
          // Offer the tutorial quest
          const quest = this.questSystem.getQuest('quest_tutorial');
          if (quest && !quest.accepted && !quest.completed) {
            this.ui?.showQuestOffer(
              quest,
              () => {
                this.questSystem.acceptQuest('quest_tutorial');
                this.ui?.updateActiveQuests(this.questSystem.getActiveQuests());
                this.ui?.addCombatLogMessage('New quest accepted: Welcome to Lumbridge');
              },
              () => {
                // Declined quest
                this.ui?.addCombatLogMessage('Quest declined');
              }
            );
          }
        }
      }
    ]);
    
    const instructor = new NPC(
      this.scene,
      instructorPos,
      "Combat Instructor Taryn",
      'instructor',
      instructorDialogue,
      this.questSystem.getQuestsByGiver('Combat Instructor')
    );
    
    this.npcs.push(instructor);
  }

  private updateNPCs(playerPosition: THREE.Vector3, delta: number): void {
    // Interaction distance
    const interactionDistance = 3;
    
    this.npcs.forEach(npc => {
      // Update NPC
      npc.update(delta);
      
      // Check if player is in range for interaction
      const distanceToPlayer = npc.getPosition().distanceTo(playerPosition);
      
      if (distanceToPlayer < interactionDistance) {
        // Show interaction prompt if not already showing
        if (!npc.isInteracting()) {
          this.ui.showInteractionPrompt(npc.getName(), "Press E to talk");
          
          // Check for interaction key (E)
          if (this.character && this.character.getKeys()['e']) {
            npc.interact();
            
            // Show dialogue
            this.ui.showDialogue(npc.getName(), npc.getDialogue());
            
            // If NPC is a quest giver, check for available quests
            if (npc.isQuestGiver()) {
              const availableQuests = this.questSystem.getQuestsForNPC(npc.getName());
              if (availableQuests.length > 0) {
                this.ui.showQuestOffer(availableQuests[0]);
              }
            }
          }
        }
      } else {
        // Remove interaction prompt if character moves away
        if (npc.isInteracting()) {
          npc.endInteraction();
          this.ui.hideInteractionPrompt();
          this.ui.hideDialogue();
        }
      }
    });
  }

  private checkNPCInteractions(): void {
    if (!this.character) return;
    
    const currentTime = Date.now();
    if (currentTime - this.lastInteractionTime < this.interactionCooldown) return;
    
    const playerPosition = this.character.getPosition();
    
    // Check if player is near any NPC
    for (const npc of this.npcs) {
      const npcPosition = npc.getPosition();
      const distance = playerPosition.distanceTo(npcPosition);
      
      if (distance <= npc.getInteractionRadius()) {
        // Show interaction prompt
        this.ui?.showInteractionPrompt();
        
        // Check if player presses interaction key
        if (this.character.isInteractionKeyPressed()) {
          this.lastInteractionTime = currentTime;
          
          // Show dialogue options
          this.ui?.showDialogue(npc.getName(), npc.getDialogueOptions());
          
          // Check if NPC has available quests
          if (npc.hasActiveQuests()) {
            this.questSystem.onNPCInteraction(npc.getName());
          }
          
          break;
        }
      } else {
        // Hide interaction prompt
        this.ui?.hideInteractionPrompt();
        this.ui?.hideDialogue();
      }
    }
  }

  public update(): void {
    // This method is called by the game loop
    // We don't need to do anything here since we have our own animation loop
    // Just ensure the scene isn't destroyed
    if (!this.isDestroyed && this.renderer && this.scene && this.camera) {
      // Make sure animation is running
      if (!this.animationRunning) {
        console.log('Restarting animation loop');
        this.animationRunning = true;
        this.lastTime = performance.now();
        this.animate();
      }
    }
  }

  public destroy(): void {
    console.log('Destroying Scene3D');
    this.isDestroyed = true;
    this.animationRunning = false;
    
    // Remove event listeners
    window.removeEventListener('resize', this.resizeHandler);
    
    // Dispose of renderer
    if (this.renderer) {
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
    
    // Clean up Three.js resources
    this.cleanupThreeJSResources();
    
    console.log('Scene3D destroyed');
  }
  
  private cleanupThreeJSResources(): void {
    // Clean up scene objects
    if (this.scene) {
      while(this.scene.children.length > 0) { 
        const object = this.scene.children[0];
        this.scene.remove(object);
        
        // Dispose of meshes
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      }
    }
  }

  private showQuestOffer(quest: any, onAccept: () => void, onDecline: () => void): void {
    // Implementation of UI to show quest offer
    
    // Mock implementation for now
    const acceptQuest = confirm(`Would you like to accept the quest "${quest.title}"?\n\n${quest.description}`);
    if (acceptQuest) {
      onAccept();
    } else {
      onDecline();
    }
  }
} 