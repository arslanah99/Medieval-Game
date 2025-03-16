import { Character3D } from '../entities/Character3D';
import { DialogueOption } from '../entities/NPC';
import { Quest, QuestObjective } from '../systems/QuestSystem';

export class GameUI {
  private container: HTMLDivElement;
  private healthBar: HTMLDivElement;
  private staminaBar: HTMLDivElement;
  private manaBar: HTMLDivElement;
  private interactionPrompt: HTMLDivElement;
  private dialogueBox: HTMLDivElement;
  private combatLog: HTMLDivElement;
  private alertBox: HTMLDivElement;
  private questLog: HTMLDivElement;
  
  constructor() {
    // Create main UI container
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '1000';
    document.body.appendChild(this.container);
    
    // Create status bars container
    const statusBarsContainer = document.createElement('div');
    statusBarsContainer.style.position = 'absolute';
    statusBarsContainer.style.bottom = '20px';
    statusBarsContainer.style.left = '20px';
    statusBarsContainer.style.width = '300px';
    this.container.appendChild(statusBarsContainer);
    
    // Create health bar
    const healthBarContainer = document.createElement('div');
    healthBarContainer.style.marginBottom = '10px';
    healthBarContainer.innerHTML = '<div style="color: white; font-family: Arial; margin-bottom: 5px;">Health</div>';
    statusBarsContainer.appendChild(healthBarContainer);
    
    const healthBarBg = document.createElement('div');
    healthBarBg.style.width = '100%';
    healthBarBg.style.height = '20px';
    healthBarBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    healthBarBg.style.borderRadius = '5px';
    healthBarContainer.appendChild(healthBarBg);
    
    this.healthBar = document.createElement('div');
    this.healthBar.className = 'health-bar';
    this.healthBar.style.width = '100%';
    this.healthBar.style.height = '100%';
    this.healthBar.style.backgroundColor = '#ff5555';
    this.healthBar.style.borderRadius = '5px';
    this.healthBar.style.transition = 'width 0.3s ease';
    healthBarBg.appendChild(this.healthBar);
    
    // Create stamina bar
    const staminaBarContainer = document.createElement('div');
    staminaBarContainer.style.marginBottom = '10px';
    staminaBarContainer.innerHTML = '<div style="color: white; font-family: Arial; margin-bottom: 5px;">Stamina</div>';
    statusBarsContainer.appendChild(staminaBarContainer);
    
    const staminaBarBg = document.createElement('div');
    staminaBarBg.style.width = '100%';
    staminaBarBg.style.height = '20px';
    staminaBarBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    staminaBarBg.style.borderRadius = '5px';
    staminaBarContainer.appendChild(staminaBarBg);
    
    this.staminaBar = document.createElement('div');
    this.staminaBar.className = 'stamina-bar';
    this.staminaBar.style.width = '100%';
    this.staminaBar.style.height = '100%';
    this.staminaBar.style.backgroundColor = '#55ff55';
    this.staminaBar.style.borderRadius = '5px';
    this.staminaBar.style.transition = 'width 0.3s ease';
    staminaBarBg.appendChild(this.staminaBar);
    
    // Create mana bar
    const manaBarContainer = document.createElement('div');
    manaBarContainer.style.marginBottom = '10px';
    manaBarContainer.innerHTML = '<div style="color: white; font-family: Arial; margin-bottom: 5px;">Mana</div>';
    statusBarsContainer.appendChild(manaBarContainer);
    
    const manaBarBg = document.createElement('div');
    manaBarBg.style.width = '100%';
    manaBarBg.style.height = '20px';
    manaBarBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    manaBarBg.style.borderRadius = '5px';
    manaBarContainer.appendChild(manaBarBg);
    
    this.manaBar = document.createElement('div');
    this.manaBar.className = 'mana-bar';
    this.manaBar.style.width = '100%';
    this.manaBar.style.height = '100%';
    this.manaBar.style.backgroundColor = '#5555ff';
    this.manaBar.style.borderRadius = '5px';
    this.manaBar.style.transition = 'width 0.3s ease';
    manaBarBg.appendChild(this.manaBar);
    
    // Create level and experience display
    const levelContainer = document.createElement('div');
    levelContainer.style.display = 'flex';
    levelContainer.style.justifyContent = 'space-between';
    levelContainer.style.alignItems = 'center';
    levelContainer.style.marginBottom = '10px';
    statusBarsContainer.appendChild(levelContainer);
    
    const levelText = document.createElement('div');
    levelText.className = 'level-text';
    levelText.style.color = 'white';
    levelText.style.fontFamily = 'Arial';
    levelText.textContent = 'Level 1';
    levelContainer.appendChild(levelText);
    
    const expContainer = document.createElement('div');
    expContainer.style.width = '70%';
    expContainer.style.height = '10px';
    expContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    expContainer.style.borderRadius = '5px';
    levelContainer.appendChild(expContainer);
    
    const expBar = document.createElement('div');
    expBar.className = 'experience-bar';
    expBar.style.width = '0%';
    expBar.style.height = '100%';
    expBar.style.backgroundColor = '#ffaa00';
    expBar.style.borderRadius = '5px';
    expBar.style.transition = 'width 0.3s ease';
    expContainer.appendChild(expBar);
    
    // Create interaction prompt
    this.interactionPrompt = document.createElement('div');
    this.interactionPrompt.style.position = 'absolute';
    this.interactionPrompt.style.top = '50%';
    this.interactionPrompt.style.left = '50%';
    this.interactionPrompt.style.transform = 'translate(-50%, -50%)';
    this.interactionPrompt.style.padding = '10px 20px';
    this.interactionPrompt.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.interactionPrompt.style.color = 'white';
    this.interactionPrompt.style.fontFamily = 'Arial';
    this.interactionPrompt.style.borderRadius = '5px';
    this.interactionPrompt.style.display = 'none';
    this.interactionPrompt.style.pointerEvents = 'none';
    this.container.appendChild(this.interactionPrompt);
    
    // Create dialogue box
    this.dialogueBox = document.createElement('div');
    this.dialogueBox.style.position = 'absolute';
    this.dialogueBox.style.bottom = '100px';
    this.dialogueBox.style.left = '50%';
    this.dialogueBox.style.transform = 'translateX(-50%)';
    this.dialogueBox.style.width = '600px';
    this.dialogueBox.style.padding = '20px';
    this.dialogueBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.dialogueBox.style.color = 'white';
    this.dialogueBox.style.fontFamily = 'Arial';
    this.dialogueBox.style.borderRadius = '10px';
    this.dialogueBox.style.display = 'none';
    this.dialogueBox.style.pointerEvents = 'auto';
    this.container.appendChild(this.dialogueBox);
    
    // Create combat log
    this.combatLog = document.createElement('div');
    this.combatLog.style.position = 'absolute';
    this.combatLog.style.top = '20px';
    this.combatLog.style.right = '20px';
    this.combatLog.style.width = '300px';
    this.combatLog.style.maxHeight = '200px';
    this.combatLog.style.overflowY = 'auto';
    this.combatLog.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.combatLog.style.color = 'white';
    this.combatLog.style.fontFamily = 'Arial';
    this.combatLog.style.padding = '10px';
    this.combatLog.style.borderRadius = '5px';
    this.combatLog.style.fontSize = '14px';
    this.combatLog.style.pointerEvents = 'auto';
    this.container.appendChild(this.combatLog);
    
    // Create alert box
    this.alertBox = document.createElement('div');
    this.alertBox.style.position = 'absolute';
    this.alertBox.style.top = '100px';
    this.alertBox.style.left = '50%';
    this.alertBox.style.transform = 'translateX(-50%)';
    this.alertBox.style.padding = '15px 30px';
    this.alertBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.alertBox.style.color = 'white';
    this.alertBox.style.fontFamily = 'Arial';
    this.alertBox.style.borderRadius = '5px';
    this.alertBox.style.display = 'none';
    this.alertBox.style.pointerEvents = 'none';
    this.alertBox.style.fontSize = '18px';
    this.alertBox.style.fontWeight = 'bold';
    this.container.appendChild(this.alertBox);
    
    // Create quest log
    this.questLog = document.createElement('div');
    this.questLog.style.position = 'absolute';
    this.questLog.style.top = '20px';
    this.questLog.style.left = '20px';
    this.questLog.style.width = '300px';
    this.questLog.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.questLog.style.color = 'white';
    this.questLog.style.fontFamily = 'Arial';
    this.questLog.style.padding = '10px';
    this.questLog.style.borderRadius = '5px';
    this.questLog.style.display = 'none';
    this.questLog.style.pointerEvents = 'auto';
    this.questLog.innerHTML = '<h3 style="margin-top: 0;">Active Quests</h3><div class="quest-list"></div>';
    this.container.appendChild(this.questLog);
    
    // Handle toggle quest log with 'Q' key
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'q') {
        this.questLog.style.display = this.questLog.style.display === 'none' ? 'block' : 'none';
      }
    });
    
    console.log('GameUI initialized');
  }
  
  public showInteractionPrompt(npcName?: string, promptText?: string): void {
    if (npcName && promptText) {
      this.interactionPrompt.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${npcName}</div>${promptText}`;
      this.interactionPrompt.style.display = 'block';
    } else {
      this.interactionPrompt.innerHTML = 'Press E to interact';
      this.interactionPrompt.style.display = 'block';
    }
  }
  
  public hideInteractionPrompt(): void {
    this.interactionPrompt.style.display = 'none';
  }
  
  public showDialogue(npcName: string, options: string[] | any[]): void {
    // Clear previous dialogue
    this.dialogueBox.innerHTML = '';
    
    // Add NPC name header
    const header = document.createElement('h3');
    header.style.margin = '0 0 15px 0';
    header.textContent = npcName;
    this.dialogueBox.appendChild(header);
    
    // Add dialogue options
    if (Array.isArray(options)) {
      options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.style.marginBottom = '10px';
        optionElement.style.padding = '8px';
        optionElement.style.borderRadius = '5px';
        optionElement.style.cursor = 'pointer';
        optionElement.style.transition = 'background-color 0.2s';
        
        // Handle different option formats
        let text = '';
        if (typeof option === 'string') {
          text = option;
        } else if (option && typeof option === 'object' && 'text' in option) {
          text = option.text;
        }
        
        optionElement.textContent = text;
        
        // Add hover effect
        optionElement.addEventListener('mouseover', () => {
          optionElement.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });
        
        optionElement.addEventListener('mouseout', () => {
          optionElement.style.backgroundColor = 'transparent';
        });
        
        // Add click handler
        optionElement.addEventListener('click', () => {
          // TODO: Handle dialogue option selection
          console.log(`Selected option: ${text}`);
          
          // Show response if available
          if (typeof option === 'object' && 'response' in option) {
            this.showDialogueResponse(npcName, option.response);
            
            // Execute action if available
            if (typeof option === 'object' && 'action' in option && typeof option.action === 'function') {
              option.action();
            }
          }
        });
        
        this.dialogueBox.appendChild(optionElement);
      });
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '15px';
    closeButton.style.padding = '8px 15px';
    closeButton.style.backgroundColor = '#555';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
      this.hideDialogue();
    });
    this.dialogueBox.appendChild(closeButton);
    
    // Show dialogue box
    this.dialogueBox.style.display = 'block';
  }
  
  private showDialogueResponse(npcName: string, response: string): void {
    // Clear previous dialogue
    this.dialogueBox.innerHTML = '';
    
    // Add NPC name header
    const header = document.createElement('h3');
    header.style.margin = '0 0 15px 0';
    header.textContent = npcName;
    this.dialogueBox.appendChild(header);
    
    // Add response text
    const responseElement = document.createElement('p');
    responseElement.style.marginBottom = '20px';
    responseElement.textContent = response;
    this.dialogueBox.appendChild(responseElement);
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.marginRight = '10px';
    backButton.style.padding = '8px 15px';
    backButton.style.backgroundColor = '#555';
    backButton.style.border = 'none';
    backButton.style.borderRadius = '5px';
    backButton.style.color = 'white';
    backButton.style.cursor = 'pointer';
    backButton.addEventListener('click', () => {
      // Go back to dialogue options
      // For simplicity, we'll just close the dialogue for now
      this.hideDialogue();
    });
    this.dialogueBox.appendChild(backButton);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '8px 15px';
    closeButton.style.backgroundColor = '#555';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
      this.hideDialogue();
    });
    this.dialogueBox.appendChild(closeButton);
  }
  
  public hideDialogue(): void {
    this.dialogueBox.style.display = 'none';
  }
  
  public addCombatLogMessage(message: string): void {
    const messageElement = document.createElement('div');
    messageElement.style.marginBottom = '5px';
    messageElement.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    messageElement.style.paddingBottom = '5px';
    messageElement.textContent = message;
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeElement = document.createElement('span');
    timeElement.style.color = '#aaa';
    timeElement.style.fontSize = '12px';
    timeElement.style.marginLeft = '5px';
    timeElement.textContent = `[${timestamp}]`;
    messageElement.appendChild(timeElement);
    
    // Add to combat log and scroll to bottom
    this.combatLog.appendChild(messageElement);
    this.combatLog.scrollTop = this.combatLog.scrollHeight;
    
    // Limit number of messages
    while (this.combatLog.children.length > 20) {
      this.combatLog.removeChild(this.combatLog.firstChild!);
    }
  }
  
  public showAlert(message: string, duration: number = 3000): void {
    this.alertBox.textContent = message;
    this.alertBox.style.display = 'block';
    
    // Hide after duration
    setTimeout(() => {
      this.alertBox.style.display = 'none';
    }, duration);
  }
  
  public showDamageIndicator(amount: number, isPlayerDamage: boolean, position: { x: number, y: number }): void {
    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.left = `${position.x}px`;
    indicator.style.top = `${position.y}px`;
    indicator.style.color = isPlayerDamage ? '#ff5555' : '#ff9900';
    indicator.style.fontFamily = 'Arial';
    indicator.style.fontWeight = 'bold';
    indicator.style.fontSize = '20px';
    indicator.style.textShadow = '2px 2px 2px black';
    indicator.style.pointerEvents = 'none';
    indicator.textContent = `-${amount}`;
    
    // Add animation
    indicator.animate(
      [
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-50px)', opacity: 0 }
      ],
      {
        duration: 1000,
        easing: 'ease-out'
      }
    );
    
    // Add to container
    this.container.appendChild(indicator);
    
    // Remove after animation
    setTimeout(() => {
      this.container.removeChild(indicator);
    }, 1000);
  }
  
  public showQuestOffer(quest: any, onAccept?: () => void, onDecline?: () => void): void {
    // Create quest offer modal
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.zIndex = '2000';
    modalOverlay.style.pointerEvents = 'auto';
    
    const modalContent = document.createElement('div');
    modalContent.style.width = '500px';
    modalContent.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
    modalContent.style.borderRadius = '10px';
    modalContent.style.padding = '20px';
    modalContent.style.color = 'white';
    modalContent.style.fontFamily = 'Arial';
    
    // Add quest title
    const titleElement = document.createElement('h2');
    titleElement.style.marginTop = '0';
    titleElement.style.color = '#ffaa00';
    titleElement.textContent = quest.title;
    modalContent.appendChild(titleElement);
    
    // Add quest description
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = quest.description;
    descriptionElement.style.marginBottom = '20px';
    modalContent.appendChild(descriptionElement);
    
    // Add objectives
    const objectivesTitle = document.createElement('h3');
    objectivesTitle.textContent = 'Objectives:';
    objectivesTitle.style.color = '#aaaaff';
    objectivesTitle.style.marginBottom = '10px';
    modalContent.appendChild(objectivesTitle);
    
    const objectivesList = document.createElement('ul');
    objectivesList.style.marginBottom = '20px';
    
    quest.objectives.forEach((objective: any) => {
      const objectiveItem = document.createElement('li');
      objectiveItem.textContent = objective.description;
      objectivesList.appendChild(objectiveItem);
    });
    
    modalContent.appendChild(objectivesList);
    
    // Add rewards
    const rewardsTitle = document.createElement('h3');
    rewardsTitle.textContent = 'Rewards:';
    rewardsTitle.style.color = '#aaaaff';
    rewardsTitle.style.marginBottom = '10px';
    modalContent.appendChild(rewardsTitle);
    
    const rewardsList = document.createElement('ul');
    rewardsList.style.marginBottom = '30px';
    
    if (quest.reward.experience) {
      const expItem = document.createElement('li');
      expItem.textContent = `${quest.reward.experience} experience`;
      rewardsList.appendChild(expItem);
    }
    
    if (quest.reward.gold) {
      const goldItem = document.createElement('li');
      goldItem.textContent = `${quest.reward.gold} gold`;
      rewardsList.appendChild(goldItem);
    }
    
    if (quest.reward.items && quest.reward.items.length > 0) {
      quest.reward.items.forEach((item: string) => {
        const itemElement = document.createElement('li');
        itemElement.textContent = item;
        rewardsList.appendChild(itemElement);
      });
    }
    
    modalContent.appendChild(rewardsList);
    
    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    modalContent.appendChild(buttonContainer);
    
    const acceptButton = document.createElement('button');
    acceptButton.textContent = 'Accept Quest';
    acceptButton.style.padding = '10px 20px';
    acceptButton.style.backgroundColor = '#4CAF50';
    acceptButton.style.border = 'none';
    acceptButton.style.borderRadius = '5px';
    acceptButton.style.color = 'white';
    acceptButton.style.cursor = 'pointer';
    acceptButton.style.fontWeight = 'bold';
    acceptButton.style.fontSize = '16px';
    acceptButton.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
      if (onAccept) onAccept();
    });
    buttonContainer.appendChild(acceptButton);
    
    const declineButton = document.createElement('button');
    declineButton.textContent = 'Decline';
    declineButton.style.padding = '10px 20px';
    declineButton.style.backgroundColor = '#f44336';
    declineButton.style.border = 'none';
    declineButton.style.borderRadius = '5px';
    declineButton.style.color = 'white';
    declineButton.style.cursor = 'pointer';
    declineButton.style.fontWeight = 'bold';
    declineButton.style.fontSize = '16px';
    declineButton.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
      if (onDecline) onDecline();
    });
    buttonContainer.appendChild(declineButton);
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
  }
  
  public updateActiveQuests(quests: any[]): void {
    const questList = this.questLog.querySelector('.quest-list') as HTMLDivElement;
    if (!questList) return;
    
    // Clear current quest list
    questList.innerHTML = '';
    
    if (quests.length === 0) {
      const noQuestsMessage = document.createElement('div');
      noQuestsMessage.textContent = 'No active quests';
      noQuestsMessage.style.color = '#aaa';
      noQuestsMessage.style.fontStyle = 'italic';
      questList.appendChild(noQuestsMessage);
      return;
    }
    
    // Add each quest
    quests.forEach(quest => {
      const questElement = document.createElement('div');
      questElement.style.marginBottom = '15px';
      questElement.style.paddingBottom = '15px';
      questElement.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
      
      // Add quest title
      const titleElement = document.createElement('div');
      titleElement.textContent = quest.title;
      titleElement.style.fontWeight = 'bold';
      titleElement.style.color = '#ffaa00';
      titleElement.style.marginBottom = '5px';
      questElement.appendChild(titleElement);
      
      // Add objectives
      const objectivesList = document.createElement('ul');
      objectivesList.style.margin = '0';
      objectivesList.style.paddingLeft = '20px';
      
      quest.objectives.forEach((objective: any) => {
        const objectiveItem = document.createElement('li');
        objectiveItem.style.fontSize = '14px';
        objectiveItem.style.color = objective.completed ? '#55ff55' : '#ffffff';
        
        // Add progress if available
        if (objective.progress !== undefined && objective.target !== undefined) {
          objectiveItem.textContent = `${objective.description} (${objective.progress}/${objective.target})`;
        } else {
          objectiveItem.textContent = objective.description;
        }
        
        objectivesList.appendChild(objectiveItem);
      });
      
      questElement.appendChild(objectivesList);
      questList.appendChild(questElement);
    });
    
    // Show quest log
    this.questLog.style.display = 'block';
  }
  
  public destroy(): void {
    // Remove all UI elements
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
} 