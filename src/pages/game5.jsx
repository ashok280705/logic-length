import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from "../services/authService";
import { useMultiplayer } from '../context/MultiplayerContext';
import { multiplayerService } from '../services/multiplayerGameService';

const RockPaperScissors = ({ cost = 15, deductCoins = () => true, user, onLogout }) => {
  const [userChoice, setUserChoice] = useState('');
  const [computerChoice, setComputerChoice] = useState('');
  const [result, setResult] = useState('');
  const [score, setScore] = useState({ user: 0, computer: 0 });
  const [showAnimation, setShowAnimation] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [userCoins, setUserCoins] = useState(user?.coins || 0);
  const [gameHistory, setGameHistory] = useState([]);
  const COST_TO_PLAY = cost; // Use the cost from props
  const navigate = useNavigate();
  const { joinGame, leaveGame, gameState, opponent, isWaiting } = useMultiplayer();
  const [matchId, setMatchId] = useState(null);
  const [isSinglePlayer, setIsSinglePlayer] = useState(true);

  const choices = ['rock', 'paper', 'scissors'];

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
    if (gameState) {
      // Update game state based on multiplayer state
      if (gameState.players) {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const player = gameState.players.find(p => p.userId === currentUser?.uid);
        
        if (player && gameState.choices) {
          setUserChoice(gameState.choices[player.userId] || '');
        }
        
        // Set opponent's choice if available
        if (opponent && gameState.choices && gameState.choices[opponent.userId]) {
          setComputerChoice(gameState.choices[opponent.userId]);
        }
        
        // Update game result if both players have made their choices
        if (gameState.result) {
          setResult(gameState.result[currentUser?.uid] || '');
          if (gameState.result[currentUser?.uid] === 'You win!') {
            setScore(prev => ({ ...prev, user: prev.user + 1 }));
          } else if (gameState.result[currentUser?.uid] === 'You lose!') {
            setScore(prev => ({ ...prev, computer: prev.computer + 1 }));
          }
        }
      }
    }
  }, [gameState, opponent]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (!isSinglePlayer && matchId) {
        leaveGame();
      }
    };
  }, [matchId]);

  const getComputerChoice = () => {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  };

  const determineWinner = (user, computer) => {
    if (user === computer) {
      return "It's a tie!";
    } else if (
      (user === 'rock' && computer === 'scissors') ||
      (user === 'paper' && computer === 'rock') ||
      (user === 'scissors' && computer === 'paper')
    ) {
      return 'You win!';
    } else {
      return 'Computer wins!';
    }
  };

  const startGame = async () => {
    if (userCoins < COST_TO_PLAY) {
      alert(`Not enough coins! You need ${COST_TO_PLAY} coins to play. Please top up your balance.`);
      navigate('/payment');
      return;
    }

    const success = deductCoins();
    if (!success) {
      alert(`Failed to deduct ${COST_TO_PLAY} coins. Please try again.`);
      return;
    }

    setUserCoins(prevCoins => prevCoins - COST_TO_PLAY);
    
    if (!isSinglePlayer) {
      try {
        await joinGame('rps');
        setGameStarted(true);
      } catch (error) {
        console.error('Failed to join multiplayer game:', error);
        alert('Failed to join multiplayer game. Please try again.');
      }
    } else {
      setGameStarted(true);
      setScore({ user: 0, computer: 0 });
      setGameHistory([]);
    }
  };

  const playGame = (choice) => {
    if (!gameStarted) {
      startGame();
      return;
    }
    
    setShowAnimation(true);
    setUserChoice('');
    setComputerChoice('');
    setResult('');
    
    if (!isSinglePlayer) {
      // Send move to multiplayer service
      multiplayerService.makeRPSChoice(gameState.gameId, choice);
    } else {
      setTimeout(() => {
        const compChoice = getComputerChoice();
        const gameResult = determineWinner(choice, compChoice);
        setUserChoice(choice);
        setComputerChoice(compChoice);
        setResult(gameResult);
        setShowAnimation(false);
        
        // Update history for single player mode
        setGameHistory(prev => [...prev, {
          userChoice: choice,
          computerChoice: compChoice,
          result: gameResult === 'You win!' ? 'win' : gameResult === 'Computer wins!' ? 'lose' : 'tie',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 1000);
    }
  };

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

  const getEmoji = (choice) => {
    switch (choice) {
      case 'rock': return '✊';
      case 'paper': return '✋';
      case 'scissors': return '✌️';
      default: return '';
    }
  };

  const getResultClass = (resultText) => {
    if (resultText === "You win!") return "text-green-400";
    if (resultText === "Computer wins!") return "text-red-400";
    return "text-yellow-300";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0124] via-[#14014a] to-[#190071] text-white font-sans relative overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              backgroundColor: `rgba(${Math.random() * 100 + 100}, ${Math.random() * 50 + 50}, ${Math.random() * 200 + 55}, ${Math.random() * 0.2 + 0.1})`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Top navigation bar */}
      <div className="relative z-10 flex justify-between items-center p-4 bg-[rgba(26,0,73,0.6)] backdrop-blur-md border-b border-purple-900/30">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Rock Paper Scissors
          </h1>
          <div className="ml-6 bg-[rgba(0,0,0,0.3)] px-4 py-2 rounded-full flex items-center">
            <span className="text-yellow-300 font-bold text-xl mr-1">{userCoins}</span>
            <span className="text-xs text-purple-300">COINS</span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="cybr-btn px-6 py-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] border border-purple-500/30 rounded-md transition-all duration-300 flex items-center"
        >
          <span className="mr-2">Home</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 relative z-10">
        <div className="flex flex-col">
          {/* Game header */}
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-extrabold mb-2 neon-text animate-pulse">
              {!gameStarted ? "Ready to Play?" : "Make Your Move"}
            </h2>
            
            {!gameStarted && (
              <div className="glass-effect mx-auto max-w-md p-4 rounded-xl bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-purple-500/20">
                {/* Game mode selection */}
                <div className="mb-4">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setIsSinglePlayer(true)}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                        isSinglePlayer 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-900/30 text-purple-300'
                      }`}
                    >
                      Single Player
                    </button>
                    <button
                      onClick={() => setIsSinglePlayer(false)}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                        !isSinglePlayer 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-900/30 text-purple-300'
                      }`}
                    >
                      Multiplayer
                    </button>
                  </div>
                </div>
                
                <p className="text-lg">
                  Cost to play: <span className="text-yellow-300 font-bold">{COST_TO_PLAY}</span> coins
                </p>
                <p className="text-sm text-purple-300 mt-1">First to win 5 rounds wins the match!</p>
              </div>
            )}
          </div>

          {/* Show waiting screen for multiplayer */}
          {!isSinglePlayer && isWaiting ? (
            <div className="text-center">
              <h2 className="text-2xl mb-4">Waiting for opponent...</h2>
              <div className="animate-spin text-4xl">🎮</div>
            </div>
          ) : (
            /* Game area with perspective effect */
            <div className="perspective-container mb-8">
              <div className="perspective-element glass-effect min-h-[300px] rounded-2xl p-6 bg-[rgba(26,0,73,0.4)] border border-purple-500/20 backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden">
                {/* Top pulsing border */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
                
                {/* Choices display area */}
                <div className="flex justify-center items-center mb-6 relative">
                  {showAnimation ? (
                    <div className="text-6xl animate-spin">🎮</div>
                  ) : userChoice && computerChoice ? (
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-purple-300 mb-1">You chose</span>
                        <div className="text-6xl transition-all duration-300 transform hover:scale-110 mb-2">
                          {getEmoji(userChoice)}
                        </div>
                        <span className="capitalize text-white/80">{userChoice}</span>
                      </div>
                      
                      <div className="text-2xl font-bold my-2 md:my-0 relative">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-20 animate-pulse"></div>
                        VS
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-purple-300 mb-1">Computer chose</span>
                        <div className="text-6xl transition-all duration-300 transform hover:scale-110 mb-2">
                          {getEmoji(computerChoice)}
                        </div>
                        <span className="capitalize text-white/80">{computerChoice}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl text-purple-300">
                      {gameStarted ? "Choose rock, paper, or scissors below!" : "Start the game to play!"}
                    </div>
                  )}
                </div>
                
                {/* Result display */}
                {result && (
                  <div className={`text-2xl font-bold mb-6 ${getResultClass(result)} animate-bounce`}>
                    {result}
                  </div>
                )}
                
                {/* Game controls */}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {gameStarted ? (
                    <>
                      {choices.map((choice) => (
                        <button
                          key={choice}
                          onClick={() => playGame(choice)}
                          disabled={showAnimation}
                          className="holo-card relative bg-gradient-to-br from-[rgba(55,20,150,0.7)] to-[rgba(25,0,73,0.7)] hover:from-[rgba(85,30,180,0.8)] hover:to-[rgba(35,5,103,0.8)] px-6 py-4 rounded-xl border border-purple-500/30 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] backdrop-blur-sm"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">{getEmoji(choice)}</span>
                            <span className="capitalize font-medium">{choice}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <button
                      onClick={startGame}
                      className="ultra-gradient text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-all duration-300 transform hover:scale-105 pulse-effect"
                    >
                      Start Game ({COST_TO_PLAY} coins)
                    </button>
                  )}
                </div>
                
                {/* Bottom pulsing border */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
              </div>
            </div>
          )}
          
          {/* Score display */}
          <div className="glass-effect rounded-xl p-4 bg-[rgba(26,0,73,0.4)] border border-purple-500/20 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-4 gradient-text">Score</h3>
            <div className="flex justify-around">
              <div className={`text-center p-3 rounded-lg ${score.user > score.computer ? 'bg-green-900/30 border border-green-500/30' : 'bg-purple-900/20'}`}>
                <div className="text-sm text-purple-300 mb-1">You</div>
                <div className="text-4xl font-bold">{score.user}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-purple-300 mt-4">VS</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${score.computer > score.user ? 'bg-red-900/30 border border-red-500/30' : 'bg-purple-900/20'}`}>
                <div className="text-sm text-purple-300 mb-1">Computer</div>
                <div className="text-4xl font-bold">{score.computer}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game history and rules sidebar */}
        <div className="flex flex-col gap-6">
          {/* Game history */}
          <div className="glass-effect rounded-xl p-4 bg-[rgba(26,0,73,0.4)] border border-purple-500/20 backdrop-blur-md h-[350px] overflow-auto">
            <h3 className="text-xl font-bold mb-4 gradient-text">Match History</h3>
            {gameHistory.length > 0 ? (
              <div className="space-y-2">
                {gameHistory.map((game, index) => (
                  <div key={index} className={`p-2 rounded-lg text-sm ${
                    game.result === 'win' ? 'bg-green-900/20 border-l-4 border-green-500' : 
                    game.result === 'lose' ? 'bg-red-900/20 border-l-4 border-red-500' : 
                    'bg-yellow-900/20 border-l-4 border-yellow-500'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{getEmoji(game.userChoice)}</span>
                        <span className="text-xs text-purple-300">vs</span>
                        <span>{getEmoji(game.computerChoice)}</span>
                      </div>
                      <div className={`text-xs ${
                        game.result === 'win' ? 'text-green-400' : 
                        game.result === 'lose' ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {game.result === 'win' ? 'Victory' : game.result === 'lose' ? 'Defeat' : 'Draw'}
                      </div>
                    </div>
                    <div className="text-xs text-purple-300/70 mt-1">{game.timestamp}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-purple-300/70 p-4">
                No games played yet
              </div>
            )}
          </div>
          
          {/* Game rules */}
          <div className="glass-effect rounded-xl p-4 bg-[rgba(26,0,73,0.4)] border border-purple-500/20 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-4 gradient-text">Game Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-purple-100/90">
              <li>Rock crushes Scissors</li>
              <li>Scissors cuts Paper</li>
              <li>Paper covers Rock</li>
              <li>Each game costs {COST_TO_PLAY} coins</li>
              <li>First to win 5 rounds wins the match!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RockPaperScissors;