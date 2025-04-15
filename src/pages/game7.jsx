import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import Matter from "matter-js";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/navbar.jsx';
import { logoutUser } from "../services/authService";

export default function PlinkoGame({ cost = 20, deductCoins = () => true, user, onLogout }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [balls, setBalls] = useState(100);
  const [autoDropEnabled, setAutoDropEnabled] = useState(false);
  const [autoDroppingInterval, setAutoDroppingInterval] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [previewBallPos, setPreviewBallPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [userCoins, setUserCoins] = useState(user?.coins || 0);
  const COST_TO_PLAY = cost; // Use the cost from props
  const navigate = useNavigate();

  const width = 620;
  const height = 534;
  const GAP = 40;
  const PEG_RAD = 8;
  const BALL_RAD = 10;
  const DROP_ZONE_Y = 40; // Y position where balls can be dropped

  const multipliers = [50, 20, 7, 4, 3, 1, 1, 0, 0, 0, 1, 1, 3, 4, 7, 20, 50];
  const notesArray = [
    "C#5", "C5", "B5", "A#5", "A5", "G#4", "G4", "F#4", "F4",
    "F#4", "G4", "G#4", "A5", "A#5", "B5", "C5", "C#5"
  ];

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

  // Get user data from localStorage or props
  const getUserData = () => {
    if (user) return user;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return { name: "Player", coins: 0 };
  };

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
    setBalls(100); // Reset balls
  };

  class Note {
    constructor(note) {
      this.synth = new Tone.PolySynth().toDestination();
      this.synth.set({ volume: -6 });
      this.note = note;
    }
    play() {
      return this.synth.triggerAttackRelease(this.note, "32n", Tone.context.currentTime);
    }
  }

  const notes = notesArray.map(note => new Note(note));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalAlpha = 1;

    // Set initial preview ball position
    setPreviewBallPos({ x: width / 2, y: DROP_ZONE_Y });

    // Add mouse event listeners for preview ball
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Constrain x position within drop zone
      const constrainedX = Math.max(width/2 - GAP, Math.min(width/2 + GAP, x));
      setPreviewBallPos({ x: constrainedX, y: DROP_ZONE_Y });
    };

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is near preview ball
      const dx = x - previewBallPos.x;
      const dy = y - previewBallPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < BALL_RAD * 2) {
        setIsDragging(true);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        dropBallAtPosition(previewBallPos.x);
        setIsDragging(false);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    const Engine = Matter.Engine,
      Events = Matter.Events,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

    const engine = Engine.create({
      gravity: {
        x: 0,
        y: 0.6,
        scale: 0.001
      }
    });
    engineRef.current = engine;

    const render = Render.create({
      canvas,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#14151f',
        pixelRatio: window.devicePixelRatio || 1
      }
    });

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    ctx.fillStyle = '#14151f';
    ctx.fillRect(0, 0, width, height);

    const drawPeg = (x, y) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, PEG_RAD * 2);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, PEG_RAD * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#faf5ff';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, PEG_RAD, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    const pegs = [];
    for (let r = 0; r < 10; r++) {
      const pegsInRow = r + 3;
      for (let c = 0; c < pegsInRow; c++) {
        const x = width / 2 + (c - (pegsInRow - 1) / 2) * GAP;
        const y = GAP + r * GAP;
        
        const peg = Bodies.circle(x, y, PEG_RAD, {
          isStatic: true,
          label: "Peg",
          restitution: 0.8,
          friction: 0.05,
          render: {
            fillStyle: '#faf5ff',
            strokeStyle: '#a855f7',
            lineWidth: 4
          }
        });
        pegs.push(peg);
        
        drawPeg(x, y);
      }
    }
    Composite.add(engine.world, pegs);

    const zoneHeight = 60;
    const zoneWidth = GAP - 4;
    const zones = multipliers.map((multiplier, index) => {
      const x = width / 2 + (index - 8) * GAP;
      const y = height - zoneHeight/2;

      const zoneGradient = ctx.createLinearGradient(x - zoneWidth/2, y - zoneHeight/2, x + zoneWidth/2, y + zoneHeight/2);
      const zoneColor = multiplier > 10 ? '#22c55e' : 
                       multiplier > 3 ? '#3b82f6' : 
                       multiplier > 0 ? '#8b5cf6' : '#ef4444';
      zoneGradient.addColorStop(0, zoneColor + '66');
      zoneGradient.addColorStop(0.5, zoneColor);
      zoneGradient.addColorStop(1, zoneColor + '66');

      ctx.fillStyle = zoneGradient;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - zoneWidth/2, y - zoneHeight/2, zoneWidth, zoneHeight, 5);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(multiplier + 'x', x, y);

      const zone = Bodies.rectangle(x, y, zoneWidth, zoneHeight, {
        isStatic: true,
        isSensor: true,
        label: "Zone",
        multiplier: multiplier,
        render: {
          fillStyle: zoneColor,
          strokeStyle: '#ffffff',
          lineWidth: 3,
          opacity: 1
        }
      });
      return zone;
    });
    Composite.add(engine.world, zones);

    const groundY = height + 10;
    ctx.fillStyle = '#312e81';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(0, groundY - 10, width, 20);
    ctx.fill();
    ctx.stroke();

    const ground = Bodies.rectangle(width / 2, groundY, width, 20, {
      isStatic: true,
      label: "Ground",
      render: { 
        fillStyle: '#312e81',
        strokeStyle: '#ffffff',
        lineWidth: 3
      }
    });
    Composite.add(engine.world, [ground]);

    const pegAnims = new Array(pegs.length).fill(null);

    Events.on(engine, "collisionStart", event => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        const ball = bodyA.label === "Ball" ? bodyA : bodyB.label === "Ball" ? bodyB : null;
        const peg = bodyA.label === "Peg" ? bodyA : bodyB.label === "Peg" ? bodyB : null;
        const zone = bodyA.label === "Zone" ? bodyA : bodyB.label === "Zone" ? bodyB : null;

        if (ball && peg) {
          const index = pegs.findIndex(p => p === peg);
          if (index !== -1) {
            pegAnims[index] = Date.now();
            peg.render.fillStyle = '#d8b4fe';
            setTimeout(() => {
              peg.render.fillStyle = '#faf5ff';
            }, 100);
            clickSynth.triggerAttackRelease("32n");
          }
        }

        if (ball && zone) {
          Composite.remove(engine.world, ball);
          const multiplier = zone.multiplier;
          setBalls(prev => prev + multiplier);
          setLastWin(multiplier);
          setShowWinAnimation(true);
          setTimeout(() => setShowWinAnimation(false), 2000);
          notes[zones.indexOf(zone)].play();
        }

        if (ball && (bodyA.label === "Ground" || bodyB.label === "Ground")) {
          Composite.remove(engine.world, ball);
        }
      });
    });

    const animate = () => {
      ctx.fillStyle = '#14151f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw drop zone
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(width/2 - GAP - BALL_RAD, 0, GAP * 2 + BALL_RAD * 2, DROP_ZONE_Y * 2);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.strokeRect(width/2 - GAP - BALL_RAD, 0, GAP * 2 + BALL_RAD * 2, DROP_ZONE_Y * 2);

      // Draw preview ball with glow
      const ballGradient = ctx.createRadialGradient(
        previewBallPos.x, previewBallPos.y, 0,
        previewBallPos.x, previewBallPos.y, BALL_RAD * 2
      );
      ballGradient.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
      ballGradient.addColorStop(1, 'rgba(244, 63, 94, 0)');
      
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(previewBallPos.x, previewBallPos.y, BALL_RAD * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDragging ? '#fb7185' : '#f43f5e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(previewBallPos.x, previewBallPos.y, BALL_RAD, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw arrow indicator
      if (isDragging) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(previewBallPos.x, previewBallPos.y + BALL_RAD);
        ctx.lineTo(previewBallPos.x, previewBallPos.y + DROP_ZONE_Y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      pegs.forEach(peg => {
        drawPeg(peg.position.x, peg.position.y);
      });

      const now = Date.now();
      pegAnims.forEach((anim, index) => {
        if (!anim) return;
        const delta = now - anim;
        if (delta > 1200) {
          pegAnims[index] = null;
          return;
        }
        const peg = pegs[index];
        const pct = delta / 1200;
        const expandRadius = (1 - Math.abs(pct * 2 - 1)) * 20;
        
        const gradient = ctx.createRadialGradient(
          peg.position.x, peg.position.y, 0,
          peg.position.x, peg.position.y, expandRadius
        );
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(peg.position.x, peg.position.y, expandRadius, 0, 2 * Math.PI);
        ctx.fill();
      });

      zones.forEach((zone, index) => {
        const x = zone.position.x;
        const y = zone.position.y;
        const multiplier = zone.multiplier;
        const zoneColor = multiplier > 10 ? '#22c55e' : 
                         multiplier > 3 ? '#3b82f6' : 
                         multiplier > 0 ? '#8b5cf6' : '#ef4444';

        const zoneGradient = ctx.createLinearGradient(x - zoneWidth/2, y - zoneHeight/2, x + zoneWidth/2, y + zoneHeight/2);
        zoneGradient.addColorStop(0, zoneColor + '66');
        zoneGradient.addColorStop(0.5, zoneColor);
        zoneGradient.addColorStop(1, zoneColor + '66');

        ctx.fillStyle = zoneGradient;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x - zoneWidth/2, y - zoneHeight/2, zoneWidth, zoneHeight, 5);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(multiplier + 'x', x, y);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      Runner.stop(runner);
      Render.stop(render);
      Engine.clear(engine);
    };
  }, [isDragging, previewBallPos]);

  const dropBallAtPosition = (x) => {
    if (!gameStarted) {
      startGame();
      return;
    }
    
    if (balls <= 0) {
      alert("You're out of balls! Please restart the game.");
      return;
    }

    if (!engineRef.current) return;
    
    setBalls(prev => prev - 1);
    
    const ball = Matter.Bodies.circle(x, DROP_ZONE_Y, BALL_RAD, {
      label: "Ball",
      restitution: 0.3,
      friction: 0.001,
      density: 0.002,
      render: {
        fillStyle: '#f43f5e',
        strokeStyle: '#ffffff',
        lineWidth: 3
      }
    });
    
    // Add trail effect
    let positions = [];
    const maxTrailLength = 10;
    
    Matter.Events.on(ball, 'afterUpdate', () => {
      positions.unshift({ x: ball.position.x, y: ball.position.y });
      if (positions.length > maxTrailLength) {
        positions.pop();
      }
      
      const ctx = canvasRef.current.getContext('2d');
      positions.forEach((pos, index) => {
        const alpha = (1 - index / maxTrailLength) * 0.3;
        ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, BALL_RAD * (1 - index / maxTrailLength), 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    Matter.Body.setVelocity(ball, { x: 0, y: 3 });
    Matter.Composite.add(engineRef.current.world, [ball]);
  };

  const toggleAutoDrop = () => {
    setAutoDropEnabled(prev => {
      const newState = !prev;
      if (newState) {
        const interval = setInterval(() => {
          const randomX = width/2 + (Math.random() * 2 - 1) * GAP;
          dropBallAtPosition(randomX);
        }, 600);
        setAutoDroppingInterval(interval);
      } else {
        clearInterval(autoDroppingInterval);
        setAutoDroppingInterval(null);
      }
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0124] via-[#12002e] to-[#160041] text-white overflow-hidden">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar onLogout={handleLogout} user={getUserData()} />
      </div>

      <div className="pt-24 pb-4 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
          PLINKO
        </h1>
        <p className="text-purple-300 mt-2 animate-pulse">Drop the balls and win big!</p>
      </div>

      {!gameStarted ? (
        // Pre-game startup screen with coin information
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="glass-effect p-8 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] max-w-2xl w-full">
            <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Ready to Play Plinko?
            </h2>

            {/* Coin requirement card */}
            <div className="w-full max-w-md mx-auto mb-6 p-4 rounded-xl bg-[#1a1039]/90 border-2 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Game Cost:</span>
                <div className="flex items-center">
                  <span className="text-yellow-300 font-bold text-2xl mr-1">{COST_TO_PLAY}</span>
                  <span className="text-xs text-purple-300">COINS</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-2">Coins will be deducted when the game starts</p>
            </div>

            <div className="text-purple-300/90 text-center mb-6">
              <p>Drop balls through the pegs and aim for high multipliers!</p>
              <p className="mt-2">Each game gives you 100 balls to play with. Enjoy!</p>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-lg font-bold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.5)] transform hover:scale-105"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Main game interface
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-4 space-x-8">
            <div className="glass-effect p-3 rounded-xl border-2 border-purple-500/30">
              <div className="text-sm text-purple-300">BALLS LEFT</div>
              <div className="text-2xl font-bold">{balls}</div>
            </div>
            <div className="glass-effect p-3 rounded-xl border-2 border-purple-500/30">
              <div className="text-sm text-purple-300">YOUR COINS</div>
              <div className="text-2xl font-bold text-yellow-300">{userCoins}</div>
            </div>
          </div>
          
          <div className="glass-effect p-4 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="rounded-lg"
            />
          </div>
          
          <div className="mt-4">
            <button
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              onClick={toggleAutoDrop}
            >
              {autoDropEnabled ? "Stop Auto Drop" : "Auto Drop"}
            </button>
          </div>
        </div>
      )}

      {/* Win animation */}
      {showWinAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center win-animation">
            <div className="text-4xl font-bold text-yellow-300 mb-2">YOU WON!</div>
            <div className="text-6xl font-black text-white">{lastWin}x</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .win-animation {
          animation: pop-in 0.5s ease-out forwards, float 1s ease-in-out infinite alternate;
          opacity: 0;
          transform: scale(0.5);
        }
        
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.5); }
          70% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes float {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}