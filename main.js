import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


let AirObstacle, Bird, Cloud;
const dim = 6;
let lastChunk = ['first']
let allObjects = []

const generateObjectPos = (dim, usedPositions) => {
  const arr = [-dim, 0, dim];
  let grid = []
  for (let i in arr) {
    for (let j in arr) {
        grid.push([arr[i],arr[j]]);
    }
}
let avaliable;
  if(usedPositions) {
    avaliable = grid.filter(n => !usedPositions.some(([x, y]) => x === n[0] && y === n[1]))
  } else {
    avaliable = grid
  }
  const gridIdx = Math.floor(Math.random() * avaliable.length)
  return avaliable[gridIdx];
};

let modelsLoading = true;
class BasicCharacterControllerInput {
  constructor(characterController) {
    this._characterController = characterController;
    this._Init();
  }

  _Init() {
    this._keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    if (event.repeat) return;
    switch (event.keyCode) {
      case 87: // w
        if (!this._keys.up) {
          this._keys.up = true;
          this._characterController.moveUp();
        }
        break;
      case 65: // a
        if (!this._keys.left) {
          this._keys.left = true;
          this._characterController.moveLeft();
        }
        break;
      case 83: // s
        if (!this._keys.down) {
          this._keys.down = true;
          this._characterController.moveDown();
        }
        break;
      case 68: // d
        if (!this._keys.right) {
          this._keys.right = true;
          this._characterController.moveRight();
        }
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.up = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.down = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
    }
  }

  get movement() {
    return {
      up: this._keys.up,
      down: this._keys.down,
      left: this._keys.left,
      right: this._keys.right,
    };
  }
}

class GameDemo {
  constructor() {
    this._Initialize();
    this._input = new BasicCharacterControllerInput(this);
  }

  async _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    //camera
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0, 0, 70);

    //scene
    this._scene = new THREE.Scene();

    //lights
    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    await this._LoadModels();

    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);
    this._LoadPlane();
    //loading models


    this._RAF();

    this._addModel(Cloud.clone(), 18, 18, -18)
    let [x,y] = generateObjectPos(dim);
    this._addModel(Cloud.clone(), x, y, -18)
  }
  // generic solution
  // _generateObstacle () {
    
  //   const lastZ = allObjects[allObjects.length - 1].position.z ?? -18
  //   if(lastZ > -10) {
  //     const obst = Math.floor(Math.random() * 3);
  //     let usedPositions = [];
  //     for(let i = 0; i < obst; ++i ) {
  //       let [x,y] = generateObjectPos(dim, usedPositions);
  //       usedPositions.push([x,y]);
  //       this._addModel(Cloud.clone(), x, y, -18)
  //     }
  //   }
    
  // }


  //GUESS AND CHECK
  // _generateObstacle() {
  //   const lastZ = allObjects[allObjects.length - 1].position.z ?? -18;
  //   if (lastZ > -10) {
  //     const pathWidth = 6; // Adjust the width of the clear path
  //     const pathPosition = Math.floor(Math.random() * 3); // Adjust the position of the clear path

  //     const obst = Math.floor(Math.random() * 5);
  //     let usedPositions = [];
  //     for (let i = 0; i < obst; ++i) {
  //       let [x, y] = generateObjectPos(dim, usedPositions);

  //       // Check if the current position is within the clear path
  //       if (pathPosition === 0 && x !== -pathWidth && x !== pathWidth) {
  //         x = x < 0 ? x - pathWidth : x + pathWidth;
  //       } else if (pathPosition === 1 && y !== -pathWidth && y !== pathWidth) {
  //         y = y < 0 ? y - pathWidth : y + pathWidth;
  //       }

  //       usedPositions.push([x, y]);
  //       this._addModel(Cloud.clone(), x, y, -18);
  //     }
  //   }
  // }

  _generateObstacle() {
    const lastZ = allObjects[allObjects.length - 1].position.z ?? -18;
    if (lastZ > -10) {
      const pathWidth = 6; // Adjust the width of the clear path
      const pathPosition = Math.floor(Math.random() * 3); // Adjust the position of the clear path
  
      const obst = Math.floor(Math.random() * 5);
      let usedPositions = [];
      for (let i = 0; i < obst; ++i) {
        let [x, y] = generateObjectPos(dim, usedPositions);
  
        // Check if the current position is within the clear path
        if (pathPosition === 0 && x !== -pathWidth && x !== pathWidth) {
          x = x < 0 ? x - pathWidth : x + pathWidth;
        } else if (pathPosition === 1 && y !== -pathWidth && y !== pathWidth) {
          y = y < 0 ? y - pathWidth : y + pathWidth;
        }
  
        usedPositions.push([x, y]);
        this._addModel(Cloud.clone(), x, y, -18);
      }
    }
  }

  _generateChunks = (positions) => {
    const lastZ = allObjects[allObjects.length - 1].position.z ?? -18;

    positions.forEach((slice, i) => {
      slice.forEach(object => {
        this._addModel(Cloud.clone(), object[0], object[1], -i*18 - 18 + lastZ)
      })
    })

  }

  _chooseChunks = () => {
    const chunkA = [[[-dim, dim], [0, dim], [dim,0], [0,-dim]], [[-dim,dim], [0,0]], [[-dim,-dim], [0,0], [dim,dim], [dim,0], [dim,-dim]]];
    const chunkB = [[[-dim, dim], [-dim,0], [-dim,-dim], [dim,0]],  [[-dim,dim], [dim,dim], [dim,-dim]], [[-dim,-dim], [0,dim], [dim,dim], [dim,-dim]]];
    const chunkC = [[[0,0], [0,-dim], [dim,dim], [dim,0]], [[-dim,0], [dim,0]], [[-dim,-dim], [-dim,0], [-dim,dim], [dim,dim], [dim,0], [dim,-dim]]];
    const chunkD = [[[-dim,dim], [0,dim], [dim,dim], [dim,-dim]], [[-dim,dim], [-dim,0], [-dim,-dim], [0,dim], [dim,dim], [dim,0], [dim,-dim]], [[-dim,-dim], [0,dim], [0,-dim]]];
    const chunkE = [[[-dim,dim], [dim,dim], [dim,-dim]], [[0,dim], [0,0], [0,-dim]], [[-dim,dim], [-dim,-dim], [dim,dim]]];
    console.log(lastChunk)
    let chunk = lastChunk.pop()
    
    if(chunk === 'first') {
      const avaliableChunk = [this._generateChunks(chunkC), this._generateChunks(chunkD), this._generateChunks(chunkE)];
      const chosen = Math.floor(Math.random() * avaliableChunk.length)
      avaliableChunk[chosen];
      switch(chosen) {
        case 0:
          lastChunk.push('third');
          break;
        case 1:
          lastChunk.push('fourth');
          break;
        case 2:
          lastChunk.push('fifth');
          break;
        
      }
      return;
    }
    if(chunk === 'second') {
      const avaliableChunk = [this._generateChunks(chunkA), this._generateChunks(chunkE)];
      const chosen = Math.floor(Math.random() * avaliableChunk.length)
      avaliableChunk[chosen];
      switch(chosen) {
        case 0:
          lastChunk.push('first');
          break;
        case 1:
          lastChunk.push('fifth');
          break;
      }
      return;
    }
    if(chunk === 'third') {
      const avaliableChunk = [this._generateChunks(chunkA), this._generateChunks(chunkC), this._generateChunks(chunkE)];
      const chosen = Math.floor(Math.random() * avaliableChunk.length)
      avaliableChunk[chosen];
      switch(chosen) {
        case 0:
          lastChunk.push('first');
          break;
        case 1:
          lastChunk.push('third');
          break;
        case 2:
          lastChunk.push('fifth');
          break;
      }
      return;
    }
    if(chunk === 'fourth') {
      const avaliableChunk = [this._generateChunks(chunkA), this._generateChunks(chunkE)];
      const chosen = Math.floor(Math.random() * avaliableChunk.length)
      avaliableChunk[chosen];
      switch(chosen) {
        case 0:
          lastChunk.push('first');
          break;
        case 1:
          lastChunk.push('fifth');
          break;
      }
      return;
    }
    if(chunk === 'fifth') {
      const avaliableChunk = [this._generateChunks(chunkB), this._generateChunks(chunkC), this._generateChunks(chunkD)];
      const chosen = Math.floor(Math.random() * avaliableChunk.length)
      avaliableChunk[chosen];
      switch(chosen) {
        case 0:
          lastChunk.push('second');
          break;
        case 1:
          lastChunk.push('third');
          break;
        case 2:
          lastChunk.push('fourth');
          break;

      }
      return;
    }
  }

  _LoadPlane() {
    const loader = new GLTFLoader();
    loader.load('./resources/models/plane10x.glb', (gltf) => {
      gltf.scene.traverse(c => {
        c.castShadow = true;
      });

      this.player = gltf.scene.children[0];
      this.player.position.set(0, 0, 0);
      this.player.scale.set(0.7,0.7,0.7);
      this.player.rotateY(Math.PI / 2);
      this._scene.add(gltf.scene);
    });
  }

  async _LoadModels() {
    try {
      const loader = new GLTFLoader();

      const loadCloud = () => new Promise(resolve => loader.load('./resources/models/cloud.glb', resolve));
      const loadAirObstacle = () => new Promise(resolve => loader.load('./resources/models/Airplane-obstacle.glb', resolve));

      const [cloudResult, airObstacleResult] = await Promise.all([loadCloud(), loadAirObstacle()]);

      Cloud = cloudResult.scene;
      AirObstacle = airObstacleResult.scene;
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      modelsLoading = false;
    }
  }

  _addModel(model, x, y, z) {
    if (!modelsLoading) {
      if (model) {
        model.position.set(x, y, z);
        this._scene.add(model);  // Use this._scene instead of scene
        allObjects.push(model);
      }
    }
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAFAirObjects() {
    let airObjects = [Cloud, AirObstacle]; // Add other objects if needed
    const speed = 0.1; // Adjust the speed of movement towards the user
    airObjects = [...airObjects, ...allObjects];
  
    airObjects.forEach((object) => {
      if (object) {
        object.position.z += speed;
  
        // Add movement logic for clones here
        if (object.userData && object.userData.isClone) {
          const cloneSpeed = 0.05; // Adjust the speed of clone movement
          object.position.x += cloneSpeed;
  
          // Reset clone position when it reaches a certain point
          if (object.position.x > dim) {
            object.position.x = -dim;
            object.position.y = generateObjectPos(dim)[1];
          }
        }
  
        // Check if the object's z position is greater than 0 and make it invisible
        //camera is on z = 70, player x = 0
        if (object.position.z > 50 && !object.userData.crossedThreshold) {
          object.visible = false;
          object.userData.crossedThreshold = true;
        } else if (object.position.z <= 0) {
          object.visible = true;
          object.userData.crossedThreshold = false;
        }
      }
    });
  }


  _RAF() {
    requestAnimationFrame(() => {
      const movement = this._input.movement;
      if (movement.up && !this._input._keys.up) {
        this.moveUp();
        this._input._keys.up = true;
      } else if (!movement.up && this._input._keys.up) {
        this._input._keys.up = false;
      }

      if (movement.down && !this._input._keys.down) {
        this.moveDown();
        this._input._keys.down = true;
      } else if (!movement.down && this._input._keys.down) {
        this._input._keys.down = false;
      }

      if (movement.left && !this._input._keys.left) {
        this.moveLeft();
        this._input._keys.left = true;
      } else if (!movement.left && this._input._keys.left) {
        this._input._keys.left = false;
      }

      if (movement.right && !this._input._keys.right) {
        this.moveRight();
        this._input._keys.right = true;
      } else if (!movement.right && this._input._keys.right) {
        this._input._keys.right = false;
      }
      this._RAFAirObjects();

      //this._generateObstacle();
      this._chooseChunks()
      this._threejs.render(this._scene, this._camera);
      this._RAF();
    });
  }

  //character movement
  moveUp() {
    const step = 18;
    const maxY = 18;
    let newY = this.player.position.y + step;
    if (newY > maxY) {
      newY = maxY;
    }
    this.player.position.y = newY;
  }
  moveDown() {
    const step = 18;
    const minY = -18;
    let newY = this.player.position.y - step;
    if (newY < minY) {
      newY = minY;
    }
    this.player.position.y = newY;
  }
  moveLeft() {
    const step = 18;
    const minX = -18;
    let newX = this.player.position.x - step;
    if (newX < minX) {
      newX = minX;
    }
    this.player.position.x = newX;
  }
  moveRight() {
    const step = 18;
    const maxX = 18;
    let newX = this.player.position.x + step;
    if (newX > maxX) {
      newX = maxX;
    }
    this.player.position.x = newX;
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new GameDemo();
});