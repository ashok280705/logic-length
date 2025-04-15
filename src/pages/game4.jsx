// StackGame.js
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap, Power1 } from 'gsap';
import Navbar from '../components/navbar.jsx';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from "../services/authService";

// If you haven't already, import Tailwind's base styles (usually in your index.css)
// and ensure the Comfortaa font is imported in your index.html or via Tailwind's config.

// --- Game Code (converted from TypeScript/SCSS to JavaScript/Tailwind) --- //

class Stage {
  constructor() {
    // container - note: this element is rendered by our React component
    const container = document.getElementById('game');
    if (!container) {
      throw new Error('Container not found');
    }
    this.container = container;

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor('#0b001f', 1);
    this.container.appendChild(this.renderer.domElement);

    // scene
    this.scene = new THREE.Scene();

    // camera
    let aspect = window.innerWidth / window.innerHeight;
    let d = 20;
    this.camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      -100,
      1000
    );
    this.camera.position.set(2, 2, 2);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // light
    this.light = new THREE.DirectionalLight(0xffffff, 0.5);
    this.light.position.set(0, 499, 0);
    this.scene.add(this.light);

    this.softLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.softLight);

    window.addEventListener('resize', () => this.onResize());
    this.onResize();
  }

  setCamera(y, speed = 0.3) {
    gsap.to(this.camera.position, { y: y + 4, duration: speed, ease: Power1.easeInOut });
    gsap.to(this.camera.lookAt, { y, duration: speed, ease: Power1.easeInOut });
  }

  onResize() {
    let viewSize = 30;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.left = window.innerWidth / -viewSize;
    this.camera.right = window.innerWidth / viewSize;
    this.camera.top = window.innerHeight / viewSize;
    this.camera.bottom = window.innerHeight / -viewSize;
    this.camera.updateProjectionMatrix();
  }

  render = () => {
    this.renderer.render(this.scene, this.camera);
  };

  add(elem) {
    this.scene.add(elem);
  }

  remove(elem) {
    this.scene.remove(elem);
  }
}

class Block {
  constructor(block) {
    // Set target block if provided
    this.targetBlock = block || null;

    // index; first block is index 0
    this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
    this.workingPlane = this.index % 2 ? 'x' : 'z';
    this.workingDimension = this.index % 2 ? 'width' : 'depth';

    // set dimensions from target block or default values.
    this.dimension = {
      width: this.targetBlock ? this.targetBlock.dimension.width : 10,
      height: this.targetBlock ? this.targetBlock.dimension.height : 2,
      depth: this.targetBlock ? this.targetBlock.dimension.depth : 10
    };

    // set positions
    this.position = {
      x: this.targetBlock ? this.targetBlock.position.x : 0,
      y: this.dimension.height * this.index,
      z: this.targetBlock ? this.targetBlock.position.z : 0
    };

    this.colorOffset = this.targetBlock ? this.targetBlock.colorOffset : Math.round(Math.random() * 100);

    // set color
    if (!this.targetBlock) {
      this.color = 0x6320dd;
    } else {
      let offset = this.index + this.colorOffset;
      const r = Math.sin(0.3 * offset) * 75 + 180;
      const g = Math.sin(0.3 * offset + 2) * 55 + 100;
      const b = Math.sin(0.3 * offset + 4) * 75 + 180;
      this.color = new THREE.Color(r / 255, g / 255, b / 255);
    }

    // state
    this.STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' };
    this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;

    // set direction & speed
    this.MOVE_AMOUNT = 12;
    this.speed = -0.1 - this.index * 0.005;
    if (this.speed < -4) this.speed = -4;
    this.direction = this.speed;

    // create block mesh
    let geometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
    this.material = new THREE.MeshToonMaterial({ color: this.color, flatShading: true });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    if (this.state === this.STATES.ACTIVE) {
      this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
    }
  }

  reverseDirection() {
    this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
  }

  place() {
    this.state = this.STATES.STOPPED;

    let overlap = this.targetBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);

    let blocksToReturn = {
      plane: this.workingPlane,
      direction: this.direction
    };

    if (this.dimension[this.workingDimension] - overlap < 0.3) {
      overlap = this.dimension[this.workingDimension];
      blocksToReturn.bonus = true;
      this.position.x = this.targetBlock.position.x;
      this.position.z = this.targetBlock.position.z;
      this.dimension.width = this.targetBlock.dimension.width;
      this.dimension.depth = this.targetBlock.dimension.depth;
    }

    if (overlap > 0) {
      let choppedDimensions = { ...this.dimension };
      choppedDimensions[this.workingDimension] -= overlap;
      this.dimension[this.workingDimension] = overlap;

      let placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
      placedGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
      let placedMesh = new THREE.Mesh(placedGeometry, this.material);

      let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
      choppedGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2));
      let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);

      let choppedPosition = { ...this.position };

      if (this.position[this.workingPlane] < this.targetBlock.position[this.workingPlane]) {
        this.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
      } else {
        choppedPosition[this.workingPlane] += overlap;
      }

      placedMesh.position.set(this.position.x, this.position.y, this.position.z);
      choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);

      blocksToReturn.placed = placedMesh;
      if (!blocksToReturn.bonus) blocksToReturn.chopped = choppedMesh;
    } else {
      this.state = this.STATES.MISSED;
    }

    this.dimension[this.workingDimension] = overlap;
    return blocksToReturn;
  }

  tick() {
    if (this.state === this.STATES.ACTIVE) {
      let value = this.position[this.workingPlane];
      if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT) this.reverseDirection();
      this.position[this.workingPlane] += this.direction;
      this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
    }
  }
}

class Game {
  constructor() {
    this.STATES = {
      LOADING: 'loading',
      PLAYING: 'playing',
      READY: 'ready',
      ENDED: 'ended',
      RESETTING: 'resetting'
    };

    this.blocks = [];
    this.state = this.STATES.LOADING;

    // groups
    this.newBlocks = new THREE.Group();
    this.placedBlocks = new THREE.Group();
    this.choppedBlocks = new THREE.Group();

    this.stage = new Stage();

    this.mainContainer = document.getElementById('container');
    this.scoreContainer = document.getElementById('score');
    this.startButton = document.getElementById('start-button');
    this.instructions = document.getElementById('instructions');
    this.scoreContainer.innerHTML = '0';

    this.stage.add(this.newBlocks);
    this.stage.add(this.placedBlocks);
    this.stage.add(this.choppedBlocks);

    this.addBlock();
    this.tick();

    this.updateState(this.STATES.READY);

    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 32) this.onAction();
    });
    document.addEventListener('click', () => {
      this.onAction();
    });
    document.addEventListener('touchstart', (e) => {
      e.preventDefault();
      // Uncomment below if desired; note potential conflicts on mobile.
      // this.onAction();
    });
  }

  updateState(newState) {
    for (let key in this.STATES) {
      this.mainContainer.classList.remove(this.STATES[key]);
    }
    this.mainContainer.classList.add(newState);
    this.state = newState;
  }

  onAction() {
    switch (this.state) {
      case this.STATES.READY:
        this.startGame();
        break;
      case this.STATES.PLAYING:
        this.placeBlock();
        break;
      case this.STATES.ENDED:
        this.restartGame();
        break;
      default:
        break;
    }
  }

  startGame() {
    if (this.state !== this.STATES.PLAYING) {
      this.scoreContainer.innerHTML = '0';
      this.updateState(this.STATES.PLAYING);
      this.addBlock();
    }
  }

  restartGame() {
    this.updateState(this.STATES.RESETTING);
    const oldBlocks = this.placedBlocks.children;
    let removeSpeed = 0.2;
    let delayAmount = 0.02;
    for (let i = 0; i < oldBlocks.length; i++) {
      gsap.to(oldBlocks[i].scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: removeSpeed,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: Power1.easeIn,
        onComplete: () => this.placedBlocks.remove(oldBlocks[i])
      });
      gsap.to(oldBlocks[i].rotation, {
        y: 0.5,
        duration: removeSpeed,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: Power1.easeIn
      });
    }
    let cameraMoveSpeed = removeSpeed * 2 + (oldBlocks.length * delayAmount);
    this.stage.setCamera(2, cameraMoveSpeed);

    let countdown = { value: this.blocks.length - 1 };
    gsap.to(countdown, {
      value: 0,
      duration: cameraMoveSpeed,
      onUpdate: () => {
        this.scoreContainer.innerHTML = String(Math.round(countdown.value));
      }
    });

    this.blocks = this.blocks.slice(0, 1);

    setTimeout(() => {
      this.startGame();
    }, cameraMoveSpeed * 1000);
  }

  placeBlock() {
    const currentBlock = this.blocks[this.blocks.length - 1];
    const newBlocks = currentBlock.place();
    this.newBlocks.remove(currentBlock.mesh);
    if (newBlocks.placed) this.placedBlocks.add(newBlocks.placed);
    if (newBlocks.chopped) {
      this.choppedBlocks.add(newBlocks.chopped);
      let positionParams = {
        y: '-=30',
        duration: 1,
        ease: Power1.easeIn,
        onComplete: () => this.choppedBlocks.remove(newBlocks.chopped)
      };
      const rotateRandomness = 10;
      let rotationParams = {
        delay: 0.05,
        duration: 1,
        x: newBlocks.plane === 'z' ? (Math.random() * rotateRandomness - rotateRandomness / 2) : 0.1,
        z: newBlocks.plane === 'x' ? (Math.random() * rotateRandomness - rotateRandomness / 2) : 0.1,
        y: Math.random() * 0.1
      };
      if (newBlocks.chopped.position[newBlocks.plane] > newBlocks.placed.position[newBlocks.plane]) {
        positionParams[newBlocks.plane] = '+=' + (40 * Math.abs(newBlocks.direction));
      } else {
        positionParams[newBlocks.plane] = '-=' + (40 * Math.abs(newBlocks.direction));
      }
      gsap.to(newBlocks.chopped.position, positionParams);
      gsap.to(newBlocks.chopped.rotation, rotationParams);
    }
    this.addBlock();
  }

  addBlock() {
    const lastBlock = this.blocks[this.blocks.length - 1];
    if (lastBlock && lastBlock.state === lastBlock.STATES.MISSED) {
      return this.endGame();
    }
    this.scoreContainer.innerHTML = String(this.blocks.length - 1);
    const newBlock = new Block(lastBlock);
    this.newBlocks.add(newBlock.mesh);
    this.blocks.push(newBlock);

    this.stage.setCamera(this.blocks.length * 2);

    if (this.blocks.length >= 5) {
      this.mainContainer.classList.add('hide-instructions');
    }
  }

  endGame() {
    this.updateState(this.STATES.ENDED);
  }

  tick() {
    this.blocks[this.blocks.length - 1].tick();
    this.stage.render();
    requestAnimationFrame(() => this.tick());
  }
}

// --- React Component with Tailwind CSS --- //

const StackGame = ({ cost = 5, deductCoins = () => true, user, onLogout }) => {
  // Use a ref so that the game is only initialized once.
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [userCoins, setUserCoins] = useState(user?.coins || 0);
  const COST_TO_PLAY = cost; // Use the cost from props
  const navigate = useNavigate();

  useEffect(() => {
    // If user prop is provided, use it instead of fetching from localStorage
    if (user) {
      setUserCoins(user.coins || 0);
    } else {
      // Get user data from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUserCoins(userData.coins || 0);
      } else {
        // Redirect to login if no user data available
        navigate('/');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // Allow time for the DOM to render before initializing the game
    setTimeout(() => {
      gameRef.current = new Game();
      
      // Add a mutation observer to update the React state when score changes
      const scoreObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            setScore(parseInt(mutation.target.textContent) || 0);
          }
        });
      });
      
      const scoreElement = document.getElementById('score');
      if (scoreElement) {
        scoreObserver.observe(scoreElement, { childList: true });
      }
      
      // Listen to game state changes
      const container = document.getElementById('container');
      const stateObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const classList = container.classList;
            setGameStarted(classList.contains('playing'));
          }
        });
      });
      
      if (container) {
        stateObserver.observe(container, { attributes: true });
      }
      
      return () => {
        scoreObserver.disconnect();
        stateObserver.disconnect();
        window.removeEventListener('resize', null);
      };
    }, 100);
  }, []);

  // Get user data from localStorage or props
  const getUserData = () => {
    if (user) return user;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return { name: "Player", coins: 0 };
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      if (onLogout) {
        onLogout();
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
      // Fallback to manual navigation
      navigate("/home");
    }
  };

  const startGame = () => {
    // Check if user has enough coins
    if (userCoins < COST_TO_PLAY) {
      alert(`Not enough coins! You need ${COST_TO_PLAY} coins to play. Please top up your balance.`);
      navigate('/payment');
      return;
    }

    // Use the deductCoins function from props
    const success = deductCoins();
    
    if (!success) {
      alert(`Failed to deduct ${COST_TO_PLAY} coins. Please try again.`);
      return;
    }
    
    // Update local state to reflect coin deduction
    setUserCoins(prevCoins => prevCoins - COST_TO_PLAY);

    setGameStarted(true);
    setScore(0);
    gameRef.current.startGame();
  };

  const handleGameOver = () => {
    setGameStarted(false);
    
    // Award coins based on score
    const coinsWon = Math.floor(score / 10); // 1 coin per 10 points
    if (coinsWon > 0) {
      const updatedCoins = userCoins + coinsWon;
      setUserCoins(updatedCoins);
      
      // Update user data in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.coins = updatedCoins;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      alert(`Game Over! You won ${coinsWon} coins!`);
    } else {
      alert('Game Over! Try again to win coins!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0124] via-[#12002e] to-[#160041] overflow-hidden">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar onLogout={handleLogout} user={getUserData()} />
      </div>

      {/* Game container with pixel pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#8b5cf6_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Game title */}
      <div className="pt-24 pb-4 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
          STACK MASTER
        </h1>
        <p className="text-purple-300 mt-2 animate-pulse">Stack the blocks perfectly to reach the skies!</p>
      </div>
      
      {/* Coin requirement display */}
      <div className="text-center mb-6">
        <div className="inline-block glass-effect p-4 rounded-xl bg-[#1a1039]/90 border-2 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <div className="flex items-center justify-between gap-6">
            <span className="text-white font-medium">Game Cost:</span>
            <div className="flex items-center">
              <span className="text-yellow-300 font-bold text-2xl mr-1">{COST_TO_PLAY}</span>
              <span className="text-xs text-purple-300">COINS</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">Coins will be deducted when you start the game</p>
        </div>
      </div>
      
      <div
        id="container"
        className="relative w-full h-[calc(100vh-150px)] bg-transparent ready select-none overflow-hidden"
      >
        {/* Game canvas */}
        <div id="game" className="absolute inset-0 z-10"></div>
        
        {/* Score display */}
        <div className="absolute top-0 right-0 p-4 z-20">
          <div className="glass-effect rounded-xl p-4 backdrop-blur-md border-2 border-purple-500/30">
            <div className="text-sm text-purple-300 mb-1">SCORE</div>
            <div
              id="score"
              className="font-bold text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
            >
              0
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div
          id="instructions"
          className="absolute w-full top-[16vh] left-0 text-center transition-opacity duration-500 opacity-0 z-20"
        >
          <div className="inline-block glass-effect px-6 py-3 rounded-xl text-white text-xl border border-purple-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <span className="rainbow-text font-bold">Click</span> or press <span className="rainbow-text font-bold">SPACEBAR</span> to place the block
          </div>
        </div>
        
        {/* Game Over overlay */}
        <div className="game-over absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-30 backdrop-blur-sm opacity-0 transition-opacity duration-500">
          <div className="glass-effect p-8 rounded-2xl border-2 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.4)] max-w-md w-full">
            <h2 className="m-0 p-0 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 text-center mb-6 transition-all duration-500 opacity-0 transform -translate-y-12">
              Game Over
            </h2>
            <div className="text-center mb-4 transition-all duration-500 opacity-0 transform -translate-y-12">
              <div className="text-3xl font-bold text-white mb-2">Your Score:</div>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">{score}</div>
            </div>
            <p className="text-center text-white/90 text-lg transition-all duration-500 opacity-0 transform -translate-y-12">
              Excellent effort! Your stacking skills are impressive.
            </p>
            <p className="text-center text-white/70 mt-8 mb-6 transition-all duration-500 opacity-0 transform -translate-y-12 delay-300">
              Click or spacebar to start again
            </p>
            <div className="flex justify-center">
              <div className="animated-border inline-block">
                <button className="cybr-btn px-8 py-3 bg-gradient-to-r from-purple-700 to-pink-700 text-white rounded-lg text-lg transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]" onClick={startGame}>
                  RESTART
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game Ready overlay - Adding transition and hidden by default when playing */}
        <div className="game-ready absolute inset-0 flex flex-col items-center justify-center z-30 backdrop-blur-md transition-all duration-500 playing:opacity-0 playing:pointer-events-none">
          <div className="glass-effect p-10 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] max-w-md w-full text-center">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-8">
              STACK MASTER
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Test your reflexes and precision by stacking blocks as high as possible!
            </p>
            <div className="animated-border inline-block">
              <div
                id="start-button"
                className="cybr-btn cursor-pointer px-10 py-4 bg-gradient-to-r from-purple-700 to-pink-700 text-white rounded-lg text-xl font-bold transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              >
                START GAME
              </div>
            </div>
            <div className="animated-border inline-block">
              <div
                id="logout-button"
                onClick={() => window.location.href = '/'}
                className="cybr-btn cursor-pointer px-10 py-4 bg-gradient-to-r from-red-700 to-orange-700 text-white rounded-lg text-xl font-bold transition-all hover:from-red-600 hover:to-orange-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                LOGOUT
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0c0124] to-transparent pointer-events-none"></div>
      
      {/* Footer */}
      <div className="relative mt-4 pt-4 pb-6 text-center text-purple-300/70 text-sm z-20">
        <p>© 2024-2025 TEAM LOGICLENGTH. All rights reserved.</p>
      </div>

      <div className="game-info">
        <div className="score">Score: {score}</div>
        <div className="coins">Coins: {userCoins}</div>
        {!gameStarted && (
          <button onClick={startGame} className="start-button">
            Start Game (10 coins)
          </button>
        )}
      </div>
    </div>
  );
};

export default StackGame;