import { create } from 'zustand';
import { useGameStore } from '../stores/gameStore';

// Types of cutscenes
export enum CutsceneType {
  INTRO = 'intro',
  BOSS_INTRO = 'boss_intro',
  QUEST_START = 'quest_start',
  QUEST_COMPLETE = 'quest_complete',
  DIALOG = 'dialog',
  AREA_TRANSITION = 'area_transition'
}

// Interface for dialogue options
export interface DialogueOption {
  text: string;
  nextId?: string;
  action?: () => void;
}

// Interface for dialogue nodes
export interface DialogueNode {
  id: string;
  character: string;
  text: string;
  portrait?: string;
  options?: DialogueOption[];
  nextId?: string;
}

// Interface for a cutscene
export interface Cutscene {
  id: string;
  type: CutsceneType;
  title?: string;
  backgroundImage?: string;
  music?: string;
  dialogues?: DialogueNode[];
  duration?: number;
  skippable: boolean;
  onComplete?: () => void;
}

// Interface for the cutscene store
interface CutsceneStore {
  cutscenes: Record<string, Cutscene>;
  activeCutsceneId: string | null;
  isPlaying: boolean;
  currentDialogueId: string | null;
  
  // Actions
  registerCutscene: (cutscene: Cutscene) => void;
  playCutscene: (cutsceneId: string, onComplete?: () => void) => void;
  skipCutscene: () => void;
  stopCutscene: () => void;
  nextDialogue: () => void;
  selectDialogueOption: (optionIndex: number) => void;
  
  // Getters
  getActiveCutscene: () => Cutscene | null;
  getCurrentDialogue: () => DialogueNode | null;
}

// Create cutscene store
export const useCutsceneStore = create<CutsceneStore>((set, get) => ({
  cutscenes: {},
  activeCutsceneId: null,
  isPlaying: false,
  currentDialogueId: null,
  
  registerCutscene: (cutscene) => {
    set(state => ({
      cutscenes: {
        ...state.cutscenes,
        [cutscene.id]: cutscene
      }
    }));
  },
  
  playCutscene: (cutsceneId, onComplete) => {
    const { cutscenes } = get();
    const cutscene = cutscenes[cutsceneId];
    
    if (!cutscene) {
      console.error(`Cutscene with id "${cutsceneId}" not found`);
      return;
    }
    
    console.log(`Playing cutscene: ${cutsceneId}`);
    
    // Set up the cutscene
    const updatedCutscene = {
      ...cutscene,
      onComplete: onComplete || cutscene.onComplete
    };
    
    set({
      activeCutsceneId: cutsceneId,
      isPlaying: true,
      currentDialogueId: cutscene.dialogues && cutscene.dialogues.length > 0 
        ? cutscene.dialogues[0].id 
        : null
    });
    
    // Register the updated cutscene
    get().registerCutscene(updatedCutscene);
    
    // If it's a timed cutscene without dialogues, set a timeout to end it
    if (cutscene.duration && (!cutscene.dialogues || cutscene.dialogues.length === 0)) {
      setTimeout(() => {
        get().stopCutscene();
      }, cutscene.duration);
    }
  },
  
  skipCutscene: () => {
    const { activeCutsceneId, cutscenes } = get();
    
    if (!activeCutsceneId) return;
    
    const cutscene = cutscenes[activeCutsceneId];
    
    if (!cutscene || !cutscene.skippable) return;
    
    console.log(`Skipping cutscene: ${activeCutsceneId}`);
    get().stopCutscene();
  },
  
  stopCutscene: () => {
    const { activeCutsceneId, cutscenes } = get();
    
    if (!activeCutsceneId) return;
    
    const cutscene = cutscenes[activeCutsceneId];
    
    console.log(`Stopping cutscene: ${activeCutsceneId}`);
    
    // Clean up and reset state
    set({
      activeCutsceneId: null,
      isPlaying: false,
      currentDialogueId: null
    });
    
    // Call onComplete callback if it exists
    if (cutscene && cutscene.onComplete) {
      cutscene.onComplete();
    }
  },
  
  nextDialogue: () => {
    const { activeCutsceneId, currentDialogueId, cutscenes } = get();
    
    if (!activeCutsceneId || !currentDialogueId) return;
    
    const cutscene = cutscenes[activeCutsceneId];
    if (!cutscene || !cutscene.dialogues) return;
    
    // Find current dialogue
    const currentDialogue = cutscene.dialogues.find(d => d.id === currentDialogueId);
    if (!currentDialogue) return;
    
    // If dialogue has options and none selected yet, return
    if (currentDialogue.options && currentDialogue.options.length > 0) {
      return;
    }
    
    // Check if there's a next dialogue
    if (currentDialogue.nextId) {
      console.log(`Moving to next dialogue: ${currentDialogue.nextId}`);
      set({ currentDialogueId: currentDialogue.nextId });
    } else {
      // No more dialogues, end cutscene
      console.log('No more dialogues, ending cutscene');
      get().stopCutscene();
    }
  },
  
  selectDialogueOption: (optionIndex) => {
    const { activeCutsceneId, currentDialogueId, cutscenes } = get();
    
    if (!activeCutsceneId || !currentDialogueId) return;
    
    const cutscene = cutscenes[activeCutsceneId];
    if (!cutscene || !cutscene.dialogues) return;
    
    // Find current dialogue
    const currentDialogue = cutscene.dialogues.find(d => d.id === currentDialogueId);
    if (!currentDialogue || !currentDialogue.options || optionIndex >= currentDialogue.options.length) return;
    
    const selectedOption = currentDialogue.options[optionIndex];
    
    // Execute option action if it exists
    if (selectedOption.action) {
      selectedOption.action();
    }
    
    // Move to next dialogue if specified
    if (selectedOption.nextId) {
      console.log(`Selected option leads to dialogue: ${selectedOption.nextId}`);
      set({ currentDialogueId: selectedOption.nextId });
    } else {
      // End cutscene if no next dialogue
      console.log('No next dialogue for selected option, ending cutscene');
      get().stopCutscene();
    }
  },
  
  getActiveCutscene: () => {
    const { activeCutsceneId, cutscenes } = get();
    return activeCutsceneId ? cutscenes[activeCutsceneId] : null;
  },
  
  getCurrentDialogue: () => {
    const { activeCutsceneId, currentDialogueId, cutscenes } = get();
    
    if (!activeCutsceneId || !currentDialogueId) return null;
    
    const cutscene = cutscenes[activeCutsceneId];
    if (!cutscene || !cutscene.dialogues) return null;
    
    return cutscene.dialogues.find(d => d.id === currentDialogueId) || null;
  }
}));

// Cutscene UI Component
export class CutsceneUI {
  private container: HTMLDivElement;
  private dialogueBox: HTMLDivElement;
  private characterName: HTMLDivElement;
  private dialogueText: HTMLDivElement;
  private optionsContainer: HTMLDivElement;
  private skipButton: HTMLButtonElement;
  private portrait: HTMLImageElement;
  private background: HTMLDivElement;
  
  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'cutscene-container';
    this.container.style.display = 'none';
    
    // Create background
    this.background = document.createElement('div');
    this.background.className = 'cutscene-background';
    this.container.appendChild(this.background);
    
    // Create portrait
    this.portrait = document.createElement('img');
    this.portrait.className = 'cutscene-portrait';
    this.container.appendChild(this.portrait);
    
    // Create dialogue box
    this.dialogueBox = document.createElement('div');
    this.dialogueBox.className = 'cutscene-dialogue-box';
    
    // Create character name element
    this.characterName = document.createElement('div');
    this.characterName.className = 'cutscene-character-name';
    this.dialogueBox.appendChild(this.characterName);
    
    // Create dialogue text element
    this.dialogueText = document.createElement('div');
    this.dialogueText.className = 'cutscene-dialogue-text';
    this.dialogueBox.appendChild(this.dialogueText);
    
    // Create options container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = 'cutscene-options-container';
    this.dialogueBox.appendChild(this.optionsContainer);
    
    // Create skip button
    this.skipButton = document.createElement('button');
    this.skipButton.className = 'cutscene-skip-button';
    this.skipButton.textContent = 'Skip';
    this.skipButton.addEventListener('click', () => {
      useCutsceneStore.getState().skipCutscene();
    });
    
    // Add elements to container
    this.container.appendChild(this.dialogueBox);
    this.container.appendChild(this.skipButton);
    
    // Add container to document
    document.body.appendChild(this.container);
    
    // Add styles
    this.addStyles();
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .cutscene-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        pointer-events: auto;
      }
      
      .cutscene-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        z-index: -1;
      }
      
      .cutscene-portrait {
        position: absolute;
        bottom: 250px;
        left: 50px;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        border: 3px solid #ffd700;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
      }
      
      .cutscene-dialogue-box {
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid #ffd700;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 50px;
        width: 80%;
        max-width: 800px;
      }
      
      .cutscene-character-name {
        color: #ffd700;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .cutscene-dialogue-text {
        color: #fff;
        font-size: 18px;
        line-height: 1.4;
        margin-bottom: 20px;
      }
      
      .cutscene-options-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .cutscene-option {
        background-color: rgba(50, 50, 50, 0.8);
        border: 1px solid #aaa;
        border-radius: 5px;
        padding: 10px;
        color: #fff;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .cutscene-option:hover {
        background-color: rgba(80, 80, 80, 0.8);
        border-color: #ffd700;
      }
      
      .cutscene-skip-button {
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #fff;
        border-radius: 5px;
        color: #fff;
        padding: 5px 10px;
        cursor: pointer;
      }
      
      .cutscene-skip-button:hover {
        background-color: rgba(50, 50, 50, 0.7);
      }
    `;
    document.head.appendChild(style);
  }
  
  private initEventListeners(): void {
    // Click to advance dialogue
    this.dialogueBox.addEventListener('click', event => {
      // Don't advance if clicked on an option
      if ((event.target as HTMLElement).classList.contains('cutscene-option')) {
        return;
      }
      
      // Advance dialogue
      useCutsceneStore.getState().nextDialogue();
    });
    
    // Subscribe to cutscene store changes
    useCutsceneStore.subscribe(state => {
      if (state.isPlaying) {
        this.show();
        this.updateContent();
      } else {
        this.hide();
      }
    });
  }
  
  private updateContent(): void {
    const cutsceneStore = useCutsceneStore.getState();
    const activeCutscene = cutsceneStore.getActiveCutscene();
    const currentDialogue = cutsceneStore.getCurrentDialogue();
    
    if (!activeCutscene) {
      this.hide();
      return;
    }
    
    // Update background if provided
    if (activeCutscene.backgroundImage) {
      this.background.style.backgroundImage = `url(${activeCutscene.backgroundImage})`;
    } else {
      this.background.style.backgroundImage = 'none';
      this.background.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }
    
    // Update skip button visibility
    this.skipButton.style.display = activeCutscene.skippable ? 'block' : 'none';
    
    // If there's no dialogue, hide dialogue box
    if (!currentDialogue) {
      this.dialogueBox.style.display = 'none';
      this.portrait.style.display = 'none';
      return;
    }
    
    // Show dialogue box
    this.dialogueBox.style.display = 'block';
    
    // Update portrait if provided
    if (currentDialogue.portrait) {
      this.portrait.src = currentDialogue.portrait;
      this.portrait.style.display = 'block';
    } else {
      this.portrait.style.display = 'none';
    }
    
    // Update character name and text
    this.characterName.textContent = currentDialogue.character;
    this.dialogueText.textContent = currentDialogue.text;
    
    // Update options if any
    this.optionsContainer.innerHTML = '';
    
    if (currentDialogue.options && currentDialogue.options.length > 0) {
      currentDialogue.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'cutscene-option';
        optionElement.textContent = option.text;
        optionElement.addEventListener('click', () => {
          cutsceneStore.selectDialogueOption(index);
        });
        this.optionsContainer.appendChild(optionElement);
      });
    }
  }
  
  public show(): void {
    this.container.style.display = 'flex';
  }
  
  public hide(): void {
    this.container.style.display = 'none';
  }
  
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Example cutscene for game intro
export const gamePrologueCutscene: Cutscene = {
  id: 'game_prologue',
  type: CutsceneType.INTRO,
  title: 'A New Beginning',
  backgroundImage: '/images/cutscenes/lumbridge_castle.jpg',
  music: '/audio/cutscenes/prologue_theme.mp3',
  skippable: true,
  dialogues: [
    {
      id: 'intro1',
      character: 'Narrator',
      text: 'Welcome to the world of Gielinor, a land of magic and adventure.',
      nextId: 'intro2'
    },
    {
      id: 'intro2',
      character: 'Narrator',
      text: 'You have arrived in the peaceful town of Lumbridge, ready to forge your own path.',
      nextId: 'intro3'
    },
    {
      id: 'intro3',
      character: 'Town Guard',
      portrait: '/images/portraits/guard.png',
      text: 'Halt, traveler! Welcome to Lumbridge. You look like you\'re new around here.',
      nextId: 'intro4'
    },
    {
      id: 'intro4',
      character: 'Town Guard',
      portrait: '/images/portraits/guard.png',
      text: 'The town has been having some trouble with goblins lately. Perhaps you could help us?',
      options: [
        {
          text: 'I\'d be happy to help.',
          nextId: 'intro5_help'
        },
        {
          text: 'I need to get settled first.',
          nextId: 'intro5_later'
        }
      ]
    },
    {
      id: 'intro5_help',
      character: 'Town Guard',
      portrait: '/images/portraits/guard.png',
      text: 'Excellent! Speak with the mayor when you\'re ready to begin.',
      nextId: 'intro6'
    },
    {
      id: 'intro5_later',
      character: 'Town Guard',
      portrait: '/images/portraits/guard.png',
      text: 'Understandable. Find me when you\'re ready, and I\'ll introduce you to the mayor.',
      nextId: 'intro6'
    },
    {
      id: 'intro6',
      character: 'Narrator',
      text: 'And so your adventure begins. What path will you choose in the world of Gielinor?'
    }
  ],
  onComplete: () => {
    // Start the first quest or enable it
    console.log('Prologue complete, enabling first quest');
  }
}; 