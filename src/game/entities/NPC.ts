import * as THREE from 'three';
import { Quest } from '../systems/QuestSystem';

export type NPCType = 'mayor' | 'shopkeeper' | 'guard' | 'villager' | 'instructor';

export interface DialogueOption {
  text: string;
  response: string;
  action?: () => void;
}

export class NPC {
  private mesh: THREE.Group;
  private nameMesh: THREE.Sprite;
  private dialogues: Map<string, DialogueOption[]>;
  private quests: Quest[];
  private position: THREE.Vector3;
  private interactionRadius: number;
  private name: string;
  private type: NPCType;
  private currentDialogue: string | null = null;
  private interacting: boolean = false;

  constructor(
    scene: THREE.Scene, 
    position: THREE.Vector3, 
    name: string, 
    type: NPCType,
    dialogues: Map<string, DialogueOption[]> = new Map(),
    quests: Quest[] = []
  ) {
    this.position = position;
    this.name = name;
    this.type = type;
    this.dialogues = dialogues;
    this.quests = quests;
    this.interactionRadius = 5;
    
    // Create NPC mesh
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    
    // Create basic NPC body
    this.createNPCMesh();
    
    // Create floating name tag
    this.nameMesh = this.createNameTag();
    this.mesh.add(this.nameMesh);
    
    // Add to scene
    scene.add(this.mesh);
  }
  
  private createNPCMesh(): void {
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.7, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getColorByType(),
      roughness: 0.7,
      metalness: 0.3
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.85;
    this.mesh.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac, // Skin tone
      roughness: 0.5,
      metalness: 0.1
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2;
    this.mesh.add(head);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: this.getColorByType(),
      roughness: 0.7,
      metalness: 0.3
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.65, 1.1, 0);
    leftArm.rotation.z = Math.PI / 12;
    this.mesh.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.65, 1.1, 0);
    rightArm.rotation.z = -Math.PI / 12;
    this.mesh.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark pants
      roughness: 0.7,
      metalness: 0.2
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, 0.4, 0);
    this.mesh.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, 0.4, 0);
    this.mesh.add(rightLeg);
    
    // Add specific features based on NPC type
    this.addSpecificFeatures();
  }
  
  private addSpecificFeatures(): void {
    switch(this.type) {
      case 'mayor':
        // Add a hat
        const hatGeometry = new THREE.CylinderGeometry(0.45, 0.6, 0.3, 8);
        const hatMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333, // Dark hat
          roughness: 0.5,
          metalness: 0.3
        });
        
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 2.35;
        this.mesh.add(hat);
        break;
        
      case 'shopkeeper':
        // Add apron
        const apronGeometry = new THREE.BoxGeometry(1.1, 1, 0.1);
        const apronMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513, // Brown apron
          roughness: 0.8,
          metalness: 0.1
        });
        
        const apron = new THREE.Mesh(apronGeometry, apronMaterial);
        apron.position.set(0, 0.9, 0.3);
        this.mesh.add(apron);
        break;
        
      case 'guard':
        // Add helmet
        const helmetGeometry = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const helmetMaterial = new THREE.MeshStandardMaterial({
          color: 0xa9a9a9, // Silver helmet
          roughness: 0.4,
          metalness: 0.8
        });
        
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 2.2;
        this.mesh.add(helmet);
        
        // Add sword
        const swordHandleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const swordHandleMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513, // Brown handle
          roughness: 0.8,
          metalness: 0.2
        });
        
        const swordHandle = new THREE.Mesh(swordHandleGeometry, swordHandleMaterial);
        swordHandle.position.set(0.8, 0.8, 0);
        swordHandle.rotation.z = Math.PI / 2;
        this.mesh.add(swordHandle);
        
        const swordBladeGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.05);
        const swordBladeMaterial = new THREE.MeshStandardMaterial({
          color: 0xa9a9a9, // Silver blade
          roughness: 0.4,
          metalness: 0.8
        });
        
        const swordBlade = new THREE.Mesh(swordBladeGeometry, swordBladeMaterial);
        swordBlade.position.set(1.35, 0.8, 0);
        this.mesh.add(swordBlade);
        break;
        
      case 'instructor':
        // Add a combat staff
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        const staffMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513, // Brown staff
          roughness: 0.8,
          metalness: 0.2
        });
        
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(0.5, 1.2, 0);
        staff.rotation.z = Math.PI / 12;
        this.mesh.add(staff);
        
        // Add headband
        const headbandGeometry = new THREE.TorusGeometry(0.42, 0.05, 8, 24, Math.PI * 2);
        const headbandMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000, // Red headband
          roughness: 0.7,
          metalness: 0.3
        });
        
        const headband = new THREE.Mesh(headbandGeometry, headbandMaterial);
        headband.position.y = 2.1;
        this.mesh.add(headband);
        break;
    }
  }
  
  private createNameTag(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = '24px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(this.name, canvas.width / 2, canvas.height / 2 + 8);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.y = 2.8;
    sprite.scale.set(2, 0.5, 1);
    
    return sprite;
  }
  
  private getColorByType(): number {
    switch(this.type) {
      case 'mayor':
        return 0x4682b4; // Steel blue for mayor
      case 'shopkeeper':
        return 0x228b22; // Forest green for shopkeeper
      case 'guard':
        return 0x8b0000; // Dark red for guard
      case 'instructor':
        return 0xb8860b; // Dark goldenrod for instructor
      case 'villager':
      default:
        return 0xa0522d; // Sienna for regular villagers
    }
  }
  
  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  public getInteractionRadius(): number {
    return this.interactionRadius;
  }
  
  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  public getName(): string {
    return this.name;
  }
  
  public getType(): NPCType {
    return this.type;
  }
  
  public getDialogueOptions(dialogueKey: string = 'default'): DialogueOption[] {
    return this.dialogues.get(dialogueKey) || [];
  }
  
  public setCurrentDialogue(dialogueKey: string | null): void {
    this.currentDialogue = dialogueKey;
  }
  
  public getCurrentDialogue(): string | null {
    return this.currentDialogue;
  }
  
  public hasActiveQuests(): boolean {
    return this.quests.some(quest => !quest.isCompleted());
  }
  
  public getAvailableQuests(): Quest[] {
    return this.quests.filter(quest => !quest.isAccepted() && !quest.isCompleted());
  }
  
  public getActiveQuests(): Quest[] {
    return this.quests.filter(quest => quest.isAccepted() && !quest.isCompleted());
  }
  
  public addQuest(quest: Quest): void {
    this.quests.push(quest);
  }
  
  public update(): void {
    // Optional: Add animations or movements
    // For example, rotate slightly to face player when interacting
  }
  
  public dispose(): void {
    // Clean up resources
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    
    if (this.nameMesh.material) {
      if (Array.isArray(this.nameMesh.material)) {
        this.nameMesh.material.forEach(material => material.dispose());
      } else {
        this.nameMesh.material.dispose();
      }
    }
  }
  
  public interact(): void {
    this.interacting = true;
    console.log(`Interacting with ${this.name}`);
  }
  
  public endInteraction(): void {
    this.interacting = false;
    console.log(`Ended interaction with ${this.name}`);
  }
  
  public isInteracting(): boolean {
    return this.interacting;
  }
  
  public getDialogue(): string[] {
    // Return default dialogue options as strings
    if (this.dialogues.has('default')) {
      const options = this.dialogues.get('default') || [];
      return options.map(option => option.text);
    }
    return [`Hello, I'm ${this.name}.`];
  }
  
  public getResponse(option: string): string {
    // Find the response for the given option
    for (const [key, options] of this.dialogues.entries()) {
      for (const opt of options) {
        if (opt.text === option) {
          // Execute action if it exists
          if (opt.action) {
            opt.action();
          }
          return opt.response;
        }
      }
    }
    return "I don't have anything to say about that.";
  }
  
  public isQuestGiver(): boolean {
    return this.quests.length > 0;
  }
} 