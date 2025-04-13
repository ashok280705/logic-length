import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AviatorGame = ({ cost = 25, deductCoins = () => true, user, onLogout }) => {
  const canvasRef = useRef(null);
  const [counter, setCounter] = useState(1.0);
  const [balance, setBalance] = useState(3000);
  const [bet, setBet] = useState('');
  const [message, setMessage] = useState('Betting phase: Place your bets!');
  const [counterDepo, setCounterDepo] = useState([1.01, 18.45, 2.02, 5.21, 1.22, 1.25, 2.03, 4.55, 65.11, 1.03]);
  const [gameState, setGameState] = useState('betting'); // betting, flying, crashed
  const [activeBet, setActiveBet] = useState(null);
  const [lastWin, setLastWin] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10); // Betting phase countdown
  const [highestMultiplier, setHighestMultiplier] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userCoins, setUserCoins] = useState(user?.coins || 0);
  const COST_TO_PLAY = cost; // Use the cost prop instead of hardcoded value
  const navigate = useNavigate();

  const canvasWidth = 800;
  const canvasHeight = 250;
  const speedX = 3;
  const speedY = 1;

  const x = useRef(0);
  const y = useRef(canvasHeight);
  const dotPath = useRef([]);
  const randomStop = useRef(Math.random() * (10 - 0.1) + 0.8);
  const isFlying = useRef(true);
  const animationRef = useRef();
  const timerRef = useRef(null);

  const startBettingPhase = () => {
    setGameState('betting');
    setTimeLeft(10);
    setMessage('Betting phase: Place your bets!');
    setCounter(1.0);
    x.current = canvasWidth / 2;
    y.current = canvasHeight / 2;
    dotPath.current = [];
    
    // Start betting phase countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          startFlyingPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startFlyingPhase = () => {
    setGameState('flying');
    setMessage('Flight started - Watch the multiplier!');
    isFlying.current = true;
    animationRef.current = requestAnimationFrame(draw);

    // Set timeout for 30 seconds flight
    setTimeout(() => {
      handleGameCrash();
    }, 30000);
  };

  const calculateFlightPath = (time) => {
    // Create a more dynamic flight path using sine and cosine
    const baseY = canvasHeight / 2;
    const amplitude = 80; // Height of waves
    const frequency = 0.005; // Frequency of waves
    const verticalDrift = Math.sin(time * 0.001) * 30; // Slow vertical drift
    
    // Combine multiple sine waves for more organic movement
    const y = baseY + 
             (amplitude * Math.sin(time * frequency)) + 
             (amplitude * 0.5 * Math.sin(time * frequency * 2)) +
             verticalDrift;
    
    return y;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    setCounter((prev) => {
      const newCounter = parseFloat((prev + 0.01).toFixed(2));
      if (newCounter > highestMultiplier) {
        setHighestMultiplier(newCounter);
      }
      return newCounter;
    });

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Add grid background with perspective effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < canvasWidth; i += 40) {
      const opacity = (i / canvasWidth) * 0.2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }
    for (let i = 0; i < canvasHeight; i += 40) {
      const opacity = (i / canvasHeight) * 0.2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasWidth, i);
      ctx.stroke();
    }

    x.current += speedX;

    if (gameState === 'flying') {
      // Calculate new y position using the dynamic flight path
      y.current = calculateFlightPath(x.current);
      
      // Add some turbulence effect
      const turbulence = Math.sin(x.current * 0.1) * 5;
      y.current += turbulence;
    }

    dotPath.current.push({ x: x.current, y: y.current });

    // Limit the trail length for better performance
    if (dotPath.current.length > 100) {
      dotPath.current = dotPath.current.slice(-100);
    }

    const canvasOffsetX = canvasWidth / 2 - x.current;
    const canvasOffsetY = canvasHeight / 2 - y.current;

    ctx.save();
    ctx.translate(canvasOffsetX, canvasOffsetY);

    // Draw glowing trail with neon effect
    for (let i = 1; i < dotPath.current.length; i++) {
      const progress = i / dotPath.current.length;
      const gradient = ctx.createLinearGradient(
        dotPath.current[i - 1].x,
        dotPath.current[i - 1].y,
        dotPath.current[i].x,
        dotPath.current[i].y
      );
      
      const opacity = progress * 0.8;
      gradient.addColorStop(0, `rgba(255, 71, 87, ${opacity * 0.2})`);
      gradient.addColorStop(1, `rgba(255, 71, 87, ${opacity * 0.8})`);
      
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 * progress;
      ctx.moveTo(dotPath.current[i - 1].x, dotPath.current[i - 1].y);
      ctx.lineTo(dotPath.current[i].x, dotPath.current[i].y);
      ctx.stroke();

      // Add glow effect
      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    // Draw airplane with enhanced design
    ctx.save();
    
    // Calculate angle of movement for airplane rotation
    const lastPoint = dotPath.current[dotPath.current.length - 2] || { x: x.current - speedX, y: y.current };
    const angle = Math.atan2(y.current - lastPoint.y, x.current - lastPoint.x);
    
    // Translate to current position and rotate
    ctx.translate(x.current, y.current);
    ctx.rotate(angle);
    
    // Enhanced airplane design
    ctx.beginPath();
    ctx.fillStyle = '#ff4757';
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 20;
    
    // Main body
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.quadraticCurveTo(15, -10, 0, -8);
    ctx.quadraticCurveTo(-15, -10, -20, 0);
    ctx.fill();
    
    // Wings
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(8, -2);
    ctx.lineTo(0, -15);
    ctx.closePath();
    ctx.fill();
    
    // Tail
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-25, -8);
    ctx.lineTo(-15, -8);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    ctx.restore();

    if (gameState === 'flying') {
      animationRef.current = requestAnimationFrame(draw);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      startBettingPhase();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

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

  const handleGameCrash = () => {
    setGameState('crashed');
    setMessage('Round ended!');
    cancelAnimationFrame(animationRef.current);
    setCounterDepo((prev) => [counter.toFixed(2), ...prev.slice(0, 9)]);

    // Handle active bets
    if (activeBet) {
      setMessage(`Round ended at ${counter.toFixed(2)}x - You lost ${activeBet.amount}€`);
      setActiveBet(null);
    }

    // Start new round after 5 seconds
    setTimeout(() => {
      startBettingPhase();
    }, 5000);
  };

  const handleBet = () => {
    const numericBet = parseFloat(bet);

    if (gameState !== 'betting') {
      setMessage('Please wait for the betting phase');
      return;
    }

    if (!numericBet || numericBet <= 0) {
      setMessage('Please enter a valid bet amount');
      return;
    }

    if (numericBet > balance) {
      setMessage('Insufficient balance');
      return;
    }

    setBalance(prev => prev - numericBet);
    setActiveBet({ amount: numericBet });
    setMessage('Bet placed! Wait for takeoff');
    setBet('');
  };

  const handleCashOut = () => {
    if (gameState !== 'flying' || !activeBet) {
      return;
    }

    const winAmount = activeBet.amount * counter;
    setBalance(prev => prev + winAmount);
    setLastWin(winAmount);
    setMessage(`Successfully cashed out at ${counter.toFixed(2)}x - Won ${winAmount.toFixed(2)}€!`);
    setActiveBet(null);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const getBorderClass = (value) => {
    const val = parseFloat(value);
    if (val < 2.0) return 'blueBorder';
    else if (val < 10) return 'purpleBorder';
    else return 'burgundyBorder';
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
    setGameOver(false);
    setWinner(null);
    setBoard(initialBoard);
    setCurrentPlayer("white");
    setMoveHistory([]);
  };

  const signOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="game-container">
      {showConfetti && <div className="confetti-overlay" />}
      
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Highest Multiplier</span>
          <span className="stat-value">{highestMultiplier.toFixed(2)}x</span>
        </div>
      </div>

      <div className="game-header">
        <div className="multiplier-history">
          {counterDepo.map((value, index) => (
            <div key={index} className={`multiplier-badge ${getBorderClass(value)}`}>
              {value}x
            </div>
          ))}
        </div>
        <div className="balance-container">
          <span className="balance-label">BALANCE</span>
          <div className="balance-value">{balance.toFixed(2)}€</div>
          {lastWin && (
            <div className="last-win">+{lastWin.toFixed(2)}€</div>
          )}
        </div>
      </div>

      <div className="game-main">
        <div className="game-status">
          {gameState === 'betting' && (
            <div className="betting-timer">
              <div className="timer-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#30fcbe"
                    strokeWidth="3"
                    strokeDasharray={`${timeLeft * 10}, 100`}
                  />
                </svg>
                <span>{timeLeft}s</span>
              </div>
              Betting Phase
            </div>
          )}
          {gameState === 'flying' && (
            <div className="flying-timer">
              Flight in Progress
              <div className="pulse-dot" />
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="game-canvas"></canvas>
        <div className={`current-multiplier ${gameState === 'crashed' ? 'crashed' : ''}`}>
          {counter.toFixed(2)}x
        </div>
      </div>

      <div className="game-controls">
        <div className="bet-container">
          <div className="bet-input-wrapper">
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              min="0"
              max="100"
              className="bet-input"
              placeholder="Enter bet amount"
              disabled={gameState !== 'betting'}
            />
            <span className="currency-symbol">€</span>
          </div>
          {gameState === 'flying' && activeBet ? (
            <button 
              onClick={handleCashOut} 
              className="cashout-button"
            >
              CASH OUT ({(activeBet.amount * counter).toFixed(2)}€)
            </button>
          ) : (
            <button 
              onClick={handleBet} 
              className="bet-button"
              disabled={gameState !== 'betting'}
            >
              PLACE BET
            </button>
          )}
        </div>
        <div className={`message ${gameState === 'crashed' ? 'error' : ''}`}>{message}</div>
      </div>

      <style jsx>{`
        .game-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .stats-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1rem;
        }

        .stat {
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #8a8a8a;
        }

        .stat-value {
          font-size: 1.2rem;
          color: #30fcbe;
          font-weight: 600;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }

        .multiplier-history {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .multiplier-badge {
          padding: 6px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .multiplier-badge::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .multiplier-badge:hover::before {
          transform: translateX(0);
        }

        .blueBorder {
          background: rgba(52, 180, 255, 0.1);
          border: 1px solid rgb(52, 180, 255);
          color: rgb(52, 180, 255);
        }

        .purpleBorder {
          background: rgba(145, 62, 248, 0.1);
          border: 1px solid rgb(145, 62, 248);
          color: rgb(145, 62, 248);
        }

        .burgundyBorder {
          background: rgba(192, 23, 180, 0.1);
          border: 1px solid rgb(192, 23, 180);
          color: rgb(192, 23, 180);
        }

        .balance-container {
          background: rgba(48, 252, 190, 0.1);
          border: 1px solid #30fcbe;
          padding: 12px 24px;
          border-radius: 15px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .balance-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(48, 252, 190, 0.1), transparent);
          transform: translateX(-100%);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          100% { transform: translateX(100%); }
        }

        .balance-label {
          display: block;
          color: #30fcbe;
          font-size: 0.8rem;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .balance-value {
          color: #fff;
          font-size: 1.4rem;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(48, 252, 190, 0.5);
        }

        .last-win {
          color: #30fcbe;
          font-size: 1rem;
          margin-top: 4px;
          animation: fadeInUp 0.3s ease;
          font-weight: 600;
        }

        .game-main {
          position: relative;
          margin-bottom: 2rem;
        }

        .game-canvas {
          width: 100%;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .current-multiplier {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 2.5rem;
          font-weight: 700;
          color: #ff4757;
          text-shadow: 0 0 20px rgba(255, 71, 87, 0.5);
          transition: all 0.3s ease;
        }

        .current-multiplier.crashed {
          color: #dc3545;
          animation: shake 0.5s ease;
          text-shadow: 0 0 30px rgba(220, 53, 69, 0.8);
        }

        .game-status {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          background: rgba(0, 0, 0, 0.7);
          padding: 12px 24px;
          border-radius: 20px;
          font-weight: 600;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .betting-timer {
          color: #30fcbe;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .timer-circle {
          width: 36px;
          height: 36px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timer-circle svg {
          position: absolute;
          top: 0;
          left: 0;
          transform: rotate(-90deg);
        }

        .timer-circle path {
          transition: stroke-dasharray 0.3s ease;
        }

        .timer-circle span {
          color: #30fcbe;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .flying-timer {
          color: #ff4757;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #ff4757;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        .bet-container {
          display: flex;
          gap: 1rem;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .bet-input-wrapper {
          position: relative;
          flex: 1;
        }

        .bet-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 12px;
          padding-right: 30px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .currency-symbol {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.5);
        }

        .bet-input:focus {
          outline: none;
          border-color: #ff4757;
          box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.3);
        }

        .bet-button {
          background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          min-width: 150px;
          position: relative;
          overflow: hidden;
        }

        .bet-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .bet-button:hover::before {
          transform: translateX(100%);
        }

        .bet-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
        }

        .cashout-button {
          background: linear-gradient(135deg, #30fcbe 0%, #2ebd8f 100%);
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          min-width: 200px;
          position: relative;
          overflow: hidden;
        }

        .cashout-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .cashout-button:hover::before {
          transform: translateX(100%);
        }

        .cashout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(48, 252, 190, 0.3);
        }

        .message {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          text-align: center;
          min-height: 20px;
          margin-top: 1rem;
          padding: 8px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(5px);
        }

        .message.error {
          color: #ff4757;
          background: rgba(255, 71, 87, 0.1);
        }

        .confetti-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmNDc1NyIgY3g9IjUwIiBjeT0iNTAiIHI9IjUiLz48Y2lyY2xlIGZpbGw9IiMzMGZjYmUiIGN4PSI1MCIgY3k9IjUwIiByPSI1Ii8+PC9nPjwvc3ZnPg==');
          animation: confetti 1s ease infinite;
        }

        @keyframes confetti {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(-50%) translateX(0); }
          25% { transform: translateX(-50%) translateX(-5px); }
          75% { transform: translateX(-50%) translateX(5px); }
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bet-button:disabled,
        .cashout-button:disabled,
        .bet-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .bet-button:disabled:hover,
        .cashout-button:disabled:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default AviatorGame;