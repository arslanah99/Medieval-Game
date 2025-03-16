import * as THREE from 'three';

export class Town {
  private buildings: THREE.Mesh[] = [];
  private collisionObjects: THREE.Mesh[] = [];
  private townCenter: THREE.Vector3;

  constructor(scene: THREE.Scene, position: THREE.Vector3, globalCollisionObjects: THREE.Mesh[]) {
    this.townCenter = position.clone();
    
    // Create town buildings
    this.createBuildings(scene, position);
    
    // Add town collision objects to the provided global collision objects array
    globalCollisionObjects.push(...this.collisionObjects);
  }

  private createBuildings(scene: THREE.Scene, position: THREE.Vector3): void {
    // Create a main building (tavern)
    const tavernGeometry = new THREE.BoxGeometry(8, 6, 10);
    const tavernMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd2b48c,
      roughness: 0.7,
      metalness: 0.2
    });
    const tavern = new THREE.Mesh(tavernGeometry, tavernMaterial);
    tavern.position.set(position.x, position.y + 3, position.z);
    tavern.castShadow = true;
    tavern.receiveShadow = true;
    scene.add(tavern);
    this.buildings.push(tavern);
    this.collisionObjects.push(tavern);
    
    // Create a roof for tavern
    const tavernRoofGeometry = new THREE.ConeGeometry(10, 4, 4);
    const tavernRoofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1
    });
    const tavernRoof = new THREE.Mesh(tavernRoofGeometry, tavernRoofMaterial);
    tavernRoof.position.set(position.x, position.y + 8, position.z);
    tavernRoof.castShadow = true;
    scene.add(tavernRoof);
    
    // Create a shop building
    const shopGeometry = new THREE.BoxGeometry(6, 5, 6);
    const shopMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe5d3b3, 
      roughness: 0.7,
      metalness: 0.2
    });
    const shop = new THREE.Mesh(shopGeometry, shopMaterial);
    shop.position.set(position.x - 12, position.y + 2.5, position.z - 10);
    shop.castShadow = true;
    shop.receiveShadow = true;
    scene.add(shop);
    this.buildings.push(shop);
    this.collisionObjects.push(shop);
    
    // Create shop roof
    const shopRoofGeometry = new THREE.ConeGeometry(7, 3, 4);
    const shopRoofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1
    });
    const shopRoof = new THREE.Mesh(shopRoofGeometry, shopRoofMaterial);
    shopRoof.position.set(position.x - 12, position.y + 6.5, position.z - 10);
    shopRoof.castShadow = true;
    scene.add(shopRoof);
    
    // Create a house
    const houseGeometry = new THREE.BoxGeometry(5, 4, 5);
    const houseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5dc, 
      roughness: 0.7,
      metalness: 0.2
    });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(position.x + 15, position.y + 2, position.z - 10);
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);
    this.buildings.push(house);
    this.collisionObjects.push(house);
    
    // Create house roof
    const houseRoofGeometry = new THREE.ConeGeometry(6, 2.5, 4);
    const houseRoofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1
    });
    const houseRoof = new THREE.Mesh(houseRoofGeometry, houseRoofMaterial);
    houseRoof.position.set(position.x + 15, position.y + 5.25, position.z - 10);
    houseRoof.castShadow = true;
    scene.add(houseRoof);
    
    // Create a training ground
    const groundGeometry = new THREE.CircleGeometry(8, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xa0522d, 
      roughness: 0.9,
      metalness: 0
    });
    const trainingGround = new THREE.Mesh(groundGeometry, groundMaterial);
    trainingGround.rotation.x = -Math.PI / 2;
    trainingGround.position.set(position.x, position.y + 0.01, position.z + 15);
    trainingGround.receiveShadow = true;
    scene.add(trainingGround);
    
    // Create training dummies
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const dummyX = position.x + Math.sin(angle) * 5;
      const dummyZ = position.z + 15 + Math.cos(angle) * 5;
      
      this.createTrainingDummy(scene, new THREE.Vector3(dummyX, position.y, dummyZ));
    }
  }
  
  private createTrainingDummy(scene: THREE.Scene, position: THREE.Vector3): void {
    // Create dummy base
    const baseGeometry = new THREE.CylinderGeometry(0.3, 0.5, 0.5, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(position.x, position.y + 0.25, position.z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    
    // Create dummy post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1
    });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(position.x, position.y + 1.5, position.z);
    post.castShadow = true;
    scene.add(post);
    
    // Create dummy body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.9,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(position.x, position.y + 2, position.z);
    body.castShadow = true;
    scene.add(body);
    
    // Create dummy head
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5deb3,
      roughness: 0.9,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(position.x, position.y + 2.65, position.z);
    head.castShadow = true;
    scene.add(head);
    
    // Add collision object for the dummy
    const dummyCollider = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 3, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    dummyCollider.position.set(position.x, position.y + 1.5, position.z);
    scene.add(dummyCollider);
    this.collisionObjects.push(dummyCollider);
  }
  
  // Public methods
  public getCollisionObjects(): THREE.Mesh[] {
    return this.collisionObjects;
  }
  
  public getPosition(): THREE.Vector3 {
    return this.townCenter.clone();
  }
} 