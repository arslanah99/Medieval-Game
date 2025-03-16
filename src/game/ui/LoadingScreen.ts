export class LoadingScreen {
  private container: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private statusText: HTMLDivElement;
  private loadingTips: string[] = [
    "Tip: Watch out for goblins near Lumbridge!",
    "Tip: Talk to NPCs for quests and information.",
    "Tip: Combat skills increase as you fight more enemies.",
    "Tip: Fishing is a relaxing way to earn gold.",
    "Tip: Mining and smithing can create valuable equipment."
  ];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'loading-screen';
    
    const logo = document.createElement('div');
    logo.className = 'loading-logo';
    logo.innerHTML = `<h1>Medieval Adventure</h1>`;
    
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'loading-progress-container';
    this.progressBar.innerHTML = `<div class="loading-progress-bar"></div>`;
    
    this.statusText = document.createElement('div');
    this.statusText.className = 'loading-status';
    this.statusText.textContent = 'Loading...';
    
    const tipElement = document.createElement('div');
    tipElement.className = 'loading-tip';
    tipElement.textContent = this.getRandomTip();
    
    this.container.appendChild(logo);
    this.container.appendChild(this.progressBar);
    this.container.appendChild(this.statusText);
    this.container.appendChild(tipElement);
    
    document.body.appendChild(this.container);
    
    // Add styles
    this.addStyles();
  }
  
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, #000000, #111111);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        color: #ffd700;
        font-family: 'Runescape UF', 'Runescape', 'Arial', sans-serif;
      }
      
      .loading-logo h1 {
        font-size: 48px;
        margin-bottom: 40px;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
      }
      
      .loading-progress-container {
        width: 80%;
        max-width: 600px;
        height: 30px;
        background-color: #222;
        border-radius: 15px;
        overflow: hidden;
        border: 2px solid #444;
      }
      
      .loading-progress-bar {
        width: 0%;
        height: 100%;
        background: linear-gradient(to right, #8B4513, #CD7F32);
        transition: width 0.3s ease;
      }
      
      .loading-status {
        margin-top: 15px;
        font-size: 18px;
        color: #ddd;
      }
      
      .loading-tip {
        position: absolute;
        bottom: 40px;
        font-size: 16px;
        color: #aaa;
        max-width: 80%;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }
  
  public setProgress(percent: number, statusText?: string): void {
    const progressBar = this.container.querySelector('.loading-progress-bar') as HTMLDivElement;
    progressBar.style.width = `${percent}%`;
    
    if (statusText) {
      this.statusText.textContent = statusText;
    }
  }
  
  private getRandomTip(): string {
    const randomIndex = Math.floor(Math.random() * this.loadingTips.length);
    return this.loadingTips[randomIndex];
  }
  
  public hide(): void {
    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 500);
  }
  
  public show(): void {
    this.container.style.display = 'flex';
    setTimeout(() => {
      this.container.style.opacity = '1';
    }, 10);
  }
  
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
} 