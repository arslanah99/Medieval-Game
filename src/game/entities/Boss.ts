import * as THREE from 'three';
import { Enemy } from './Enemy';
import { Player } from './Player';

// Special attack types for bosses
export enum BossAttackType {
  AREA_DAMAGE = 'area_damage',
  PROJECTILE = 'projectile',
  SUMMON_MINIONS = 'summon_minions',
  CHARGE = 'charge',
  GROUND_SLAM = 'ground_slam'
}

// Interface for boss special attacks
interface BossSpecialAttack {
  type: BossAttackType;
  name: string;
  damage: number;
  cooldown: number;
  currentCooldown: number;
  range: number;
  animation: string;
  execute: (boss: Boss, player: Player) => void;
}

// Boss phases for multi-phase boss battles
interface BossPhase {
  name: string;
  healthThreshold: number; // % of health to trigger phase
  specialAttacks: BossSpecialAttack[];
  color?: THREE.Color;
  speedMultiplier?: number;
  damageMultiplier?: number;
}

export class Boss extends Enemy {
  public readonly isBoss: boolean = true;
  public specialAttacks: BossSpecialAttack[];
  public phases: BossPhase[];
  public currentPhase: number;
  public phaseTransitioning: boolean;
  public music?: string;
  
  // Boss cutscene data
  public introAnimation?: string;
  public defeatAnimation?: string;
  public dialogueLines?: string[];

  constructor(
    name: string,
    modelPath: string,
    position: THREE.Vector3,
    scale = new THREE.Vector3(1, 1, 1),
    health = 1000,
    attackPower = 40,
    defense = 20
  ) {
    super(name, modelPath, position, scale, health, attackPower, defense);
    
    this.specialAttacks = [];
    this.phases = [];
    this.currentPhase = 0;
    this.phaseTransitioning = false;
    
    // Set larger detection and attack ranges for bosses
    this.detectionRange = 30;
    this.attackRange = 5;
    
    // Add boss specific properties
    this.setupBoss();
  }
  
  private setupBoss(): void {
    // This will be overridden by specific boss implementations
    console.log(`Boss ${this.name} initialized`);
  }
  
  public update(deltaTime: number, player: Player): void {
    super.update(deltaTime, player);
    
    // Update cooldowns for special attacks
    this.specialAttacks.forEach(attack => {
      if (attack.currentCooldown > 0) {
        attack.currentCooldown -= deltaTime;
      }
    });
    
    // Check for phase transitions
    this.checkPhaseTransition();
    
    // Use special attacks if available
    if (!this.phaseTransitioning && this.isPlayerInRange(player, this.detectionRange)) {
      this.useSpecialAttacks(player);
    }
  }
  
  private checkPhaseTransition(): void {
    if (this.phaseTransitioning || this.phases.length === 0) return;
    
    const healthPercent = this.health / this.maxHealth;
    const nextPhaseIndex = this.currentPhase + 1;
    
    if (nextPhaseIndex < this.phases.length) {
      const nextPhase = this.phases[nextPhaseIndex];
      
      if (healthPercent <= nextPhase.healthThreshold) {
        this.startPhaseTransition(nextPhaseIndex);
      }
    }
  }
  
  private startPhaseTransition(newPhaseIndex: number): void {
    this.phaseTransitioning = true;
    console.log(`Boss ${this.name} transitioning to phase: ${this.phases[newPhaseIndex].name}`);
    
    // Play phase transition animation/effect here
    
    // Apply new phase properties
    setTimeout(() => {
      this.currentPhase = newPhaseIndex;
      const newPhase = this.phases[newPhaseIndex];
      
      // Change boss appearance if specified
      if (newPhase.color) {
        this.changeBossColor(newPhase.color);
      }
      
      // Adjust stats based on phase multipliers
      if (newPhase.speedMultiplier) {
        this.movementSpeed *= newPhase.speedMultiplier;
      }
      
      if (newPhase.damageMultiplier) {
        this.attackPower *= newPhase.damageMultiplier;
      }
      
      this.phaseTransitioning = false;
      console.log(`Boss ${this.name} entered phase: ${newPhase.name}`);
    }, 2000); // 2-second transition
  }
  
  private changeBossColor(color: THREE.Color): void {
    if (!this.model) return;
    
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.color = color;
          });
        } else {
          child.material.color = color;
        }
      }
    });
  }
  
  private useSpecialAttacks(player: Player): void {
    if (!this.phases.length) return;
    
    const currentPhaseAttacks = this.phases[this.currentPhase].specialAttacks;
    const availableAttacks = currentPhaseAttacks.filter(
      attack => attack.currentCooldown <= 0 && this.isPlayerInRange(player, attack.range)
    );
    
    if (availableAttacks.length > 0) {
      // Choose a random attack from available ones
      const randomAttack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
      
      // Execute the attack
      console.log(`Boss ${this.name} using special attack: ${randomAttack.name}`);
      randomAttack.execute(this, player);
      
      // Reset cooldown
      randomAttack.currentCooldown = randomAttack.cooldown;
    }
  }
  
  private isPlayerInRange(player: Player, range: number): boolean {
    if (!this.model || !player.model) return false;
    
    const distance = this.model.position.distanceTo(player.model.position);
    return distance <= range;
  }
  
  // Method to add a special attack to this boss
  public addSpecialAttack(attack: BossSpecialAttack): void {
    this.specialAttacks.push(attack);
  }
  
  // Method to add a phase to this boss
  public addPhase(phase: BossPhase): void {
    this.phases.push(phase);
  }
  
  // Method to play boss intro cutscene
  public playIntro(): Promise<void> {
    return new Promise<void>((resolve) => {
      console.log(`Playing intro for boss: ${this.name}`);
      // Play intro animation/cutscene here
      
      setTimeout(() => {
        console.log(`Intro complete for boss: ${this.name}`);
        resolve();
      }, 3000); // 3-second intro
    });
  }
  
  // Method to play boss defeat cutscene
  public playDefeat(): Promise<void> {
    return new Promise<void>((resolve) => {
      console.log(`Playing defeat sequence for boss: ${this.name}`);
      // Play defeat animation/cutscene here
      
      setTimeout(() => {
        console.log(`Defeat complete for boss: ${this.name}`);
        resolve();
      }, 5000); // 5-second outro
    });
  }
}

// Example of a Necromancer boss implementation
export class NecromancerBoss extends Boss {
  constructor(position: THREE.Vector3) {
    super(
      'Necromancer', 
      '/models/bosses/necromancer.glb',
      position,
      new THREE.Vector3(1.5, 1.5, 1.5),
      2000, // Health
      50,   // Attack power
      30    // Defense
    );
    
    // Add dialogue lines for cutscenes
    this.dialogueLines = [
      "You dare disturb my ritual?",
      "Foolish adventurer, you will become part of my undead army!",
      "The power of death cannot be defeated!",
      "No... this cannot be! I am eternal!"
    ];
    
    // Set boss music
    this.music = '/audio/boss_battle_necromancer.mp3';
    
    // Setup phases and special attacks
    this.setupBoss();
  }
  
  protected setupBoss(): void {
    // Phase 1 - Initial phase
    const phase1 = {
      name: 'Summoner',
      healthThreshold: 1.0, // 100% health
      specialAttacks: [
        {
          type: BossAttackType.SUMMON_MINIONS,
          name: 'Raise Dead',
          damage: 0,
          cooldown: 10,
          currentCooldown: 0,
          range: 30,
          animation: 'summon',
          execute: (boss: Boss, player: Player) => {
            console.log(`${boss.name} summons undead minions to attack!`);
            // Summon minions logic would be implemented here
          }
        },
        {
          type: BossAttackType.PROJECTILE,
          name: 'Shadow Bolt',
          damage: 20,
          cooldown: 3,
          currentCooldown: 0,
          range: 20,
          animation: 'cast',
          execute: (boss: Boss, player: Player) => {
            console.log(`${boss.name} casts a shadow bolt at ${player.name}!`);
            // Projectile logic would be implemented here
            player.takeDamage(20);
          }
        }
      ]
    };
    
    // Phase 2 - At 70% health
    const phase2 = {
      name: 'Dark Magic',
      healthThreshold: 0.7, // 70% health
      specialAttacks: [
        {
          type: BossAttackType.AREA_DAMAGE,
          name: 'Death Nova',
          damage: 30,
          cooldown: 15,
          currentCooldown: 0,
          range: 30,
          animation: 'nova',
          execute: (boss: Boss, player: Player) => {
            console.log(`${boss.name} releases a death nova!`);
            // Area damage logic would be implemented here
            player.takeDamage(30);
          }
        },
        {
          type: BossAttackType.PROJECTILE,
          name: 'Shadow Bolt Volley',
          damage: 10,
          cooldown: 8,
          currentCooldown: 0,
          range: 20,
          animation: 'cast_multiple',
          execute: (boss: Boss, player: Player) => {
            console.log(`${boss.name} casts multiple shadow bolts!`);
            // Multiple projectiles logic would be implemented here
            for (let i = 0; i < 3; i++) {
              setTimeout(() => player.takeDamage(10), i * 500);
            }
          }
        }
      ],
      color: new THREE.Color(0.5, 0, 0.5), // Purple tint
      damageMultiplier: 1.2
    };
    
    // Phase 3 - At 30% health (final phase)
    const phase3 = {
      name: 'Unholy Power',
      healthThreshold: 0.3, // 30% health
      specialAttacks: [
        {
          type: BossAttackType.GROUND_SLAM,
          name: 'Earthquake of the Dead',
          damage: 50,
          cooldown: 20,
          currentCooldown: 0,
          range: 15,
          animation: 'slam',
          execute: (boss: Boss, player: Player) => {
            console.log(`${boss.name} slams the ground, causing an earthquake!`);
            // Ground slam logic would be implemented here
            player.takeDamage(50);
          }
        },
        {
          type: BossAttackType.SUMMON_MINIONS,
          name: 'Army of Darkness',
          damage: 0,
          cooldown: 25,
          currentCooldown: 0,
          range: 30,
          animation: 'summon_large',
          execute: (boss: Boss, player: Player) => {
            console.log(`${boss.name} summons a large army of the dead!`);
            // Summon multiple minions logic would be implemented here
          }
        }
      ],
      color: new THREE.Color(1, 0, 0), // Red tint
      speedMultiplier: 1.5,
      damageMultiplier: 1.5
    };
    
    // Add phases
    this.addPhase(phase1);
    this.addPhase(phase2);
    this.addPhase(phase3);
  }
} 