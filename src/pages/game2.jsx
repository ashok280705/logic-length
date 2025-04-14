import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar.jsx';

const Game = () => {
  // State variables
  const [minePositions, setMinePositions] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [numberOfMines, setNumberOfMines] = useState(0);
  const [currentBetAmount, setCurrentBetAmount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize coins on page load
  useEffect(() => {
    // Check for user authentication
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      alert('You are not logged in.');
      window.location.href = '/';
      return;
    }
    
    // Get user data and coins
    const user = JSON.parse(userStr);
    setUserCoins(user.coins || 0);
  }, []);

  // Start the game and set up mines
  const startGame = () => {
    // Check if user has enough coins
    if (userCoins < betAmount) {
      alert('Not enough coins! Please top up your balance.');
      return;
    }

    // Deduct coins from user's balance
    const updatedCoins = userCoins - betAmount;
    setUserCoins(updatedCoins);
    
    // Update user data in localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.coins = updatedCoins;
      localStorage.setItem('user', JSON.stringify(user));
    }

    setGameStarted(true);
    setCurrentBetAmount(betAmount);
    document.querySelector('.current-bet-amount').textContent = `$${betAmount.toFixed(2)}`;
    
    // Generate mine positions
    const mines = generateMinePositions(25, numberOfMines);
    setMinePositions(mines);
  };

  // Handle clicking on a card
  const changeColor = (index) => {
    if (!gameStarted) return;

    const isMine = minePositions.includes(index);

    if (isMine) {
      alert('BOOM! You hit a mine! Game over.');
      revealAllCards();
      resetGame();
    } else {
      const reward = calculateReward();
      setCurrentBetAmount(currentBetAmount + reward);
      document.querySelector('.current-bet-amount').textContent = `$${(currentBetAmount + reward).toFixed(2)}`;
    }
  };

  // Reveal all cards after hitting a mine
  const revealAllCards = () => {
    // Set all cards as clicked and display them
    // Code to reveal all cards goes here...
  };

  // Calculate reward based on remaining safe cards
  const calculateReward = () => {
    const totalCards = 25;
    const greenCards = totalCards - numberOfMines;
    const revealedCards = document.querySelectorAll('.card.clicked').length;
    const remainingGreenCards = greenCards - revealedCards;
    const multiplier = remainingGreenCards > 0 ? totalCards / remainingGreenCards : 1;

    return betAmount * multiplier;
  };

  // Reset the game board
  const resetGame = () => {
    setGameStarted(false);
    setCurrentBetAmount(0);
    document.querySelector('.current-bet-amount').textContent = '$0.00';
  };

  // Utility function to generate random mine positions
  const generateMinePositions = (totalCards, minesCount) => {
    const positions = new Set();
    while (positions.size < minesCount) {
      const randomIndex = Math.floor(Math.random() * totalCards);
      positions.add(randomIndex);
    }
    return Array.from(positions);
  };

  // Handle "Cashout"
  const handleCashout = () => {
    if (currentBetAmount > 0) {
      // Add winnings to user's coins
      const winnings = currentBetAmount;
      const updatedCoins = userCoins + winnings;
      setUserCoins(updatedCoins);
      
      // Update user data in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.coins = updatedCoins;
        localStorage.setItem('user', JSON.stringify(user));
      }

      alert(`You cashed out with $${currentBetAmount.toFixed(2)}!`);
      resetGame();
    } else {
      alert('No winnings to cash out. Play the game first!');
    }
  };

  // Sign-out functionality
  const signOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0124] via-[#12002e] to-[#160041] overflow-hidden">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar onLogout={signOut} user={{ name: "Player", coins: userCoins }} />
      </div>

      {/* Game container with pixel pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#8b5cf6_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Game title */}
      <div className="pt-24 pb-4 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
          MINES GAME
        </h1>
        <p className="text-purple-300 mt-2 animate-pulse">Test your luck and strategy!</p>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Box */}
            <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <h2 className="text-xl font-bold text-purple-300 mb-2">Your Coins</h2>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                {userCoins}
              </div>
            </div>

            {/* Game Controls */}
            <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <div className="space-y-4">
                <div>
                  <label htmlFor="bet-amount" className="block text-purple-300 mb-2">Bet Amount</label>
                  <input 
                    type="number" 
                    id="bet-amount" 
                    className="w-full px-4 py-2 bg-purple-900/50 border-2 border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min="1" 
                    step="1" 
                    defaultValue="1" 
                  />
                </div>
                <div>
                  <label htmlFor="mines" className="block text-purple-300 mb-2">Number of Mines</label>
                  <input 
                    type="number" 
                    id="mines" 
                    className="w-full px-4 py-2 bg-purple-900/50 border-2 border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min="1" 
                    step="1" 
                    defaultValue="1" 
                  />
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={startGame}
                    className="w-full py-3 bg-gradient-to-r from-purple-700 to-pink-700 text-white rounded-lg text-lg font-bold transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                  >
                    Place Bet
                  </button>
                  <button 
                    onClick={handleCashout}
                    className="w-full py-3 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg text-lg font-bold transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  >
                    Cashout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Game Grid */}
          <div className="lg:col-span-3">
            <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 25 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="aspect-square rounded-xl cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => changeColor(index)} 
                    style={{ 
                      backgroundColor: minePositions.includes(index) 
                        ? 'rgb(239, 68, 68)' 
                        : 'rgb(99, 102, 241)',
                      boxShadow: minePositions.includes(index)
                        ? '0 0 20px rgba(239, 68, 68, 0.5)'
                        : '0 0 20px rgba(99, 102, 241, 0.5)'
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Current Bet Display */}
            <div className="mt-6 glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] text-center">
              <h2 className="text-xl font-bold text-purple-300 mb-2">Current Bet</h2>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 current-bet-amount">
                ${currentBetAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mt-8 pt-4 pb-6 text-center text-purple-300/70 text-sm">
        <p>© 2024-2025 TEAM LOGICLENGTH. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Game;

