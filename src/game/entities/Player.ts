import { Container, Sprite, Texture } from 'pixi.js';
import { useGameStore } from '../stores/gameStore';

export class Player extends Container {
  private sprite: Sprite;
  private moveSpeed: number = 2;
  private keys: { [key: string]: boolean } = {};

  constructor() {
    super();
    this.sprite = new Sprite(Texture.WHITE);
    this.sprite.width = 48;
    this.sprite.height = 48;
    this.sprite.tint = 0xff0000;
    
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);

    const { playerPosition } = useGameStore.getState();
    this.x = playerPosition.x;
    this.y = playerPosition.y;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = true;
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = false;
  }

  public update(delta: number): void {
    let dx = 0;
    let dy = 0;

    if (this.keys['w']) dy -= this.moveSpeed * delta;
    if (this.keys['s']) dy += this.moveSpeed * delta;
    if (this.keys['a']) dx -= this.moveSpeed * delta;
    if (this.keys['d']) dx += this.moveSpeed * delta;

    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / length) * this.moveSpeed * delta;
      dy = (dy / length) * this.moveSpeed * delta;
    }

    if (dx !== 0 || dy !== 0) {
      this.x += dx * 5;
      this.y += dy * 5;

      useGameStore.getState().updatePlayerPosition(this.x, this.y);
    }
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    super.destroy();
  }
} 