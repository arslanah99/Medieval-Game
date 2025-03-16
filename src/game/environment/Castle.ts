import * as THREE from 'three';

export class Castle {
    private mesh: THREE.Group;
    private wallMaterial: THREE.MeshStandardMaterial;
    private stoneMaterial: THREE.MeshStandardMaterial;
    private woodMaterial: THREE.MeshStandardMaterial;
    private groundMaterial: THREE.MeshStandardMaterial;
    private roofMaterial: THREE.MeshStandardMaterial;
    private collisionMeshes: THREE.Mesh[] = []; // Track collision meshes separately

    constructor(scene: THREE.Scene) {
        this.mesh = new THREE.Group();
        
        // Initialize materials with realistic textures
        this.wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });

        this.stoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.9,
            metalness: 0.1
        });

        this.woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 1.0,
            metalness: 0.0
        });

        this.groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x556B2F,
            roughness: 1.0,
            metalness: 0.0
        });

        this.roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.0
        });

        this.createCastle();
        scene.add(this.mesh);
    }

    private createWall(width: number, height: number, depth: number, position: THREE.Vector3): THREE.Mesh {
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wall.position.copy(position);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.collisionMeshes.push(wall); // Add to collision meshes
        return wall;
    }

    private createTower(radius: number, height: number, position: THREE.Vector3): THREE.Group {
        const tower = new THREE.Group();

        // Main tower body
        const towerGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
        const towerMesh = new THREE.Mesh(towerGeometry, this.stoneMaterial);
        towerMesh.castShadow = true;
        towerMesh.receiveShadow = true;
        this.collisionMeshes.push(towerMesh); // Add to collision meshes

        // Tower roof
        const roofGeometry = new THREE.ConeGeometry(radius * 1.2, height * 0.4, 8);
        const roofMesh = new THREE.Mesh(roofGeometry, this.woodMaterial);
        roofMesh.position.y = height * 0.7;
        this.collisionMeshes.push(roofMesh); // Add to collision meshes

        tower.add(towerMesh);
        tower.add(roofMesh);
        tower.position.copy(position);

        return tower;
    }

    private createGate(width: number, height: number, depth: number, position: THREE.Vector3): THREE.Group {
        const gate = new THREE.Group();

        // Create gate frame sides (vertical pillars)
        const pillarWidth = width * 0.15;
        const pillarGeometry = new THREE.BoxGeometry(pillarWidth, height, depth);
        
        // Left pillar
        const leftPillar = new THREE.Mesh(pillarGeometry, this.stoneMaterial);
        leftPillar.position.x = -(width/2 - pillarWidth/2);
        this.collisionMeshes.push(leftPillar);
        
        // Right pillar
        const rightPillar = new THREE.Mesh(pillarGeometry, this.stoneMaterial);
        rightPillar.position.x = (width/2 - pillarWidth/2);
        this.collisionMeshes.push(rightPillar);
        
        // Top of the gate (arch)
        const topGeometry = new THREE.BoxGeometry(width, height * 0.2, depth);
        const top = new THREE.Mesh(topGeometry, this.stoneMaterial);
        top.position.y = height * 0.4;
        this.collisionMeshes.push(top);

        // Create decorative doors (no collision)
        const leftDoorGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.7, depth * 0.1);
        const leftDoor = new THREE.Mesh(leftDoorGeometry, this.woodMaterial);
        leftDoor.position.x = -(width * 0.4);
        leftDoor.position.z = depth * 0.6;
        leftDoor.rotation.y = Math.PI * 0.85; // Almost fully open

        const rightDoorGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.7, depth * 0.1);
        const rightDoor = new THREE.Mesh(rightDoorGeometry, this.woodMaterial);
        rightDoor.position.x = width * 0.4;
        rightDoor.position.z = depth * 0.6;
        rightDoor.rotation.y = -Math.PI * 0.85; // Almost fully open

        gate.add(leftPillar);
        gate.add(rightPillar);
        gate.add(top);
        gate.add(leftDoor);
        gate.add(rightDoor);
        gate.position.copy(position);

        return gate;
    }

    private createInnerBuilding(position: THREE.Vector3): THREE.Group {
        const building = new THREE.Group();

        // Create a small hill (no collision)
        const hillGeometry = new THREE.ConeGeometry(10, 3, 32);
        const hillMaterial = new THREE.MeshStandardMaterial({
            color: 0x355E3B,
            roughness: 1.0
        });
        const hill = new THREE.Mesh(hillGeometry, hillMaterial);
        hill.position.y = 1.5;
        building.add(hill);

        // Building base
        const baseGeometry = new THREE.BoxGeometry(12, 8, 10);
        const base = new THREE.Mesh(baseGeometry, this.stoneMaterial);
        base.position.y = 4 + 1.5;
        base.castShadow = true;
        base.receiveShadow = true;
        this.collisionMeshes.push(base); // Add to collision meshes
        building.add(base);

        // Building roof
        const roofGeometry = new THREE.ConeGeometry(8, 6, 4);
        const roof = new THREE.Mesh(roofGeometry, this.roofMaterial);
        roof.position.y = 11 + 1.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        this.collisionMeshes.push(roof); // Add to collision meshes
        building.add(roof);

        // Add windows
        const windowGeometry = new THREE.BoxGeometry(1, 2, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xadd8e6,
            metalness: 0.8,
            roughness: 0.2
        });

        // Front windows
        const frontWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow1.position.set(-2, 4 + 1.5, 5.1);
        building.add(frontWindow1);

        const frontWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow2.position.set(2, 4 + 1.5, 5.1);
        building.add(frontWindow2);

        // Add door
        const doorGeometry = new THREE.BoxGeometry(2, 4, 0.2);
        const door = new THREE.Mesh(doorGeometry, this.woodMaterial);
        door.position.set(0, 2 + 1.5, 5.1);
        building.add(door);

        building.position.copy(position);
        return building;
    }

    private createCourtyard(): void {
        // Create textured ground with multiple layers (no collision)
        const groundGeometry = new THREE.PlaneGeometry(38, 38, 32, 32);
        
        // Base layer
        const ground = new THREE.Mesh(groundGeometry, this.groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.1;
        ground.receiveShadow = true;

        // Add some random height variations to create texture
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 1] = Math.random() * 0.2;
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();

        // Add some decorative patches (no collision)
        const patchGeometry = new THREE.CircleGeometry(3, 16);
        const darkPatchMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d5229,
            roughness: 1.0
        });

        for (let i = 0; i < 5; i++) {
            const patch = new THREE.Mesh(patchGeometry, darkPatchMaterial);
            patch.rotation.x = -Math.PI / 2;
            patch.position.set(
                (Math.random() - 0.5) * 30,
                0.11,
                (Math.random() - 0.5) * 30
            );
            this.mesh.add(patch);
        }

        this.mesh.add(ground);
    }

    private createCastle(): void {
        // Main walls
        const wallThickness = 2;
        const wallHeight = 15;
        
        // Front wall with gate opening
        const frontWallLeft = this.createWall(16, wallHeight, wallThickness, new THREE.Vector3(-12, wallHeight/2, 20));
        const frontWallRight = this.createWall(16, wallHeight, wallThickness, new THREE.Vector3(12, wallHeight/2, 20));
        this.mesh.add(frontWallLeft);
        this.mesh.add(frontWallRight);

        // Back wall
        const backWall = this.createWall(40, wallHeight, wallThickness, new THREE.Vector3(0, wallHeight/2, -20));
        this.mesh.add(backWall);

        // Side walls
        const leftWall = this.createWall(wallThickness, wallHeight, 40, new THREE.Vector3(-20, wallHeight/2, 0));
        this.mesh.add(leftWall);

        const rightWall = this.createWall(wallThickness, wallHeight, 40, new THREE.Vector3(20, wallHeight/2, 0));
        this.mesh.add(rightWall);

        // Corner towers
        const towerRadius = 4;
        const towerHeight = wallHeight * 1.5;
        
        const frontLeftTower = this.createTower(towerRadius, towerHeight, new THREE.Vector3(-20, towerHeight/2, 20));
        const frontRightTower = this.createTower(towerRadius, towerHeight, new THREE.Vector3(20, towerHeight/2, 20));
        const backLeftTower = this.createTower(towerRadius, towerHeight, new THREE.Vector3(-20, towerHeight/2, -20));
        const backRightTower = this.createTower(towerRadius, towerHeight, new THREE.Vector3(20, towerHeight/2, -20));

        this.mesh.add(frontLeftTower);
        this.mesh.add(frontRightTower);
        this.mesh.add(backLeftTower);
        this.mesh.add(backRightTower);

        // Main gate (with wide opening)
        const gate = this.createGate(10, 12, wallThickness * 2, new THREE.Vector3(0, 6, 20));
        this.mesh.add(gate);

        // Create improved courtyard
        this.createCourtyard();

        // Add inner building on hill
        const innerBuilding = this.createInnerBuilding(new THREE.Vector3(0, 0, -5));
        this.mesh.add(innerBuilding);
    }

    public getCollisionObjects(): THREE.Mesh[] {
        return this.collisionMeshes; // Return only the tracked collision meshes
    }

    public destroy(): void {
        // Dispose of geometries and materials
        this.mesh.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}
