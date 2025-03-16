import { create } from 'zustand';
import { GameState } from '../types/GameState';

interface CharacterCustomization {
  skinColor: string;
  hairColor: string;
  outfitColor: string;
}

export const useGameStore = create<{
  currentScene: string;
  characterCustomization?: CharacterCustomization;
  playerPosition: { x: number; z: number };
  initialize: () => void;
  setCurrentScene: (scene: string) => void;
  setCharacterCustomization: (customization: CharacterCustomization) => void;
  updatePlayerPosition: (x: number, z: number) => void;
}>((set) => ({
  currentScene: 'character-creation',
  characterCustomization: undefined,
  playerPosition: { x: 0, z: 0 },

  initialize: () => {
    set({
      currentScene: 'character-creation',
      characterCustomization: undefined,
      playerPosition: { x: 0, z: 0 }
    });
  },

  setCurrentScene: (scene) => {
    set({ currentScene: scene });
  },

  setCharacterCustomization: (customization) => {
    set({ characterCustomization: customization });
  },

  updatePlayerPosition: (x, z) => {
    set({ playerPosition: { x, z } });
  }
})); 