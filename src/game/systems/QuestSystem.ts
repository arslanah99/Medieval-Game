import { Enemy } from '../entities/Enemy';

export type QuestType = 'kill' | 'collect' | 'escort' | 'delivery' | 'talk';
export type QuestRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'material' | 'quest';

export interface QuestReward {
  gold: number;
  experience: number;
  items?: Array<{
    name: string;
    type: ItemType;
    quantity: number;
  }>;
}

export interface QuestObjective {
  type: QuestType;
  target: string;
  count: number;
  currentCount: number;
  description: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: {
    id: string;
    description: string;
    completed: boolean;
    target?: number;
    progress?: number;
  }[];
  reward: {
    experience: number;
    gold?: number;
    items?: string[];
  };
  giver: string;
  accepted: boolean;
  completed: boolean;
}

export class QuestSystem {
  private quests: Map<string, Quest> = new Map();
  private activeQuests: Quest[] = [];
  private completedQuests: string[] = [];

  constructor() {
    // Initialize default quests
    this.initializeQuests();
  }

  private initializeQuests(): void {
    // Town defense quest
    this.quests.set('quest_town_defense', {
      id: 'quest_town_defense',
      title: 'Town Defense',
      description: 'Defeat goblins attacking the town from the nearby forest.',
      objectives: [
        {
          id: 'kill_goblins',
          description: 'Defeat 5 goblins',
          completed: false,
          target: 5,
          progress: 0
        }
      ],
      reward: {
        experience: 100,
        gold: 50
      },
      giver: 'Mayor Harlow',
      accepted: false,
      completed: false
    });
    
    // Delivery quest
    this.quests.set('quest_delivery', {
      id: 'quest_delivery',
      title: 'Special Delivery',
      description: 'Deliver a package from the shopkeeper to the blacksmith.',
      objectives: [
        {
          id: 'collect_package',
          description: 'Collect the package from the shopkeeper',
          completed: false
        },
        {
          id: 'deliver_package',
          description: 'Deliver the package to the blacksmith',
          completed: false
        }
      ],
      reward: {
        experience: 50,
        gold: 25
      },
      giver: 'Shopkeeper Morgan',
      accepted: false,
      completed: false
    });
    
    // Tutorial quest
    this.quests.set('quest_tutorial', {
      id: 'quest_tutorial',
      title: 'Welcome to Lumbridge',
      description: 'Learn the basics of combat by training with the combat instructor.',
      objectives: [
        {
          id: 'defeat_dummies',
          description: 'Defeat 3 training dummies',
          completed: false,
          target: 3,
          progress: 0
        }
      ],
      reward: {
        experience: 30,
        items: ['Basic Sword']
      },
      giver: 'Combat Instructor Taryn',
      accepted: false,
      completed: false
    });
    
    console.log('QuestSystem initialized with default quests');
  }

  public acceptQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.accepted) return false;
    
    quest.accepted = true;
    this.activeQuests.push(quest);
    console.log(`Quest accepted: ${quest.title}`);
    return true;
  }

  public updateObjectiveProgress(questId: string, objectiveId: string, amount: number = 1): boolean {
    const quest = this.quests.get(questId);
    if (!quest || !quest.accepted || quest.completed) return false;
    
    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return false;
    
    if (objective.progress !== undefined && objective.target !== undefined) {
      objective.progress += amount;
      objective.completed = objective.progress >= objective.target;
      console.log(`Quest "${quest.title}", objective "${objective.description}" updated: ${objective.progress}/${objective.target}`);
    } else {
      objective.completed = true;
      console.log(`Quest "${quest.title}", objective "${objective.description}" completed`);
    }
    
    // Check if all objectives are completed
    const allCompleted = quest.objectives.every(obj => obj.completed);
    if (allCompleted) {
      this.completeQuest(questId);
    }
    
    return true;
  }

  public completeQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || !quest.accepted || quest.completed) return false;
    
    quest.completed = true;
    this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
    console.log(`Quest completed: ${quest.title}`);
    
    return true;
  }

  public getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }

  public getQuestsByGiver(giverName: string): Quest[] {
    return Array.from(this.quests.values()).filter(quest => 
      quest.giver === giverName && !quest.completed
    );
  }

  public getQuestsForNPC(npcName: string): Quest[] {
    return Array.from(this.quests.values()).filter(quest => 
      quest.giver === npcName && !quest.accepted && !quest.completed
    );
  }

  public getActiveQuests(): Quest[] {
    return this.activeQuests;
  }

  public getCompletedQuests(): Quest[] {
    return Array.from(this.quests.values()).filter(quest => quest.completed);
  }

  public update(): void {
    // This is called every frame, but we don't need to do anything here
    // Quest updates happen through event-driven updateObjectiveProgress calls
  }

  // Update quest progress when enemy is killed
  public onEnemyKilled(enemy: Enemy): void {
    this.updateObjectiveProgress('quest_town_defense', 'kill_goblins', 1);
  }

  // Update quest progress when item is collected
  public onItemCollected(itemName: string, quantity: number = 1): void {
    this.updateObjectiveProgress('quest_delivery', 'collect_package', quantity);
  }

  // Update quest progress when NPC is talked to
  public onNPCInteraction(npcName: string): void {
    this.updateObjectiveProgress('quest_delivery', 'deliver_package');
  }

  // Update delivery quest
  public onDeliveryCompleted(targetName: string): void {
    this.updateObjectiveProgress('quest_delivery', 'deliver_package');
  }
} 