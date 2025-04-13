import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cards2 from './cards2';
import plinko from '../assets/games_images/plinko.png';
import tic_tac_toe from '../assets/games_images/tic.png';
import snakes from '../assets/games_images/sankes.png';
import mines from '../assets/games_images/mines.png';
import mines2 from '../assets/games_images/mines2.png';
import snail from '../assets/games_images/snail.png';
import aviator from '../assets/games_images/Aviator.png';

// Function to get the appropriate image based on game name
const getGameImage = (gameName) => {
  const gameNameLower = gameName.toLowerCase();
  if (gameNameLower.includes('plinko')) return plinko;
  if (gameNameLower.includes('tic tac toe')) return tic_tac_toe;
  if (gameNameLower.includes('snake')) return snakes;
  if (gameNameLower === 'mines') return mines;
  if (gameNameLower.includes('mines')) return mines2;
  if (gameNameLower.includes('snail')) return snail;
  
  // For games without matching images, return a default or null
  // You may need to add a default image if required
  return null;
};

// XP and level management functions
const calculateXpReward = (gameCost) => {
  // Base XP reward is 2 times the game cost
  return gameCost * 2;
};

const calculateLevelFromXp = (totalXp) => {
  // Simple level calculation formula:
  // Level 1: 0-100 XP
  // Level 2: 101-250 XP
  // Level 3: 251-450 XP
  // And so on with increasing XP requirements
  if (totalXp <= 100) return 1;
  if (totalXp <= 250) return 2;
  if (totalXp <= 450) return 3;
  if (totalXp <= 700) return 4;
  if (totalXp <= 1000) return 5;
  if (totalXp <= 1350) return 6;
  if (totalXp <= 1750) return 7;
  if (totalXp <= 2200) return 8;
  if (totalXp <= 2700) return 9;
  return Math.floor(totalXp / 300) + 1; // For higher levels
};

const getXpForNextLevel = (currentLevel) => {
  switch (currentLevel) {
    case 1: return 100;
    case 2: return 250;
    case 3: return 450;
    case 4: return 700;
    case 5: return 1000;
    case 6: return 1350;
    case 7: return 1750;
    case 8: return 2200;
    case 9: return 2700;
    default: return (currentLevel - 1) * 300; // For higher levels
  }
};

const calculateXpPercentage = (totalXp, currentLevel) => {
  if (currentLevel === 1) {
    // For level 1, percentage is just totalXp/100
    return Math.min(totalXp, 100);
  }
  
  // For higher levels, calculate percentage between current level min XP and next level XP
  const previousLevelXp = getXpForNextLevel(currentLevel - 1);
  const nextLevelXp = getXpForNextLevel(currentLevel);
  const levelXpRange = nextLevelXp - previousLevelXp;
  const xpInCurrentLevel = totalXp - previousLevelXp;
  
  return Math.floor((xpInCurrentLevel / levelXpRange) * 100);
};

// Combine all games into one array for each category
const allGames = {
  "TRENDING": [
    { id: 1, name: "Rock Paper Scissors", image: "rps.jpeg", path: "/rock-paper-scissors", cost: 15 },
    { id: 2, name: "Chess", image: "chess.jpeg", path: "/chess", cost: 10 },
    { id: 3, name: "Plinko", image: plinko, path: "/game7", cost: 20 },
    { id: 4, name: "Aviator", image: aviator, path: "/game8", cost: 25 },
    { id: 5, name: "Tic Tac Toe", image: tic_tac_toe, path: "/tictactoe", cost: 5 },
    { id: 6, name: "Snake & Ladder", image: snakes, path: "/snakes", cost: 5 },
    { id: 7, name: "Snail Race", image: snail, path: "/snail-race", cost: 10 },
    { id: 8, name: "Dice", image: "dice.jpeg", path: "/game6", cost: 10 }
  ],
  "PLAYING": [
    { id: 1, name: "Tic Tac Toe", image: tic_tac_toe, path: "/tictactoe", cost: 5 },
    { id: 2, name: "Snake & Ladder", image: snakes, path: "/snakes", cost: 5 },
    { id: 3, name: "Snail Race", image: snail, path: "/snail-race", cost: 10 },
    { id: 4, name: "Dice", image: "dice.jpeg", path: "/game6", cost: 10 },
    { id: 5, name: "Rock Paper Scissors", image: "rps.jpeg", path: "/mines-plinko", cost: 15 },
    { id: 6, name: "Chess", image: "chess.jpeg", path: "/chess", cost: 10 },
    { id: 7, name: "Plinko", image: plinko, path: "/game7", cost: 20 },
    { id: 8, name: "Aviator", image: "aviator.jpeg", path: "/game8", cost: 25 }
  ],
  "GAMES": [
    { id: 1, name: "Rock Paper Scissors", image: "rps.jpeg", path: "/mines-plinko", cost: 15 },
    { id: 2, name: "Chess", image: "chess.jpeg", path: "/chess", cost: 10 },
    { id: 3, name: "Tic Tac Toe", image: tic_tac_toe, path: "/tictactoe", cost: 5 },
    { id: 4, name: "Snake & Ladder", image: snakes, path: "/snakes", cost: 5 },
    { id: 5, name: "Snail Race", image: snail, path: "/snail-race", cost: 10 },
    { id: 6, name: "Dice", image: "dice.jpeg", path: "/game6", cost: 10 },
    { id: 7, name: "Plinko", image: plinko, path: "/game7", cost: 20 },
    { id: 8, name: "Aviator", image: "aviator.jpeg", path: "/game8", cost: 25 }
  ]
};

const BigCard = ({ title }) => {
  const [isHovered, setIsHovered] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ oldLevel: 0, newLevel: 0 });
  const [showXpGainToast, setShowXpGainToast] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Find game by path
  const findGameByPath = (path) => {
    // Search in all categories
    for (const category in allGames) {
      const game = allGames[category].find(g => g.path === path);
      if (game) return game;
    }
    return null;
  };

  const navigateToGame = (path) => {
    const game = findGameByPath(path);
    if (!game) {
      navigate(path);
      return;
    }
    
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      
      // Check if user has enough coins
      if ((userData.coins || 0) >= game.cost) {
        // Deduct game cost
        userData.coins -= game.cost;
        
        // Calculate XP reward
        const xpReward = calculateXpReward(game.cost);
        setXpGained(xpReward);
        
        // Add XP to user data
        const currentTotalXp = userData.totalXp || 0;
        const newTotalXp = currentTotalXp + xpReward;
        userData.totalXp = newTotalXp;
        
        // Calculate old and new level
        const oldLevel = userData.level || 1;
        const newLevel = calculateLevelFromXp(newTotalXp);
        
        // Calculate XP percentage for progress bar
        const xpPercentage = calculateXpPercentage(newTotalXp, newLevel);
        userData.xp = xpPercentage;
        
        // Check if level up occurred
        if (newLevel > oldLevel) {
          userData.level = newLevel;
          setLevelUpData({ oldLevel, newLevel });
          setShowLevelUpModal(true);
        } else {
          userData.level = newLevel;
        }
        
        // Save updated user data to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Show XP gain toast
        setShowXpGainToast(true);
        setTimeout(() => setShowXpGainToast(false), 3000);
        
        // Navigate to game
        navigate(path);
      } else {
        // Show insufficient coins notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-5 right-5 bg-red-500 text-white p-3 rounded-lg shadow-lg animate-fade-in-out z-50';
        notification.textContent = `Not enough coins! You need ${game.cost} coins to play ${game.name}.`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    } else {
      // No user data found, just navigate
      navigate(path);
    }
  };

  // Check if user has enough coins from localStorage
  const hasEnoughCoins = (cost) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      return (userData.coins || 0) >= cost;
    }
    return false;
  };

  // Handle scrolling
  const scrollLeft = () => {
    const container = document.getElementById(`cards-container-${title}`);
    if (container) {
      const scrollAmount = 260; // Adjusted for smaller card width + gap
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setScrollPosition(Math.max(0, scrollPosition - scrollAmount));
    }
  };

  const scrollRight = () => {
    const container = document.getElementById(`cards-container-${title}`);
    if (container) {
      const scrollAmount = 260; // Adjusted for smaller card width + gap
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setScrollPosition(scrollPosition + scrollAmount);
    }
  };

  // Get games to display based on showAll state
  const displayedGames = showAll ? allGames[title] : allGames[title].slice(0, 4);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white neon-text">{title}</h2>
        <div className="flex items-center gap-4">
          {!showAll && (
            <div className="flex gap-2">
              <button 
                onClick={scrollLeft}
                className="p-2 bg-[#170045]/60 rounded-full hover:bg-[#230061]/70 transition-colors text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={scrollRight}
                className="p-2 bg-[#170045]/60 rounded-full hover:bg-[#230061]/70 transition-colors text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-[#b69fff] hover:text-white transition-colors duration-300 flex items-center"
          >
            {showAll ? 'Show Less' : 'View All'}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transform transition-transform duration-300 ${showAll ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div id={`cards-container-${title}`} className={`hide-scrollbar snap-x py-4 ${showAll ? 'grid grid-cols-5 gap-4' : 'flex space-x-4 overflow-x-auto'}`}>
        {isLoading ? (
          // Loading skeleton cards
          Array(4).fill().map((_, index) => (
            <div key={index} className="animate-pulse w-64 h-48 rounded-xl bg-gradient-to-br from-[#1a0050]/40 to-[#1a0050]/20 flex-shrink-0 snap-start"></div>
          ))
        ) : (
          displayedGames.map((game) => (
            <div
              key={game.id}
              className={`game-card flip-card w-64 h-48 ${!showAll ? 'flex-shrink-0 snap-start' : ''} relative group cursor-pointer overflow-hidden rounded-xl transform transition-all duration-500 hover:scale-[1.03]`}
              onClick={() => navigateToGame(game.path)}
              onMouseEnter={() => setIsHovered(game.id)}
              onMouseLeave={() => setIsHovered(null)}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front h-full w-full">
                  {/* Game card front */}
                  <div className="h-full w-full relative overflow-hidden rounded-xl">
                    {/* Background image with overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-10"></div>
                    <img 
                      src={typeof game.image === 'string' ? (game.image.startsWith('http') ? game.image : getGameImage(game.name) || game.image) : game.image} 
                      alt={game.name} 
                      className="h-full w-full object-contain transform transition-transform duration-[8000ms] ease-in-out group-hover:scale-110"
                    />
                    
                    {/* Scanlines effect */}
                    <div className="scanlines absolute inset-0 z-20 opacity-30 pointer-events-none"></div>
                    
                    {/* Game info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-30 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-lg font-bold text-white mb-1">{game.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="bg-[#2a1664]/80 px-2 py-0.5 rounded-full text-xs text-white flex items-center">
                          <span className="mr-1 text-yellow-300 font-bold">{game.cost}</span>
                          <span className="text-purple-300">COINS</span>
                        </div>
                        <div className="flex items-center text-xs text-white/80">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>1.2k playing</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* XP gain indicator */}
                    <div className="absolute top-3 left-3 z-30">
                      <div className="bg-green-500/80 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>+{calculateXpReward(game.cost)} XP</span>
                      </div>
                    </div>
                    
                    {/* Animated play button */}
                    <div className={`absolute inset-0 flex items-center justify-center z-30 transform transition-all duration-500 ${isHovered === game.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                      <div className="w-14 h-14 rounded-full bg-[#6320dd]/80 flex items-center justify-center pulse-effect border-2 border-white/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Warning if not enough coins */}
                    {!hasEnoughCoins(game.cost) && (
                      <div className="absolute top-3 right-3 z-30">
                        <div className="bg-red-500/80 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Low coins
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Game card back - this will show on hover in browsers that support it */}
                <div className="flip-card-back h-full w-full bg-gradient-to-br from-[#1a0050] to-[#09001a] p-3 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2">{game.name}</h3>
                  <p className="text-xs text-purple-300 mb-3">Experience the thrill of {game.name} with our enhanced gameplay and amazing rewards!</p>
                  
                  <div className="flex items-center mb-2">
                    <div className="bg-green-500/20 rounded-lg px-2 py-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs text-green-400">+{calculateXpReward(game.cost)} XP per play</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-xs text-white/80 mb-2">
                      <span>Player Rating</span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </span>
                    </div>
                    
                    <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-sm font-medium transition-all duration-300">
                      Play Now for {game.cost} Coins
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Side glow effect on hover */}
              <div 
                className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-[#6320dd] to-transparent transform transition-all duration-500 ${isHovered === game.id ? 'opacity-100' : 'opacity-0'}`}
              ></div>
              <div 
                className={`absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-[#6320dd] to-transparent transform transition-all duration-500 ${isHovered === game.id ? 'opacity-100' : 'opacity-0'}`}
              ></div>
            </div>
          ))
        )}
      </div>
      
      {/* Level Up Modal */}
      {showLevelUpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div 
            className="relative bg-gradient-to-b from-[#1a0045] to-[#0d0028] w-full max-w-md p-6 rounded-xl border-2 border-purple-500/30 shadow-[0_0_25px_rgba(139,92,246,0.3)] animate-level-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -inset-px bg-gradient-to-r from-purple-600/20 via-transparent to-blue-600/20 rounded-xl blur-sm"></div>
            <div className="relative">
              <div className="flex flex-col items-center justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mb-4 animate-pulse-slow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-2">
                  Level Up!
                </h2>
                <p className="text-center text-purple-300 mb-3">
                  Congratulations! You've reached level {levelUpData.newLevel}!
                </p>
                <div className="flex items-center justify-center space-x-6 my-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-400">{levelUpData.oldLevel}</div>
                    <p className="text-xs text-gray-500">OLD LEVEL</p>
                  </div>
                  <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{levelUpData.newLevel}</div>
                    <p className="text-xs text-purple-300">NEW LEVEL</p>
                  </div>
                </div>
                <p className="text-center text-white/80 text-sm mb-6">
                  Keep playing to unlock more rewards and features!
                </p>
                <button
                  onClick={() => setShowLevelUpModal(false)}
                  className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* XP Gain Toast */}
      {showXpGainToast && (
        <div className="fixed top-5 right-5 bg-green-500 text-white p-3 rounded-lg shadow-lg animate-slide-in z-50 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>+{xpGained} XP gained!</span>
        </div>
      )}
    </div>
  );
};

export default BigCard;
