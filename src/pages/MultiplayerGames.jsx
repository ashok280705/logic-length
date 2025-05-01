import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar.jsx';

const MultiplayerGames = ({ games }) => {
  const navigate = useNavigate();

  const handleGameClick = (path) => {
    console.log(`Navigating to game: ${path}`);
    navigate(path);
  };

  // Default games if none provided via props
  const defaultGames = [
    { name: "Chess", path: "/multiplayer-chess", cost: 20, new: true, description: "Challenge players to the classic game of strategy!" },
    { name: "Tic Tac Toe", path: "/multiplayer-tictactoe", cost: 15, description: "Simple but fun! Be the first to get three in a row." }
  ];

  const displayGames = games || defaultGames;

  return (
    <div className="min-h-screen bg-[#0c0124] pt-14 lg:pt-0">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              MULTIPLAYER GAMES
            </h1>
            <button 
              onClick={() => navigate("/home")}
              className="bg-purple-600/50 hover:bg-purple-600/70 text-white py-2 px-4 rounded-lg transition-colors flex items-center mt-2 w-full text-center md:mt-0 md:w-auto md:ml-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
        
        {/* Content area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Featured game promo - Chess */}
          <div className="md:col-span-2 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-6 border border-purple-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-3">Multiplayer Chess</h2>
              <p className="text-purple-200 mb-6 max-w-2xl">
                Challenge players from around the world in this timeless game of strategy and skill. 
                Make your moves carefully, capture your opponent's pieces, and aim for checkmate!
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-purple-900/50 px-3 py-1.5 rounded-full text-purple-200 text-sm">
                  2 Players
                </div>
                <div className="bg-purple-900/50 px-3 py-1.5 rounded-full text-purple-200 text-sm">
                  Strategy
                </div>
                <div className="bg-purple-900/50 px-3 py-1.5 rounded-full text-purple-200 text-sm flex items-center">
                  <span className="text-yellow-300 font-bold mr-1">20</span> Coins to Play
                </div>
              </div>
              <button 
                onClick={() => handleGameClick("/multiplayer-chess")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 px-8 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                Play Now
              </button>
            </div>
          </div>
          
          {/* Game list sidebar */}
          <div>
            {/* Game list */}
            <div className="bg-[#0a0019] rounded-2xl p-4 border border-purple-600/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 px-2">Available Games</h3>
              <div className="space-y-3">
                {displayGames.map((game, index) => (
                  <button
                    key={index}
                    onClick={() => handleGameClick(game.path)}
                    className="w-full bg-[#1a0050]/40 p-4 rounded-xl border border-purple-500/30 hover:border-purple-500/70 transition-all duration-300 transform hover:scale-105 text-left focus:outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-white font-medium text-lg">
                        {game.name}
                        {game.new && (
                          <span className="ml-2 bg-green-500 text-xs font-bold px-2 py-0.5 rounded-full text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-300 font-bold text-xl mr-1">{game.cost}</span>
                        <span className="text-xs text-purple-300">COINS</span>
                      </div>
                    </div>
                    {game.description && (
                      <div className="text-purple-300 text-sm mt-1">{game.description}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Information card */}
            <div className="mt-6 bg-[#0a0019] rounded-2xl p-4 border border-purple-600/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2 px-2">How to Play</h3>
              <div className="text-purple-300 text-sm space-y-2 px-2">
                <p>Join our multiplayer games to challenge players from around the world.</p>
                <p>Each game requires coins to play. Win to earn more coins!</p>
                <p>If you run out of coins, you can purchase more from the payments page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGames; 