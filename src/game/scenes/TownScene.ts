import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import { Town } from '../environment/Town';
import { QuestSystem } from '../systems/QuestSystem';
import { NPC, DialogueOption } from '../entities/NPC';

export class TownScene extends Scene3D {
  private townQuestSystem: QuestSystem;
  private townNpcs: NPC[] = [];
  private townActiveTowns: Town[] = [];
  private townLastInteractionTime: number = 0;
  private townInteractionCooldown: number = 500; // milliseconds

  constructor() {
    super();

    // Initialize our own quest system
    this.townQuestSystem = new QuestSystem();
    console.log('TownScene QuestSystem initialized');

    try {
      // Add additional setup
      this.createLumbridgeTown();
      console.log('Lumbridge town created in TownScene');
    } catch (error) {
      console.error('Error creating Lumbridge town:', error);
    }

    // Set up key bindings for quest UI
    window.addEventListener('keydown', (event) => {
      // Press J to toggle quest log
      if (event.key.toLowerCase() === 'j' && this.ui) {
        try {
          // Use the toggleActiveQuestsPanel method if available
          if ('toggleActiveQuestsPanel' in this.ui) {
            (this.ui as any).toggleActiveQuestsPanel();
          }
          // Otherwise, use updateActiveQuests
          else if (this.townQuestSystem) {
            this.ui.updateActiveQuests(this.townQuestSystem.getActiveQuests());
          }
        } catch (error) {
          console.error('Error handling quest UI interaction:', error);
        }
      }
    });
  }

  public override animate(): void {
    try {
      super.animate(); // Call parent animate method
      
      // Additional town-specific animations
      this.checkNPCInteractions();
    } catch (error) {
      console.error('Error in TownScene animate:', error);
    }
  }

  private createLumbridgeTown(): void {
    // Create town at position near the castle but not too close
    const townPosition = new THREE.Vector3(50, 0, 50);
    const town = new Town(this.scene, townPosition, this.collisionObjects);
    
    // Add town collision objects to the scene
    town.getCollisionObjects().forEach(obj => {
      this.collisionObjects.push(obj);
    });
    
    this.townActiveTowns.push(town);
    
    // Create path from castle to town
    this.createPathBetweenPoints(
      new THREE.Vector2(0, 25), // Castle entrance
      new THREE.Vector2(townPosition.x, townPosition.z), // Town center
      10, // Path width
      0.2 // Path height
    );
    
    // Create NPCs
    this.createTownNPCs(townPosition);
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
          const quest = this.townQuestSystem.getQuest('quest_town_defense');
          if (quest && !quest.isAccepted() && !quest.isCompleted()) {
            if (this.ui) {
              this.ui.showQuestOffer(
                quest,
                () => {
                  this.townQuestSystem.acceptQuest('quest_town_defense');
                  if (this.ui) {
                    this.ui.updateActiveQuests(this.townQuestSystem.getActiveQuests());
                    this.ui.addCombatLogMessage('New quest accepted: Town Defense');
                  }
                },
                () => {
                  // Declined quest
                  if (this.ui) {
                    this.ui.addCombatLogMessage('Quest declined');
                  }
                }
              );
            }
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
      this.townQuestSystem.getQuestsByGiver('Mayor')
    );
    
    this.townNpcs.push(mayor);
    
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
          const quest = this.townQuestSystem.getQuest('quest_delivery');
          if (quest && !quest.isAccepted() && !quest.isCompleted()) {
            if (this.ui) {
              this.ui.showQuestOffer(
                quest,
                () => {
                  this.townQuestSystem.acceptQuest('quest_delivery');
                  if (this.ui) {
                    this.ui.updateActiveQuests(this.townQuestSystem.getActiveQuests());
                    this.ui.addCombatLogMessage('New quest accepted: Special Delivery');
                  }
                },
                () => {
                  // Declined quest
                  if (this.ui) {
                    this.ui.addCombatLogMessage('Quest declined');
                  }
                }
              );
            }
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
      this.townQuestSystem.getQuestsByGiver('Shopkeeper')
    );
    
    this.townNpcs.push(shopkeeper);
    
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
          const quest = this.townQuestSystem.getQuest('quest_tutorial');
          if (quest && !quest.isAccepted() && !quest.isCompleted()) {
            if (this.ui) {
              this.ui.showQuestOffer(
                quest,
                () => {
                  this.townQuestSystem.acceptQuest('quest_tutorial');
                  if (this.ui) {
                    this.ui.updateActiveQuests(this.townQuestSystem.getActiveQuests());
                    this.ui.addCombatLogMessage('New quest accepted: Welcome to Lumbridge');
                  }
                },
                () => {
                  // Declined quest
                  if (this.ui) {
                    this.ui.addCombatLogMessage('Quest declined');
                  }
                }
              );
            }
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
      this.townQuestSystem.getQuestsByGiver('Combat Instructor')
    );
    
    this.townNpcs.push(instructor);
  }

  private checkNPCInteractions(): void {
    if (!this.character) return;
    
    const currentTime = Date.now();
    if (currentTime - this.townLastInteractionTime < this.townInteractionCooldown) return;
    
    const playerPosition = this.character.getPosition();
    
    // Check if player is near any NPC
    for (const npc of this.townNpcs) {
      const npcPosition = npc.getPosition();
      const distance = playerPosition.distanceTo(npcPosition);
      
      if (distance <= npc.getInteractionRadius()) {
        // Show interaction prompt
        if (this.ui) {
          this.ui.showInteractionPrompt();
        }
        
        // Check if player presses interaction key
        if (this.character.isInteractionKeyPressed()) {
          this.townLastInteractionTime = currentTime;
          
          // Show dialogue options
          if (this.ui) {
            this.ui.showDialogue(npc.getName(), npc.getDialogueOptions());
          }
          
          // Check if NPC has available quests
          if (npc.hasActiveQuests()) {
            this.townQuestSystem.onNPCInteraction(npc.getName());
          }
          
          break;
        }
      } else {
        // Hide interaction prompt
        if (this.ui) {
          this.ui.hideInteractionPrompt();
          this.ui.hideDialogue();
        }
      }
    }
  }

  // Handle quest updates when an enemy is killed
  protected override onEnemyKilled(enemy: any): void {
    super.onEnemyKilled(enemy);
    
    // Update quest progress
    this.townQuestSystem.onEnemyKilled(enemy);
    
    // Update quest UI
    if (this.ui) {
      this.ui.updateActiveQuests(this.townQuestSystem.getActiveQuests());
    }
  }

  // Override parent destroy to clean up additional resources
  public override destroy(): void {
    super.destroy();
    
    // Clean up town-specific resources
    this.townNpcs.forEach(npc => {
      npc.dispose();
    });
  }
} 