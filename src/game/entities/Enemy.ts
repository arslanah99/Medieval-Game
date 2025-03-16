import * as THREE from 'three';
import { Character3D } from './Character3D';

export interface EnemyType {
  name: string;
  health: number;
  attackPower: number;
  defense: number;
  moveSpeed: number;
  attackRange: number;
  aggroRange: number;
  experience: number;
  color: number; // Color as hex
  scale: number;
}

export class Enemy {
  private mesh: THREE.Group = new THREE.Group();
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private currentVelocity: THREE.Vector3 = new THREE.Vector3();
  private isAggro: boolean = false;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 2; // seconds
  private hitEffect?: THREE.Points;
  private effectsParent: THREE.Group = new THREE.Group();
  private healthBarMesh?: THREE.Mesh;
  private isDead: boolean = false;
  private type: EnemyType;
  private bodyMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private collisionObjects: THREE.Mesh[] = [];

  // Enemy stats
  private currentHealth: number;
  private maxHealth: number;
  private attackPower: number;
  private defense: number;
  private moveSpeed: number;
  private attackRange: number;
  private aggroRange: number;
  private experienceValue: number;

  constructor(
    position: THREE.Vector3,
    scene: THREE.Scene,
    type: EnemyType,
    collisionObjects: THREE.Mesh[] = []
  ) {
    this.type = type;
    
    // Set enemy stats from type
    this.maxHealth = type.health;
    this.currentHealth = this.maxHealth;
    this.attackPower = type.attackPower;
    this.defense = type.defense;
    this.moveSpeed = type.moveSpeed;
    this.attackRange = type.attackRange;
    this.aggroRange = type.aggroRange;
    this.experienceValue = type.experience;
    
    // Filter collision objects
    this.collisionObjects = collisionObjects.filter(obj => 
      !(obj.geometry instanceof THREE.PlaneGeometry)
    );
    
    // Create enemy mesh
    this.createEnemyMesh(type);
    
    // Set initial position
    this.mesh.position.copy(position);
    
    // Setup effects group
    this.effectsParent = new THREE.Group();
    scene.add(this.effectsParent);
    
    // Add to scene
    scene.add(this.mesh);
    
    // Create health bar
    this.createHealthBar();
  }
  
  private createEnemyMesh(type: EnemyType): void {
    // Create body
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: type.color,
      roughness: 0.7,
      metalness: 0.3
    });
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.position.y = 1;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);
    
    // Create head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: type.color,
      roughness: 0.5,
      metalness: 0.5
    });
    this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
    this.headMesh.position.y = 2.4;
    this.headMesh.castShadow = true;
    this.mesh.add(this.headMesh);
    
    // Create arms
    const armGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: type.color,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 1.5, 0);
    leftArm.castShadow = true;
    this.mesh.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 1.5, 0);
    rightArm.castShadow = true;
    this.mesh.add(rightArm);
    
    // Create legs
    const legGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: type.color,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.25, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.25, 0);
    rightLeg.castShadow = true;
    this.mesh.add(rightLeg);
    
    // Scale the enemy based on type
    this.mesh.scale.set(type.scale, type.scale, type.scale);
  }
  
  private createHealthBar(): void {
    // Create health bar background
    const bgGeometry = new THREE.PlaneGeometry(1.2, 0.2);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.y = 3;
    
    // Create health bar foreground
    const fgGeometry = new THREE.PlaneGeometry(1, 0.15);
    const fgMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide
    });
    this.healthBarMesh = new THREE.Mesh(fgGeometry, fgMaterial);
    this.healthBarMesh.position.z = 0.01;
    
    background.add(this.healthBarMesh);
    this.mesh.add(background);
    
    // Health bar always faces camera
    background.rotation.x = Math.PI / 2;
  }
  
  public update(delta: number, playerPosition: THREE.Vector3): void {
    if (this.isDead) return;
    
    // Calculate distance to player
    const distToPlayer = this.mesh.position.distanceTo(playerPosition);
    
    // Update health bar - make it face the camera
    this.updateHealthBar();
    
    // Check if player is in aggro range
    if (distToPlayer < this.aggroRange) {
      this.isAggro = true;
    }
    
    if (this.isAggro) {
      // Move towards player
      this.targetPosition.copy(playerPosition);
      
      // Calculate movement direction
      const direction = new THREE.Vector3().subVectors(this.targetPosition, this.mesh.position).normalize();
      
      // Apply movement with physics
      this.currentVelocity.x = direction.x * this.moveSpeed * delta;
      this.currentVelocity.z = direction.z * this.moveSpeed * delta;
      
      // Calculate new position
      const newPosition = this.mesh.position.clone();
      newPosition.add(this.currentVelocity);
      
      // Check for collisions
      if (!this.checkCollision(newPosition)) {
        this.mesh.position.copy(newPosition);
      }
      
      // Make enemy face the player
      this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
      
      // Attack if player is in range
      if (distToPlayer < this.attackRange) {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastAttackTime > this.attackCooldown) {
          this.attack();
          this.lastAttackTime = currentTime;
        }
      }
    }
  }
  
  private updateHealthBar(): void {
    if (!this.healthBarMesh) return;
    
    // Update health bar width based on current health
    const healthPercent = this.currentHealth / this.maxHealth;
    this.healthBarMesh.scale.x = healthPercent;
    
    // Adjust position to keep the bar's left side anchored
    this.healthBarMesh.position.x = -0.5 + (healthPercent * 0.5);
  }
  
  private checkCollision(newPosition: THREE.Vector3): boolean {
    // Create bounding box for collision detection
    const enemyBoundingBox = new THREE.Box3();
    const scaledSize = this.type.scale * 0.4; // Scale based on enemy size
    
    enemyBoundingBox.min.set(
      newPosition.x - scaledSize,
      newPosition.y,
      newPosition.z - scaledSize
    );
    
    enemyBoundingBox.max.set(
      newPosition.x + scaledSize,
      newPosition.y + (2.5 * this.type.scale), // Scaled height
      newPosition.z + scaledSize
    );
    
    for (const object of this.collisionObjects) {
      const objectBoundingBox = new THREE.Box3().setFromObject(object);
      if (enemyBoundingBox.intersectsBox(objectBoundingBox)) {
        return true;
      }
    }
    return false;
  }
  
  private attack(): void {
    // This method would be called by the game system to check if player is hit
    console.log(`${this.type.name} attacks!`);
    
    // Flash enemy red to indicate attack
    if (this.bodyMesh && this.bodyMesh.material) {
      const material = this.bodyMesh.material as THREE.MeshStandardMaterial;
      const originalColor = material.color.clone();
      
      // Flash red
      material.color.set(0xff0000);
      
      // Return to original color
      setTimeout(() => {
        material.color.copy(originalColor);
      }, 200);
    }
  }
  
  public takeDamage(amount: number): void {
    if (this.isDead) return;
    
    // Apply defense reduction
    const actualDamage = Math.max(1, amount - this.defense);
    this.currentHealth -= actualDamage;
    
    console.log(`${this.type.name} takes ${actualDamage} damage! HP: ${this.currentHealth}/${this.maxHealth}`);
    
    // Flash enemy white to indicate hit
    if (this.bodyMesh && this.bodyMesh.material) {
      const material = this.bodyMesh.material as THREE.MeshStandardMaterial;
      const originalColor = material.color.clone();
      
      // Flash white
      material.color.set(0xffffff);
      
      // Return to original color
      setTimeout(() => {
        material.color.copy(originalColor);
      }, 100);
    }
    
    // Update health bar
    this.updateHealthBar();
    
    // Check if enemy died
    if (this.currentHealth <= 0) {
      this.die();
    }
  }
  
  public die(): void {
    if (this.isDead) return;
    
    this.isDead = true;
    console.log(`${this.type.name} died!`);
    
    // Play death animation (fall over)
    const deathDuration = 1.0;
    const startTime = performance.now() / 1000;
    
    const animateDeathFrame = () => {
      const currentTime = performance.now() / 1000;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / deathDuration, 1);
      
      // Rotate to fall over
      this.mesh.rotation.x = progress * (Math.PI / 2);
      
      // Sink into the ground
      this.mesh.position.y = Math.max(0, 1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animateDeathFrame);
      } else {
        // Remove after animation completes
        setTimeout(() => {
          this.remove();
        }, 1000);
      }
    };
    
    animateDeathFrame();
  }
  
  public remove(): void {
    // Clean up meshes and resources
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    // Remove from parent
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    // Clean up effects
    if (this.effectsParent.parent) {
      this.effectsParent.parent.remove(this.effectsParent);
    }
  }
  
  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
  
  public getExperienceValue(): number {
    return this.experienceValue;
  }
  
  public getAttackPower(): number {
    return this.attackPower;
  }
  
  public getAttackRange(): number {
    return this.attackRange;
  }
  
  public isDodging(): boolean {
    // Enemies don't dodge yet, but could be implemented
    return false;
  }
  
  public isAlive(): boolean {
    return !this.isDead;
  }
  
  public getType(): string {
    return this.type.name;
  }
} 