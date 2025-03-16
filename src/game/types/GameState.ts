export interface GameState {
  currentScene: string;
  characterCustomization?: {
    skinColor: string;
    hairColor: string;
    outfitColor: string;
  };
} 