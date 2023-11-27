import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


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
    switch(event.keyCode) {
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

  _Initialize() {
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

    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);

    //loading models
    this._LoadModel();

    this._RAF();
  }

  _LoadModel() {
    try {
      const loader = new GLTFLoader();
      loader.load('./resources/models/plane10x.glb', (gltf) => {
        gltf.scene.traverse(c => {
          c.castShadow = true;
        });
        this.player = gltf.scene.children[0];
        this.player.position.set(0, 0, 0);
        this.player.rotateY(Math.PI / 2);
        this._scene.add(gltf.scene);
      });
    } catch (error) {
      console.error('Error loading the model:', error);
    }
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
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