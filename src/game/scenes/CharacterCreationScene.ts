import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

export class CharacterCreationScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private character: THREE.Group = new THREE.Group();
  private rotationSpeed: number = 0.005;
  private currentRotation: number = 0;
  private animationFrame: number | null = null;
  private characterOptions = {
    skinColor: 0xffd700,
    hairColor: 0x4a4a4a,
    outfitColor: 0x964B00,
  };

  constructor() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a); // Dark background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    
    // Add renderer to the page
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '0';
    container.appendChild(this.renderer.domElement);
    document.body.appendChild(container);

    // Setup lighting
    this.setupLighting();

    // Create character preview
    this.createCharacterPreview();

    // Create UI
    this.createUI();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Initial render
    this.renderer.render(this.scene, this.camera);
  }

  private setupLighting(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Add point light from the front
    const frontLight = new THREE.PointLight(0xffffff, 0.5);
    frontLight.position.set(0, 2, 5);
    this.scene.add(frontLight);
  }

  private createCharacterPreview(): void {
    // Create body
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.characterOptions.outfitColor,
      roughness: 0.7,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    this.character.add(body);

    // Create head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: this.characterOptions.skinColor,
      roughness: 0.5,
      metalness: 0.5,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.4;
    head.castShadow = true;
    this.character.add(head);

    // Create arms
    const armGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: this.characterOptions.outfitColor,
      roughness: 0.7,
      metalness: 0.3,
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 1.5, 0);
    leftArm.castShadow = true;
    this.character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 1.5, 0);
    rightArm.castShadow = true;
    this.character.add(rightArm);

    // Create legs
    const legGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.2,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.25, 0);
    leftLeg.castShadow = true;
    this.character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.25, 0);
    rightLeg.castShadow = true;
    this.character.add(rightLeg);

    // Add character to scene
    this.scene.add(this.character);

    // Add a platform under the character
    const platformGeometry = new THREE.CircleGeometry(2, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.position.y = -0.5;
    platform.receiveShadow = true;
    this.scene.add(platform);
  }

  private createUI(): void {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.left = '20px';
    container.style.color = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '1000';
    container.style.padding = '20px';
    container.style.background = 'rgba(0, 0, 0, 0.7)';
    container.style.borderRadius = '10px';

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Create Your Character';
    title.style.marginBottom = '20px';
    container.appendChild(title);

    // Skin Color Slider
    const skinColorContainer = this.createColorSlider('Skin Color', this.characterOptions.skinColor, (color) => {
      this.characterOptions.skinColor = color;
      this.updateCharacterColors();
    });
    container.appendChild(skinColorContainer);

    // Hair Color Slider
    const hairColorContainer = this.createColorSlider('Hair Color', this.characterOptions.hairColor, (color) => {
      this.characterOptions.hairColor = color;
      this.updateCharacterColors();
    });
    container.appendChild(hairColorContainer);

    // Outfit Color Slider
    const outfitColorContainer = this.createColorSlider('Outfit Color', this.characterOptions.outfitColor, (color) => {
      this.characterOptions.outfitColor = color;
      this.updateCharacterColors();
    });
    container.appendChild(outfitColorContainer);

    // Create Character Button
    const createButton = document.createElement('button');
    createButton.textContent = 'Create Character';
    createButton.style.marginTop = '20px';
    createButton.style.padding = '10px 20px';
    createButton.style.fontSize = '16px';
    createButton.style.cursor = 'pointer';
    createButton.style.backgroundColor = '#4CAF50';
    createButton.style.color = 'white';
    createButton.style.border = 'none';
    createButton.style.borderRadius = '5px';
    createButton.style.width = '100%';
    createButton.onclick = () => this.createCharacter();
    container.appendChild(createButton);

    document.body.appendChild(container);
  }

  private createColorSlider(label: string, initialColor: number, onChange: (color: number) => void): HTMLDivElement {
    const container = document.createElement('div');
    container.style.marginBottom = '15px';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.display = 'block';
    labelElement.style.marginBottom = '5px';
    container.appendChild(labelElement);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '360';
    slider.value = this.rgbToHue(initialColor).toString();
    slider.style.width = '200px';
    slider.style.accentColor = '#4CAF50';
    slider.oninput = (e) => {
      const hue = parseInt((e.target as HTMLInputElement).value);
      const color = this.hueToRgb(hue);
      onChange(color);
    };
    container.appendChild(slider);

    return container;
  }

  private rgbToHue(rgb: number): number {
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max === min) {
      h = 0;
    } else if (max === r) {
      h = 60 * ((g - b) / (max - min));
    } else if (max === g) {
      h = 60 * (2 + (b - r) / (max - min));
    } else {
      h = 60 * (4 + (r - g) / (max - min));
    }

    if (h < 0) h += 360;
    return h;
  }

  private hueToRgb(hue: number): number {
    const c = 255;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = 0;
    let r = 0, g = 0, b = 0;

    if (hue < 60) {
      r = c; g = x; b = 0;
    } else if (hue < 120) {
      r = x; g = c; b = 0;
    } else if (hue < 180) {
      r = 0; g = c; b = x;
    } else if (hue < 240) {
      r = 0; g = x; b = c;
    } else if (hue < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return (r + m) << 16 | (g + m) << 8 | (b + m);
  }

  private updateCharacterColors(): void {
    // Update head (skin color)
    const head = this.character.children.find(child => child.position.y === 2.4);
    if (head) {
      (head as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: this.characterOptions.skinColor,
        roughness: 0.5,
        metalness: 0.5,
      });
    }

    // Update body and arms (outfit color)
    const bodyAndArms = this.character.children.filter(child => 
      child.position.y === 1 || 
      child.position.y === 1.5
    );
    bodyAndArms.forEach(mesh => {
      (mesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: this.characterOptions.outfitColor,
        roughness: 0.7,
        metalness: 0.3,
      });
    });
  }

  private createCharacter(): void {
    console.log('Creating character...');
    
    try {
      // Convert colors to hex strings
      const customization = {
        skinColor: '#' + this.characterOptions.skinColor.toString(16).padStart(6, '0'),
        hairColor: '#' + this.characterOptions.hairColor.toString(16).padStart(6, '0'),
        outfitColor: '#' + this.characterOptions.outfitColor.toString(16).padStart(6, '0')
      };
      
      console.log('Character customization:', customization);

      // Clean up resources before transition
      this.cleanupScene();
      
      // Update game state with character customization and transition to game scene
      const gameStore = useGameStore.getState();
      gameStore.setCharacterCustomization(customization);
      
      // A small delay before changing scenes to ensure cleanup completes
      setTimeout(() => {
        console.log('Transitioning to lumbridge scene');
        gameStore.setCurrentScene('lumbridge');
      }, 100);
    } catch (error) {
      console.error('Error creating character:', error);
    }
  }
  
  private cleanupScene(): void {
    console.log('Cleaning up character creation scene');
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Remove any UI elements
    const ui = document.querySelectorAll('.character-creation-ui');
    ui.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Stop animation and remove renderer
    if (this.renderer) {
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
    
    // Clear scene
    while(this.scene.children.length > 0) { 
      const object = this.scene.children[0];
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
      this.scene.remove(object);
    }
    
    console.log('Character creation scene cleanup complete');
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public update(): void {
    // Rotate character preview
    this.currentRotation += this.rotationSpeed;
    this.character.rotation.y = this.currentRotation;

    // Render the scene
    this.renderer.render(this.scene, this.camera);

    // Request next frame
    this.animationFrame = requestAnimationFrame(() => this.update());
  }

  public destroy(): void {
    console.log('Destroying character creation scene');
    
    // Stop animation loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Remove all UI elements
    const uiElements = document.querySelectorAll('.character-creation-ui');
    uiElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // Dispose of Three.js resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    // Remove renderer and its container
    if (this.renderer) {
      const container = this.renderer.domElement.parentNode;
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      this.renderer.dispose();
    }

    // Clear scene
    while(this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);
    }

    console.log('Character creation scene destroyed');
  }
} 