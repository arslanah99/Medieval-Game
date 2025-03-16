import * as THREE from 'three';

// Define CharacterCustomization interface directly if the import isn't working
interface CharacterCustomization {
  skinColor?: string;
  hairColor?: string;
  outfitColor?: string;
}

export class Character3D {
  private mesh: THREE.Group = new THREE.Group();
  private moveSpeed: number = 5;
  private rotationSpeed: number = 0.15;
  private keys: { [key: string]: boolean } = {};
  private camera: THREE.PerspectiveCamera;
  private cameraOffset: THREE.Vector3;
  private isWalking: boolean = false;
  private isRunningBackward: boolean = false;
  private animationMixers: THREE.AnimationMixer[] = [];
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private walkingTime: number = 0;
  private collisionObjects: THREE.Mesh[] = [];
  private currentVelocity: THREE.Vector3 = new THREE.Vector3();
  private targetRotation: number = 0;
  private currentRotation: number = 0;
  private movementDirection: THREE.Vector3 = new THREE.Vector3();
  private cameraAngle: number = 0;
  private head!: THREE.Mesh;
  private body!: THREE.Mesh;
  private hair!: THREE.Mesh;
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private cameraLerpFactor: number = 0.1;
  private movementLerpFactor: number = 0.1;
  private rotationLerpFactor: number = 0.08;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private cameraCollisionDistance: number = 2;
  private cameraHeight: number = 2;
  private cameraDistance: number = 8;
  private cameraSmoothness: number = 0.05;
  private cameraOffsetY: number = 1.5;
  private cameraOffsetZ: number = -8;
  private cameraLookAtOffset: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);
  private groundY: number = 0;
  private gravity: number = 0;
  private verticalVelocity: number = 0;
  private isGrounded: boolean = true;
  private isTouchingGround: boolean = true;
  private lastKeyPressTime: number = 0;
  private previousMoveVector: THREE.Vector3 = new THREE.Vector3();
  private targetVelocity: THREE.Vector3 = new THREE.Vector3();

  // RPG Stats
  private maxHealth: number = 100;
  private currentHealth: number = 100;
  private stamina: number = 100;
  private maxStamina: number = 100;
  private mana: number = 50;
  private maxMana: number = 50;
  private level: number = 1;
  private experience: number = 0;
  private experienceToNextLevel: number = 100;
  
  // Combat properties
  private attackPower: number = 10;
  private defense: number = 5;
  private isAttacking: boolean = false;
  private attackCooldown: number = 0;
  private attackCooldownMax: number = 0.8; // seconds
  private attackRange: number = 2;
  private weaponMesh!: THREE.Group;
  private weaponAttackAnimation: {startTime: number, duration: number} = {startTime: 0, duration: 0.5};
  private isBlocking: boolean = false;
  private isDodging: boolean = false;
  private dodgeCooldown: number = 0;
  private dodgeCooldownMax: number = 1; // seconds
  
  // Effects
  private hitEffect?: THREE.Points;
  private effectsParent: THREE.Group = new THREE.Group();
  
  // UI elements reference (will be set externally)
  private uiElements?: {
    healthBar?: HTMLElement;
    staminaBar?: HTMLElement;
    manaBar?: HTMLElement;
    levelText?: HTMLElement;
    experienceBar?: HTMLElement;
  };

  constructor(
    scene: THREE.Scene, 
    camera: THREE.PerspectiveCamera, 
    collisionObjects: THREE.Mesh[],
    customization?: CharacterCustomization
  ) {
    console.log('Character3D constructor called with customization:', customization);
    
    this.camera = camera;
    this.cameraOffset = new THREE.Vector3(0, 5, -10);
    
    // Filter out the ground plane from collision objects
    this.collisionObjects = collisionObjects.filter(obj => 
      !(obj.geometry instanceof THREE.PlaneGeometry)
    );
    
    console.log(`Collision objects count: ${this.collisionObjects.length}`);
    
    // Initialize event handlers with direct references to avoid binding issues
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    
    // Setup character and controls
    try {
      console.log('Setting up character model');
      this.setupCharacterModel(scene, customization);
      console.log('Setting up controls');
      this.setupControls();
      console.log('Setting up weapon');
      this.setupWeapon(scene);
      
      // Setup visual effects group
      this.effectsParent = new THREE.Group();
      scene.add(this.effectsParent);
  
      // Set initial position outside the castle gates (in front of the main gate)
      // The castle's front wall is at z=20, so we'll place the character at z=25
      this.mesh.position.set(0, this.groundY + 0.1, 25);
      this.isGrounded = true;
      this.updateCameraPosition();
  
      // Initialize movement vectors
      this.currentVelocity.set(0, 0, 0);
      this.targetVelocity.set(0, 0, 0);
      this.previousMoveVector.set(0, 0, 0);
  
      console.log('Character initialized at position:', this.mesh.position);
  
      // Set up key listeners
      window.addEventListener('keydown', (event) => {
        this.keys[event.key.toLowerCase()] = true;
      });
  
      window.addEventListener('keyup', (event) => {
        this.keys[event.key.toLowerCase()] = false;
      });
      
      // Add character mesh to scene
      scene.add(this.mesh);
      console.log('Character mesh added to scene');
    } catch (error) {
      console.error('Error during character initialization:', error);
      throw error;
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
      this.keys[key] = true;
      this.lastKeyPressTime = Date.now();
      console.log(`Key ${key} pressed, Keys:`, { ...this.keys });
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
      this.keys[key] = false;
      console.log(`Key ${key} released, Keys:`, { ...this.keys });
    }
  }

  private updateCameraPosition(): void {
    // Get the direction the character is facing
    const characterDirection = new THREE.Vector3(0, 0, 1);
    characterDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);

    // Calculate ideal camera position (behind the character)
    const idealCameraPosition = this.mesh.position.clone();
    idealCameraPosition.y += this.cameraOffsetY;
    
    // Multiply by negative value to position camera behind character
    const offsetDistance = -this.cameraDistance;
    idealCameraPosition.add(characterDirection.clone().multiplyScalar(offsetDistance));

    // Check for camera collisions
    const cameraRay = new THREE.Raycaster(
      this.mesh.position.clone().add(new THREE.Vector3(0, this.cameraHeight, 0)),
      idealCameraPosition.clone().sub(this.mesh.position.clone().add(new THREE.Vector3(0, this.cameraHeight, 0))).normalize()
    );

    const intersects = cameraRay.intersectObjects(this.collisionObjects);
    let cameraPosition = idealCameraPosition;

    if (intersects.length > 0 && intersects[0].distance < Math.abs(offsetDistance)) {
      cameraPosition = intersects[0].point.clone().add(
        cameraRay.ray.direction.multiplyScalar(this.cameraCollisionDistance)
      );
    }

    // Initialize camera target if it's at origin (0,0,0)
    if (this.cameraTarget.lengthSq() === 0) {
      this.cameraTarget.copy(cameraPosition);
    }

    // Smoothly interpolate camera position
    this.cameraTarget.lerp(cameraPosition, this.cameraSmoothness);
    this.camera.position.copy(this.cameraTarget);

    // Calculate look-at target with offset
    const lookAtTarget = this.mesh.position.clone().add(this.cameraLookAtOffset);
    this.camera.lookAt(lookAtTarget);
  }

  private setupCharacterModel(scene: THREE.Scene, customization?: CharacterCustomization): void {
    this.mesh = new THREE.Group();

    // Create body
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: customization?.outfitColor ? new THREE.Color(customization.outfitColor) : 0x964B00,
      roughness: 0.7,
      metalness: 0.3,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 1;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Create head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: customization?.skinColor ? new THREE.Color(customization.skinColor) : 0xffd700,
      roughness: 0.5,
      metalness: 0.5,
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 2.4;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Create hair
    if (customization?.hairColor) {
      const hairGeometry = new THREE.BoxGeometry(0.85, 0.3, 0.85);
      const hairMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(customization.hairColor),
        roughness: 0.8,
        metalness: 0.2,
      });
      this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
      this.hair.position.y = 2.8;
      this.hair.castShadow = true;
      this.mesh.add(this.hair);
    }

    // Create arms
    const armGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: customization?.outfitColor ? new THREE.Color(customization.outfitColor) : 0x964B00,
      roughness: 0.7,
      metalness: 0.3,
    });

    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(-0.7, 1.5, 0);
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(0.7, 1.5, 0);
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);

    // Create legs with outfit color
    const legGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: customization?.outfitColor ? new THREE.Color(customization.outfitColor) : 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(-0.3, -0.25, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(0.3, -0.25, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    // Add character to scene
    scene.add(this.mesh);
  }

  private setupControls(): void {
    this.keyDownHandler = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      
      // Handle attack with spacebar
      if (e.key === ' ' && !this.isAttacking && this.attackCooldown <= 0) {
        this.startAttack();
      }
      
      // Handle block with right mouse button (simulated with 'b' key for now)
      if (e.key.toLowerCase() === 'b') {
        this.isBlocking = true;
      }
      
      // Handle dodge with shift key
      if (e.key.toLowerCase() === 'shift' && !this.isDodging && this.dodgeCooldown <= 0) {
        this.startDodge();
      }
    };

    this.keyUpHandler = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
      
      // Stop blocking when key released
      if (e.key.toLowerCase() === 'b') {
        this.isBlocking = false;
      }
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  private setupWeapon(scene: THREE.Scene): void {
    // Create a simple sword mesh
    const swordHiltGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    const swordBladeGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.01);
    
    const swordHiltMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.7,
      metalness: 0.3
    });
    
    const swordBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0, // Silver
      roughness: 0.3,
      metalness: 0.8
    });
    
    const hilt = new THREE.Mesh(swordHiltGeometry, swordHiltMaterial);
    const blade = new THREE.Mesh(swordBladeGeometry, swordBladeMaterial);
    blade.position.y = 0.6;
    
    this.weaponMesh = new THREE.Group();
    this.weaponMesh.add(hilt);
    this.weaponMesh.add(blade);
    
    // Position the sword at the character's right hand
    this.weaponMesh.position.set(0.6, 1.2, 0.2);
    this.weaponMesh.rotation.z = Math.PI / 4; // Angle the sword slightly
    
    this.mesh.add(this.weaponMesh);
  }

  private startAttack(): void {
    if (this.isAttacking || this.attackCooldown > 0) return;
    
    this.isAttacking = true;
    this.weaponAttackAnimation.startTime = performance.now() / 1000;
    
    // Re-enable attack after animation completes
    setTimeout(() => {
      this.isAttacking = false;
      this.attackCooldown = this.attackCooldownMax;
      
      // Check for enemies in range and damage them
      this.checkAttackHits();
    }, this.weaponAttackAnimation.duration * 1000);
  }
  
  private checkAttackHits(): void {
    // Get attack direction based on character facing
    const attackDirection = new THREE.Vector3(
      -Math.sin(this.mesh.rotation.y),
      0,
      -Math.cos(this.mesh.rotation.y)
    );
    
    // This is just a placeholder - in a real game, you would check for enemy collisions here
    console.log('Attack performed in direction:', attackDirection);
    
    // Create a hit effect for demonstration
    this.createHitEffect();
  }
  
  private createHitEffect(): void {
    // Remove previous effect if it exists
    if (this.hitEffect) {
      this.effectsParent.remove(this.hitEffect);
      if (this.hitEffect.geometry) this.hitEffect.geometry.dispose();
      if (this.hitEffect.material) {
        if (Array.isArray(this.hitEffect.material)) {
          this.hitEffect.material.forEach(material => material.dispose());
        } else {
          this.hitEffect.material.dispose();
        }
      }
      this.hitEffect = undefined;
    }
    
    // Create particle effect
    const particleCount = 20;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const positions = new Float32Array(particleCount * 3);
    
    // Get position in front of character
    const directionVector = new THREE.Vector3(
      -Math.sin(this.mesh.rotation.y),
      0,
      -Math.cos(this.mesh.rotation.y)
    );
    
    const effectPosition = this.mesh.position.clone().add(
      directionVector.multiplyScalar(1.5)
    );
    
    // Set particle positions to fan out from hit point
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;
      positions[i * 3] = effectPosition.x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = effectPosition.y + 1 + Math.random() * 0.5;
      positions[i * 3 + 2] = effectPosition.z + Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.hitEffect = new THREE.Points(particleGeometry, particleMaterial);
    this.effectsParent.add(this.hitEffect);
    
    // Remove hit effect after a short time
    setTimeout(() => {
      if (this.hitEffect) {
        this.effectsParent.remove(this.hitEffect);
        if (this.hitEffect.geometry) this.hitEffect.geometry.dispose();
        if (this.hitEffect.material) this.hitEffect.material.dispose();
        this.hitEffect = undefined;
      }
    }, 500);
  }
  
  private startDodge(): void {
    if (this.isDodging || this.dodgeCooldown > 0) return;
    
    this.isDodging = true;
    
    // Get current movement or facing direction
    const dodgeDirection = new THREE.Vector3();
    
    if (this.currentVelocity.lengthSq() > 0.01) {
      // Dodge in movement direction
      dodgeDirection.copy(this.currentVelocity).normalize();
    } else {
      // Dodge in facing direction
      dodgeDirection.set(
        -Math.sin(this.mesh.rotation.y),
        0,
        -Math.cos(this.mesh.rotation.y)
      );
    }
    
    // Apply a quick boost in the dodge direction
    this.currentVelocity.copy(dodgeDirection).multiplyScalar(0.3);
    
    // Reset dodge after a short time
    setTimeout(() => {
      this.isDodging = false;
      this.dodgeCooldown = this.dodgeCooldownMax;
    }, 300);
  }

  public update(delta: number): void {
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= delta;
    }
    
    // Update attack animation
    this.updateWeaponAnimation(delta);
    
    // Skip gravity - keep character on the ground
    this.isGrounded = true;
    this.mesh.position.y = this.groundY + 0.1; // Keep slight offset from ground

    // Use simplified direct movement approach
    let directMoveX = 0;
    let directMoveZ = 0;
    const directMoveSpeed = 0.03; // Further reduced speed for more natural movement
    
    if (this.keys['w']) directMoveZ -= directMoveSpeed;
    if (this.keys['s']) directMoveZ += directMoveSpeed;
    if (this.keys['a']) directMoveX -= directMoveSpeed;
    if (this.keys['d']) directMoveX += directMoveSpeed;
    
    // If we have key input, apply movement directly
    if (directMoveX !== 0 || directMoveZ !== 0) {
      // Convert to camera-relative coordinates
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      cameraRight.y = 0;
      cameraRight.normalize();
      
      // Calculate movement vector
      const moveVector = new THREE.Vector3();
      moveVector.addScaledVector(cameraDirection, -directMoveZ);
      moveVector.addScaledVector(cameraRight, directMoveX);
      
      if (moveVector.length() > 0) {
        moveVector.normalize();
        
        // Smooth transition between movement directions
        if (this.previousMoveVector.lengthSq() > 0) {
          moveVector.lerp(this.previousMoveVector, 0.8); // Increased smoothing
          moveVector.normalize();
        }
        
        // Save current move vector for next frame
        this.previousMoveVector.copy(moveVector);

        // Calculate target velocity with acceleration
        this.targetVelocity.copy(moveVector).multiplyScalar(directMoveSpeed * 6); // Reduced multiplier
        
        // Apply stamina cost for movement
        if (!this.isDodging && this.stamina > 0) {
          this.stamina -= directMoveSpeed * 5 * delta;
          if (this.stamina < 0) this.stamina = 0;
        }
        
        // Smoothly interpolate current velocity towards target velocity
        this.currentVelocity.lerp(this.targetVelocity, this.movementLerpFactor * delta * 60);
        
        // Apply movement
        const newPosition = this.mesh.position.clone();
        newPosition.add(this.currentVelocity);
        newPosition.y = this.groundY + 0.1; // Maintain ground offset
        
        if (!this.checkCollision(newPosition)) {
          this.mesh.position.copy(newPosition);
          this.isWalking = true;
          
          // Update character rotation to face movement direction
          if (this.currentVelocity.lengthSq() > 0.00001) {
            this.targetRotation = Math.atan2(this.currentVelocity.x, this.currentVelocity.z);
            
            // Make rotation smoother
            const rotationDelta = ((this.targetRotation - this.currentRotation + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            this.currentRotation += rotationDelta * this.rotationLerpFactor;
            this.mesh.rotation.y = this.currentRotation;
          }
        } else {
          // If collision detected, try to slide along walls
          const slideX = new THREE.Vector3(newPosition.x, this.groundY + 0.1, this.mesh.position.z);
          const slideZ = new THREE.Vector3(this.mesh.position.x, this.groundY + 0.1, newPosition.z);
          
          if (!this.checkCollision(slideX)) {
            this.mesh.position.x = slideX.x;
          }
          if (!this.checkCollision(slideZ)) {
            this.mesh.position.z = slideZ.z;
          }
        }
      }
    } else {
      // Gradually slow down when no input (smoother deceleration)
      if (this.currentVelocity.lengthSq() > 0.00001) {
        this.currentVelocity.multiplyScalar(0.95); // Increased deceleration
        
        const newPosition = this.mesh.position.clone();
        newPosition.add(this.currentVelocity);
        newPosition.y = this.groundY + 0.1; // Maintain ground offset
        
        if (!this.checkCollision(newPosition)) {
          this.mesh.position.copy(newPosition);
        } else {
          this.currentVelocity.set(0, 0, 0);
        }
      } else {
        this.currentVelocity.set(0, 0, 0);
        this.isWalking = false;
      }
      
      // Clear previous movement vector when no input
      this.previousMoveVector.set(0, 0, 0);
    }

    // Update camera position
    this.updateCameraPosition();

    // Update walking animation with speed based on velocity
    this.updateWalkingAnimation(delta);
    
    // Regenerate stamina when not moving or dodging
    if (!this.isDodging && this.currentVelocity.lengthSq() < 0.01) {
      this.stamina += 10 * delta;
      if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
    }
    
    // Regenerate mana
    this.mana += 2 * delta;
    if (this.mana > this.maxMana) this.mana = this.maxMana;
    
    // Update UI if available
    this.updateUI();
  }
  
  private updateWeaponAnimation(delta: number): void {
    if (!this.weaponMesh) return;
    
    if (this.isAttacking) {
      // Get elapsed time since attack started
      const currentTime = performance.now() / 1000;
      const elapsedTime = currentTime - this.weaponAttackAnimation.startTime;
      const progress = Math.min(elapsedTime / this.weaponAttackAnimation.duration, 1);
      
      // Create a swinging motion
      const initialRotation = Math.PI / 4; // Starting angle
      const swingAmount = Math.PI * 1.2; // Total rotation amount
      
      // Use easing function for natural swing
      const eased = this.easeInOutQuad(progress);
      const newRotation = initialRotation + swingAmount * eased;
      
      // Apply rotation to weapon
      this.weaponMesh.rotation.z = newRotation;
    } else {
      // Return to resting position when not attacking
      this.weaponMesh.rotation.z = Math.PI / 4;
    }
  }
  
  // Easing function for smoother animations
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  private updateUI(): void {
    if (!this.uiElements) return;
    
    // Update health bar
    if (this.uiElements.healthBar) {
      const healthPercent = (this.currentHealth / this.maxHealth) * 100;
      this.uiElements.healthBar.style.width = `${healthPercent}%`;
    }
    
    // Update stamina bar
    if (this.uiElements.staminaBar) {
      const staminaPercent = (this.stamina / this.maxStamina) * 100;
      this.uiElements.staminaBar.style.width = `${staminaPercent}%`;
    }
    
    // Update mana bar
    if (this.uiElements.manaBar) {
      const manaPercent = (this.mana / this.maxMana) * 100;
      this.uiElements.manaBar.style.width = `${manaPercent}%`;
    }
    
    // Update level text
    if (this.uiElements.levelText) {
      this.uiElements.levelText.textContent = `Level ${this.level}`;
    }
    
    // Update experience bar
    if (this.uiElements.experienceBar) {
      const expPercent = (this.experience / this.experienceToNextLevel) * 100;
      this.uiElements.experienceBar.style.width = `${expPercent}%`;
    }
  }
  
  // Method to set up UI elements (called from outside)
  public setUIElements(elements: any): void {
    this.uiElements = elements;
    this.updateUI();
  }
  
  // Method to take damage
  public takeDamage(amount: number): void {
    // Reduce damage if blocking
    if (this.isBlocking) {
      amount = Math.max(1, amount - this.defense);
    }
    
    this.currentHealth -= amount;
    
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.die();
    }
    
    this.updateUI();
  }
  
  private die(): void {
    console.log('Character died');
    // More death logic would go here
  }
  
  // Method to gain experience
  public gainExperience(amount: number): void {
    this.experience += amount;
    
    // Level up if enough experience
    if (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
    
    this.updateUI();
  }
  
  private levelUp(): void {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    
    // Increase stats
    this.maxHealth += 10;
    this.currentHealth = this.maxHealth;
    this.maxStamina += 5;
    this.stamina = this.maxStamina;
    this.maxMana += 5;
    this.mana = this.maxMana;
    this.attackPower += 2;
    this.defense += 1;
    
    console.log(`Leveled up to ${this.level}!`);
    this.updateUI();
  }
  
  // Helper method to get position
  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
  
  // Helper method to get stats for UI
  public getStats(): any {
    return {
      health: this.currentHealth,
      maxHealth: this.maxHealth,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      mana: this.mana,
      maxMana: this.maxMana,
      level: this.level,
      experience: this.experience,
      experienceToNextLevel: this.experienceToNextLevel,
      attackPower: this.attackPower,
      defense: this.defense
    };
  }

  private updateWalkingAnimation(delta: number): void {
    if (this.isWalking) {
      // Calculate animation speed based on velocity magnitude
      const speed = this.currentVelocity.length() * 40; // Adjust animation speed based on movement speed
      const animationSpeed = this.isRunningBackward ? -speed : speed;
      this.walkingTime += delta * animationSpeed;
      
      // Adjust amplitude based on speed
      const maxAmplitude = 0.5;
      const amplitude = Math.min(maxAmplitude, this.currentVelocity.length() * 10);
      
      // Leg animation
      this.leftLeg.rotation.x = Math.sin(this.walkingTime) * amplitude;
      this.rightLeg.rotation.x = Math.sin(this.walkingTime + Math.PI) * amplitude;
      
      // Arm animation (opposite to legs)
      this.leftArm.rotation.x = Math.sin(this.walkingTime + Math.PI) * amplitude * 0.8;
      this.rightArm.rotation.x = Math.sin(this.walkingTime) * amplitude * 0.8;
      
      // Add slight body tilt when running
      this.mesh.rotation.x = Math.sin(this.walkingTime * 2) * 0.05 * (amplitude / maxAmplitude);
    } else {
      // Reset to idle position with smooth transition
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
      this.rightArm.rotation.x *= 0.8;
      this.mesh.rotation.x *= 0.8;
    }
  }

  private checkCollision(newPosition: THREE.Vector3): boolean {
    // Create a smaller bounding box for more precise collision detection
    const characterBoundingBox = new THREE.Box3();
    const boxSize = 0.3; // Reduced collision box size
    
    characterBoundingBox.min.set(
      newPosition.x - boxSize,
      this.groundY,
      newPosition.z - boxSize
    );
    
    characterBoundingBox.max.set(
      newPosition.x + boxSize,
      this.groundY + 2.5, // Reduced character height for collision
      newPosition.z + boxSize
    );

    for (const object of this.collisionObjects) {
      const objectBoundingBox = new THREE.Box3().setFromObject(object);
      if (characterBoundingBox.intersectsBox(objectBoundingBox)) {
        return true;
      }
    }
    return false;
  }

  public destroy(): void {
    // Remove event listeners with proper references
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);

    // Dispose of geometries and materials
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              if (material.map) material.map.dispose();
              material.dispose();
            });
          } else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        }
      }
    });
  }

  // Public accessor methods for combat
  public getAttackRange(): number {
    return this.attackRange;
  }

  public getAttackPower(): number {
    return this.attackPower;
  }

  public isPlayerAttacking(): boolean {
    return this.isAttacking;
  }

  public isPlayerDodging(): boolean {
    return this.isDodging;
  }

  // Add new method to check for interaction key
  public getKeys(): { [key: string]: boolean } {
    return this.keys;
  }

  // Check if interaction key is pressed
  public isInteractionKeyPressed(): boolean {
    return this.keys['e'] === true;
  }

  // Add new method to get the mesh
  public getMesh(): THREE.Group {
    return this.mesh;
  }
}