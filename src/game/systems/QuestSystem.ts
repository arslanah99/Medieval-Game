import { Enemy } from '../entities/Enemy';
import { create } from 'zustand';

// Quest progress types
export enum QuestStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Objective types
export enum ObjectiveType {
  TALK_TO_NPC = 'talk_to_npc',
  KILL_MONSTER = 'kill_monster',
  COLLECT_ITEM = 'collect_item',
  VISIT_LOCATION = 'visit_location',
  CRAFT_ITEM = 'craft_item'
}

// Quest objective interface
export interface QuestObjective {
  id: string;
  type: ObjectiveType;
  description: string;
  targetId: string;
  targetName: string;
  required: number;
  current: number;
  completed: boolean;
}

// Quest interface
export interface Quest {
  id: string;
  title: string;
  description: string;
  level: number;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: {
    gold: number;
    exp: number;
    items?: string[];
  };
  nextQuestId?: string;
  isVisible: boolean;
}

// Quest system store
interface QuestStore {
  quests: Record<string, Quest>;
  activeQuestIds: string[];
  completedQuestIds: string[];
  showQuestLog: boolean;
  
  // Actions
  initializeQuests: () => void;
  startQuest: (questId: string) => boolean;
  updateObjective: (questId: string, objectiveId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  toggleQuestLog: () => void;
  getQuestById: (questId: string) => Quest | undefined;
  getAvailableQuests: () => Quest[];
  getActiveQuests: () => Quest[];
  getCompletedQuests: () => Quest[];
}

// Define initial quests
const initialQuests: Record<string, Quest> = {
  'goblin_slayer': {
    id: 'goblin_slayer',
    title: 'Goblin Menace',
    description: 'Goblins have been raiding the farms around Lumbridge. Help the townspeople by defeating some of these pests.',
    level: 1,
    status: QuestStatus.NOT_STARTED,
    objectives: [
      {
        id: 'kill_goblins',
        type: ObjectiveType.KILL_MONSTER,
        description: 'Defeat goblins',
        targetId: 'goblin',
        targetName: 'Goblin',
        required: 5,
        current: 0,
        completed: false
      },
      {
        id: 'collect_goblin_mail',
        type: ObjectiveType.COLLECT_ITEM,
        description: 'Collect goblin mail',
        targetId: 'goblin_mail',
        targetName: 'Goblin Mail',
        required: 1,
        current: 0,
        completed: false
      }
    ],
    rewards: {
      gold: 50,
      exp: 100,
      items: ['bronze_sword']
    },
    nextQuestId: 'cook_assistant',
    isVisible: true
  },
  
  'cook_assistant': {
    id: 'cook_assistant',
    title: 'Cook\'s Assistant',
    description: 'The cook at Lumbridge Castle needs ingredients for the duke\'s birthday cake.',
    level: 2,
    status: QuestStatus.NOT_STARTED,
    objectives: [
      {
        id: 'talk_to_cook',
        type: ObjectiveType.TALK_TO_NPC,
        description: 'Speak with the castle cook',
        targetId: 'lumbridge_cook',
        targetName: 'Cook',
        required: 1,
        current: 0,
        completed: false
      },
      {
        id: 'collect_egg',
        type: ObjectiveType.COLLECT_ITEM,
        description: 'Find an egg from the chicken pen',
        targetId: 'egg',
        targetName: 'Egg',
        required: 1,
        current: 0,
        completed: false
      },
      {
        id: 'collect_milk',
        type: ObjectiveType.COLLECT_ITEM,
        description: 'Get milk from the dairy cow',
        targetId: 'milk',
        targetName: 'Bucket of Milk',
        required: 1,
        current: 0,
        completed: false
      },
      {
        id: 'collect_flour',
        type: ObjectiveType.COLLECT_ITEM,
        description: 'Mill some wheat into flour',
        targetId: 'flour',
        targetName: 'Flour',
        required: 1,
        current: 0,
        completed: false
      }
    ],
    rewards: {
      gold: 100,
      exp: 200,
      items: ['cake_slice']
    },
    nextQuestId: 'undead_threat',
    isVisible: false
  },
  
  'undead_threat': {
    id: 'undead_threat',
    title: 'The Undead Threat',
    description: 'Strange reports of undead creatures emerging from the swamp at night. Investigate and defeat the source of this evil.',
    level: 5,
    status: QuestStatus.NOT_STARTED,
    objectives: [
      {
        id: 'investigate_swamp',
        type: ObjectiveType.VISIT_LOCATION,
        description: 'Investigate the swamp at night',
        targetId: 'lumbridge_swamp',
        targetName: 'Lumbridge Swamp',
        required: 1,
        current: 0,
        completed: false
      },
      {
        id: 'kill_skeletons',
        type: ObjectiveType.KILL_MONSTER,
        description: 'Defeat skeleton warriors',
        targetId: 'skeleton_warrior',
        targetName: 'Skeleton Warrior',
        required: 3,
        current: 0,
        completed: false
      },
      {
        id: 'defeat_necromancer',
        type: ObjectiveType.KILL_MONSTER,
        description: 'Defeat the necromancer boss',
        targetId: 'necromancer_boss',
        targetName: 'Necromancer',
        required: 1,
        current: 0,
        completed: false
      }
    ],
    rewards: {
      gold: 500,
      exp: 1000,
      items: ['amulet_of_protection', 'steel_longsword']
    },
    isVisible: false
  }
};

// Create quest store
export const useQuestStore = create<QuestStore>((set, get) => ({
  quests: {},
  activeQuestIds: [],
  completedQuestIds: [],
  showQuestLog: false,
  
  initializeQuests: () => {
    set({ quests: initialQuests });
    console.log('Quest system initialized with', Object.keys(initialQuests).length, 'quests');
  },
  
  startQuest: (questId) => {
    const { quests, activeQuestIds } = get();
    const quest = quests[questId];
    
    if (!quest || quest.status !== QuestStatus.NOT_STARTED) {
      console.log(`Cannot start quest ${questId}: not available or already started`);
      return false;
    }
    
    // Update quest status
    const updatedQuests = {
      ...quests,
      [questId]: {
        ...quest,
        status: QuestStatus.IN_PROGRESS
      }
    };
    
    set({
      quests: updatedQuests,
      activeQuestIds: [...activeQuestIds, questId]
    });
    
    console.log(`Started quest: ${quest.title}`);
    return true;
  },
  
  updateObjective: (questId, objectiveId, progress) => {
    const { quests } = get();
    const quest = quests[questId];
    
    if (!quest || quest.status !== QuestStatus.IN_PROGRESS) {
      return;
    }
    
    // Find the objective
    const objectiveIndex = quest.objectives.findIndex(obj => obj.id === objectiveId);
    if (objectiveIndex === -1) {
      return;
    }
    
    // Clone objectives array
    const updatedObjectives = [...quest.objectives];
    const objective = updatedObjectives[objectiveIndex];
    
    // Update progress
    const newCurrent = Math.min(objective.current + progress, objective.required);
    const completed = newCurrent >= objective.required;
    
    updatedObjectives[objectiveIndex] = {
      ...objective,
      current: newCurrent,
      completed
    };
    
    // Check if all objectives are completed
    const allCompleted = updatedObjectives.every(obj => obj.completed);
    
    // Update quest
    const updatedQuest = {
      ...quest,
      objectives: updatedObjectives,
      status: allCompleted ? QuestStatus.COMPLETED : QuestStatus.IN_PROGRESS
    };
    
    set({
      quests: {
        ...quests,
        [questId]: updatedQuest
      }
    });
    
    // If all objectives completed, complete the quest
    if (allCompleted) {
      get().completeQuest(questId);
    }
  },
  
  completeQuest: (questId) => {
    const { quests, activeQuestIds, completedQuestIds } = get();
    const quest = quests[questId];
    
    if (!quest || quest.status === QuestStatus.COMPLETED) {
      return;
    }
    
    // Update quest status
    const updatedQuests = {
      ...quests,
      [questId]: {
        ...quest,
        status: QuestStatus.COMPLETED
      }
    };
    
    // If there's a next quest, make it visible
    if (quest.nextQuestId && updatedQuests[quest.nextQuestId]) {
      updatedQuests[quest.nextQuestId] = {
        ...updatedQuests[quest.nextQuestId],
        isVisible: true
      };
    }
    
    // Remove from active quests, add to completed quests
    const newActiveQuestIds = activeQuestIds.filter(id => id !== questId);
    
    set({
      quests: updatedQuests,
      activeQuestIds: newActiveQuestIds,
      completedQuestIds: [...completedQuestIds, questId]
    });
    
    console.log(`Completed quest: ${quest.title}`);
    
    // Here you would also trigger rewards in other systems
    // For example, add items to inventory, give XP, etc.
  },
  
  toggleQuestLog: () => set(state => ({ showQuestLog: !state.showQuestLog })),
  
  getQuestById: (questId) => get().quests[questId],
  
  getAvailableQuests: () => {
    const { quests } = get();
    return Object.values(quests).filter(quest => 
      quest.isVisible && quest.status === QuestStatus.NOT_STARTED
    );
  },
  
  getActiveQuests: () => {
    const { quests, activeQuestIds } = get();
    return activeQuestIds.map(id => quests[id]).filter(Boolean);
  },
  
  getCompletedQuests: () => {
    const { quests, completedQuestIds } = get();
    return completedQuestIds.map(id => quests[id]).filter(Boolean);
  }
}));

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
      level: 1,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'kill_goblins',
          type: ObjectiveType.KILL_MONSTER,
          description: 'Defeat 5 goblins',
          targetId: 'goblin',
          targetName: 'Goblin',
          required: 5,
          current: 0,
          completed: false
        }
      ],
      rewards: {
        gold: 50,
        exp: 100
      },
      nextQuestId: 'cook_assistant',
      isVisible: true
    });
    
    // Delivery quest
    this.quests.set('quest_delivery', {
      id: 'quest_delivery',
      title: 'Special Delivery',
      description: 'Deliver a package from the shopkeeper to the blacksmith.',
      level: 2,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'collect_package',
          type: ObjectiveType.COLLECT_ITEM,
          description: 'Collect the package from the shopkeeper',
          targetId: 'package',
          targetName: 'Package',
          required: 1,
          current: 0,
          completed: false
        },
        {
          id: 'deliver_package',
          type: ObjectiveType.VISIT_LOCATION,
          description: 'Deliver the package to the blacksmith',
          targetId: 'blacksmith',
          targetName: 'Blacksmith',
          required: 1,
          current: 0,
          completed: false
        }
      ],
      rewards: {
        gold: 25,
        exp: 50
      },
      nextQuestId: 'undead_threat',
      isVisible: false
    });
    
    // Tutorial quest
    this.quests.set('quest_tutorial', {
      id: 'quest_tutorial',
      title: 'Welcome to Lumbridge',
      description: 'Learn the basics of combat by training with the combat instructor.',
      level: 1,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'defeat_dummies',
          type: ObjectiveType.KILL_MONSTER,
          description: 'Defeat 3 training dummies',
          targetId: 'dummy',
          targetName: 'Training Dummy',
          required: 3,
          current: 0,
          completed: false
        }
      ],
      rewards: {
        gold: 0,
        exp: 30,
        items: ['Basic Sword']
      },
      nextQuestId: 'goblin_slayer',
      isVisible: true
    });
    
    console.log('QuestSystem initialized with default quests');
  }

  public acceptQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== QuestStatus.NOT_STARTED) return false;
    
    quest.status = QuestStatus.IN_PROGRESS;
    this.activeQuests.push(quest);
    console.log(`Quest accepted: ${quest.title}`);
    return true;
  }

  public updateObjectiveProgress(questId: string, objectiveId: string, amount: number = 1): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== QuestStatus.IN_PROGRESS) return false;
    
    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return false;
    
    if (objective.current !== undefined && objective.required !== undefined) {
      objective.current += amount;
      objective.completed = objective.current >= objective.required;
      console.log(`Quest "${quest.title}", objective "${objective.description}" updated: ${objective.current}/${objective.required}`);
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
    if (!quest || quest.status !== QuestStatus.IN_PROGRESS) return false;
    
    quest.status = QuestStatus.COMPLETED;
    this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
    console.log(`Quest completed: ${quest.title}`);
    
    return true;
  }

  public getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }

  public getQuestsByGiver(giverName: string): Quest[] {
    // This function is deprecated in the new quest system
    return [];
  }

  public getQuestsForNPC(npcName: string): Quest[] {
    // This function is deprecated in the new quest system
    return [];
  }

  public getActiveQuests(): Quest[] {
    return this.activeQuests;
  }

  public getCompletedQuests(): Quest[] {
    return Array.from(this.quests.values()).filter(quest => quest.status === QuestStatus.COMPLETED);
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