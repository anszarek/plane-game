import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let PlaneObstacle, DogObstacle, CloudObstacle, CloudLightningObstacle, Coin;
const dim = 6;
let lastChunk = ["first"];
let allObjects = [];

const generateObjectPos = (dim, usedPositions) => {
  const arr = [-dim, 0, dim];
  let grid = [];
  for (let i in arr) {
    for (let j in arr) {
      grid.push([arr[i], arr[j]]);
    }
  }
  let avaliable;
  if (usedPositions) {
    avaliable = grid.filter(
      (n) => !usedPositions.some(([x, y]) => x === n[0] && y === n[1])
    );
  } else {
    avaliable = grid;
  }
  const gridIdx = Math.floor(Math.random() * avaliable.length);
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
    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
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

    window.addEventListener(
      "resize",
      () => {
        this._OnWindowResize();
      },
      false
    );

    //camera
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0, 0, 25);

    this._camera.rotation.x += -0.15;

    //scene
    this._scene = new THREE.Scene();

    //lights
    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(0, 20, 70);
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


    this._RAF();
  }

  _generateChunks = (positions) => {
    const lastSlice = allObjects.length - 1;
    let lastZ
    if(lastSlice === -1) {
      lastZ = -18
    } else {

      lastZ = allObjects[lastSlice].position.z;
    }

    positions.forEach((slice, i) => {
      slice.forEach((object) => {
        const { model, position } = object;
        this._addModel(
          //CloudObstacle.clone(),
          model,
          position[0],
          position[1],
          -i * 18 - 18 + lastZ
        );
      });
    });
  };

  _chooseChunks = () => {
    const chunkA = [
      [
        { model: CloudObstacle.clone(), position: [-dim, dim] },
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudObstacle.clone(), position: [dim, -dim] },
        { model: CloudObstacle.clone(), position: [dim, 0] },
        { model: Coin.clone(), position: [0, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: PlaneObstacle.clone(), position: [0, 0] },
        { model: Coin.clone(), position: [0, dim] },
      ],
      [
        { model: CloudObstacle.clone(), position: [0, dim] },
        { model: CloudObstacle.clone(), position: [0, -dim] },
        { model: Coin.clone(), position: [-dim, dim] },
      ],
    ];
    const chunkB = [
      [
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudLightningObstacle.clone(), position: [0, dim] },
        { model: CloudObstacle.clone(), position: [dim, -dim] },
        { model: Coin.clone(), position: [dim, dim] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudObstacle.clone(), position: [dim, 0] },
        { model: Coin.clone(), position: [0, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: CloudLightningObstacle.clone(), position: [-dim, dim] },
        { model: Coin.clone(), position: [0, 0] },
      ],
    ];
    const chunkC = [
      [
        { model: CloudObstacle.clone(), position: [dim, -dim] },
        { model: PlaneObstacle.clone(), position: [-dim, dim] },
        { model: Coin.clone(), position: [0, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: CloudObstacle.clone(), position: [-dim, 0] },
        { model: Coin.clone(), position: [0, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudObstacle.clone(), position: [0, 0] },
        { model: CloudLightningObstacle.clone(), position: [dim, dim] },
        { model: Coin.clone(), position: [-dim, 0] },
      ],
    ];
    const chunkD = [
      [
        { model: CloudObstacle.clone(), position: [-dim, dim] },
        { model: CloudObstacle.clone(), position: [dim, 0] },
        { model: PlaneObstacle.clone(), position: [0, -dim] },
        { model: Coin.clone(), position: [0, dim] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudLightningObstacle.clone(), position: [dim, dim] },
        { model: Coin.clone(), position: [-dim, dim] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, 0] },
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudObstacle.clone(), position: [0, -dim] },
        { model: CloudObstacle.clone(), position: [dim, -dim] },
        { model: CloudObstacle.clone(), position: [dim, 0] },
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: Coin.clone(), position: [0, dim] },
      ],
    ];
    const chunkE = [
      [
        { model: CloudObstacle.clone(), position: [-dim, 0] },
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: CloudObstacle.clone(), position: [dim, 0] },
        { model: Coin.clone(), position: [0, -dim] },
      ],
      [
        { model: CloudObstacle.clone(), position: [dim, -dim] },
        { model: CloudLightningObstacle.clone(), position: [-dim, dim] },
        { model: Coin.clone(), position: [0, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: CloudObstacle.clone(), position: [dim, 0] },
        { model: CloudObstacle.clone(), position: [0, -dim] },
        { model: Coin.clone(), position: [0, dim] },
      ],
    ];
    const chunkF = [
      [
        { model: CloudObstacle.clone(), position: [-dim, 0] },
        { model: CloudLightningObstacle.clone(), position: [dim, dim] },
        { model: Coin.clone(), position: [0, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, dim] },
        { model: CloudObstacle.clone(), position: [-dim, 0] },
        { model: CloudObstacle.clone(), position: [0, -dim] },
        { model: Coin.clone(), position: [0, dim] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, dim] },
        { model: CloudObstacle.clone(), position: [-dim, 0] },
        { model: CloudObstacle.clone(), position: [0, -dim] },
        { model: CloudObstacle.clone(), position: [dim, -dim] },
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: Coin.clone(), position: [0, 0] },
      ],
    ];
    const chunkG = [
      [
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudObstacle.clone(), position: [0, -dim] },
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: CloudLightningObstacle.clone(), position: [-dim, dim] },
        { model: Coin.clone(), position: [dim, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, dim] },
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: PlaneObstacle.clone(), position: [-dim, -dim] },
        { model: Coin.clone(), position: [0, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [0, dim] },
        { model: CloudLightningObstacle.clone(), position: [dim, dim] },
        { model: Coin.clone(), position: [-dim, 0] },
      ],
    ];
    const chunkH = [
      [
        { model: CloudObstacle.clone(), position: [0, 0] },
        { model: Coin.clone(), position: [dim, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [-dim, -dim] },
        { model: CloudObstacle.clone(), position: [0, 0] },
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: Coin.clone(), position: [dim, 0] },
      ],
      [
        { model: CloudObstacle.clone(), position: [dim, dim] },
        { model: CloudLightningObstacle.clone(), position: [-dim, 0] },
        { model: Coin.clone(), position: [dim, -dim] },
      ],
    ];


    const LastElement = allObjects.length - 1;

    if(allObjects.length ===0 ) {
      this._generateChunks(chunkA);
      return;
    }

    const lastZ = allObjects[LastElement].position.z ?? -18;
    if (lastZ < -50) {
      return;
    }

    let chunk = lastChunk.pop();

    if (chunk === "first") {
      const avaliableChunk = [
        this._generateChunks(chunkB),
        this._generateChunks(chunkC),
        this._generateChunks(chunkD),
        this._generateChunks(chunkF),
        this._generateChunks(chunkH),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("second");
          break;
        case 1:
          lastChunk.push("third");
          break;
        case 2:
          lastChunk.push("fourth");
          break;
        case 3:
          lastChunk.push("sixth");
          break;
        case 4:
          lastChunk.push("eighth");
          break;
      }
      return;
    }
    if (chunk === "second") {
      const avaliableChunk = [
        this._generateChunks(chunkA),
        this._generateChunks(chunkC),
        this._generateChunks(chunkE),
        this._generateChunks(chunkF),
        this._generateChunks(chunkH),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("first");
          break;
        case 1:
          lastChunk.push("third");
          break;
        case 2:
          lastChunk.push("fifth");
          break;
        case 3:
          lastChunk.push("sixth");
          break;
        case 4:
          lastChunk.push("eighth");
          break;
      }
      return;
    }
    if (chunk === "third") {
      const avaliableChunk = [
        this._generateChunks(chunkA),
        this._generateChunks(chunkB),
        this._generateChunks(chunkE),
        this._generateChunks(chunkF),
        this._generateChunks(chunkH),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("first");
          break;
        case 1:
          lastChunk.push("second");
          break;
        case 2:
          lastChunk.push("fifth");
          break;
        case 3:
          lastChunk.push("sixth");
          break;
        case 4:
          lastChunk.push("eighth");
          break;
      }
      return;
    }
    if (chunk === "fourth") {
      const avaliableChunk = [
        this._generateChunks(chunkA),
        this._generateChunks(chunkC),
        this._generateChunks(chunkE),
        this._generateChunks(chunkF),
        this._generateChunks(chunkG),
        this._generateChunks(chunkH),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("first");
          break;
        case 1:
          lastChunk.push("third");
          break;
        case 2:
          lastChunk.push("fifth");
          break;
        case 3:
          lastChunk.push("sixth");
          break;
        case 4:
          lastChunk.push("seventh");
          break;
        case 5:
          lastChunk.push("eighth");
          break;
      }
      return;
    }
    if (chunk === "fifth") {
      const avaliableChunk = [
        this._generateChunks(chunkF),
        this._generateChunks(chunkH),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("sixth");
          break;
        case 1:
          lastChunk.push("eighth");
          break;
      }
      return;
    }
    if (chunk === "sixth") {
      const avaliableChunk = [
        this._generateChunks(chunkC),
        this._generateChunks(chunkD),
        this._generateChunks(chunkH),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("third");
          break;
        case 1:
          lastChunk.push("fourth");
          break;
        case 2:
          lastChunk.push("eighth");
          break;
      }
      return;
    }
    if (chunk === "seventh") {
      const avaliableChunk = [
        this._generateChunks(chunkE),
        this._generateChunks(chunkF),
        this._generateChunks(chunkH),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("fifth");
          break;
        case 1:
          lastChunk.push("sixth");
          break;
        case 2:
          lastChunk.push("eighth");
          break;
      }
      return;
    }
    if (chunk === "eighth") {
      const avaliableChunk = [
        this._generateChunks(chunkA),
        this._generateChunks(chunkB),
        this._generateChunks(chunkE),
        this._generateChunks(chunkF),
        this._generateChunks(chunkG),
      ];
      const chosen = Math.floor(Math.random() * avaliableChunk.length);
      avaliableChunk[chosen];
      switch (chosen) {
        case 0:
          lastChunk.push("first");
          break;
        case 1:
          lastChunk.push("second");
          break;
        case 2:
          lastChunk.push("fifth");
          break;
        case 3:
          lastChunk.push("sixth");
          break;
        case 4:
          lastChunk.push("seventh");
          break;
      }
      return;
    }
  };

  async _LoadModels() {
    try {
      const loader = new GLTFLoader();

      const loadPlayer = () => {
        new Promise((resolve) => {
          loader.load(
            "./resources/models/player.glb",
            (gltf) => {
              gltf.scene.traverse((c) => {
                c.castShadow = true;
              });

              this.player = gltf.scene.children[0];
              this.player.position.set(0, 0, 0);
              this._scene.add(gltf.scene);
            },
            resolve
          );
        });
      };

      const loadCloudObstacle = () =>
        new Promise((resolve) =>
          loader.load("./resources/models/cloud.glb", resolve)
        );
      const loadPlaneObstacle = () =>
        new Promise((resolve) =>
          loader.load("./resources/models/plane.glb", resolve)
        );
      const loadDogObstacle = () =>
        new Promise((resolve) =>
          loader.load("./resources/models/dog-in-plane.glb", resolve)
        );
      const loadCloudLightningObstacle = () =>
        new Promise((resolve) =>
          loader.load("./resources/models/cloud-lightning.glb", resolve)
        );
      const loadCoin = () =>
        new Promise((resolve) =>
          loader.load("./resources/models/coin.glb", resolve)
        );

      const [
        cloudResult,
        planeResult,
        dogResult,
        cloudLightningResult,
        coinResult,
      ] = await Promise.all([
        loadCloudObstacle(),
        loadPlaneObstacle(),
        loadDogObstacle(),
        loadCloudLightningObstacle(),
        loadCoin(),
        loadPlayer(),
      ]);

      CloudObstacle = cloudResult.scene;
      CloudObstacle.traverse((child) => {
        if (child.isMesh) {
          child.material.opacity = 0.4;
          child.material.transparent = true;
        }
      });
      PlaneObstacle = planeResult.scene;
      PlaneObstacle.modelName = "PlaneObstacle";
      DogObstacle = dogResult.scene;
      CloudLightningObstacle = cloudLightningResult.scene;
      CloudLightningObstacle.traverse((child) => {
        if (child.isMesh) {
          child.material.opacity = 0.8;
          child.material.transparent = true;
        }
      });
      Coin = coinResult.scene;
    } catch (error) {
      console.error("Error loading models:", error);
    } finally {
      modelsLoading = false;
    }
  }

  _addModel(model, x, y, z) {
    if (!modelsLoading) {
      if (model) {
        model.position.set(x, y, z);
        this._scene.add(model); // Use this._scene instead of scene
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
    let airObjects = [
      PlaneObstacle,
      DogObstacle,
      CloudObstacle,
      CloudLightningObstacle,
      Coin,
    ]; // Add other objects if needed
    const speed = 0.1; // Adjust the speed of movement towards the user
    airObjects = [...allObjects];
    let indexes = [];
    airObjects.forEach((object, index) => {
      
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
          if (object.position.z > 10) {
            //console.log(object.modelName, object.modelName === 'PlaneObstacle')
            if (object.modelName === "PlaneObstacle") {
              if (object.position.z > 100) {
                object.visible = false;
                object.userData.crossedThreshold = true;
                indexes.push(index);
              }
            } else {
              object.visible = false;
              object.userData.crossedThreshold = true;
              indexes.push(index);
            }
          } else if (object.position.z <= 0) {
            object.visible = true;
            object.userData.crossedThreshold = false;
          }
  
          // Check collision between player and other objects
          const playerBoundingBox = new THREE.Box3().setFromObject(this.player);
          for (let i = 0; i < allObjects.length; i++) {
            const objectBoundingBox = new THREE.Box3().setFromObject(allObjects[i]);
  
          if (playerBoundingBox.intersectsBox(objectBoundingBox)) {
          // Collision detected between player and current object
          console.log("Collision occurred!");
          }
          }
        }

      
    });

    indexes.reverse();
    indexes.forEach((indexToDelete) => {
      airObjects.splice(indexToDelete, 1);
    });

    indexes.length = 0;
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

      this._chooseChunks();
      this._threejs.render(this._scene, this._camera);
      this._RAF();
    });
  }

  //character movement   //18
  moveUp() {
    const step = 6;
    const maxY = 6;
    let newY = this.player.position.y + step;
    if (newY > maxY) {
      newY = maxY;
    }
    this.player.position.y = newY;
    this._camera.position.y = newY;
  }
  moveDown() {
    const step = 6;
    const minY = -6;
    let newY = this.player.position.y - step;
    if (newY < minY) {
      newY = minY;
    }
    this.player.position.y = newY;
    this._camera.position.y = newY;
  }
  moveLeft() {
    const step = 6;
    const minX = -6;
    let newX = this.player.position.x - step;
    if (newX < minX) {
      newX = minX;
    }
    this.player.position.x = newX;
    this._camera.position.x = newX;
  }
  moveRight() {
    const step = 6;
    const maxX = 6;
    let newX = this.player.position.x + step;
    if (newX > maxX) {
      newX = maxX;
    }
    this.player.position.x = newX;
    this._camera.position.x = newX;
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new GameDemo();
});
