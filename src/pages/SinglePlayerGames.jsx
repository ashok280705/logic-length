import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar.jsx';

const SinglePlayerGames = ({ games }) => {
  const navigate = useNavigate();

  const handleGameClick = (path) => {
    console.log(`Navigating to game: ${path}`);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#0c0124]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            SINGLE PLAYER GAMES
          </h1>
          <button 
            onClick={() => navigate("/home")}
            className="bg-purple-600/50 hover:bg-purple-600/70 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
        </div>
        
        {/* Content area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {/* Main featured game visualization */}
            <div className="bg-gradient-to-br from-[#0a0019] to-[#1a0045] rounded-2xl p-6 h-[60vh] overflow-hidden relative shadow-2xl border border-purple-600/30">
              {/* Game visualization */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,_#8b5cf6_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
              </div>
              
              {/* Grid and elements */}
              <div className="relative h-full flex flex-col items-center justify-center">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">PLAY SOLO</h2>
                  <p className="text-purple-300 max-w-lg mx-auto">
                    Enjoy your gaming experience with our collection of single player games
                    designed to challenge and entertain.
                  </p>
                </div>
                
                {/* Single player visualization */}
                <div className="relative w-64 h-64">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-r from-orange-500/60 to-purple-600/60 flex items-center justify-center">
                    <div className="text-white text-4xl">1P</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            {/* Game list */}
            <div className="bg-[#0a0019] rounded-2xl p-4 border border-purple-600/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 px-2">Available Games</h3>
              <div className="space-y-3">
                {games.map((game, index) => (
                  <button
                    key={index}
                    onClick={() => handleGameClick(game.path)}
                    className="w-full bg-[#1a0050]/40 p-4 rounded-xl border border-purple-500/30 hover:border-purple-500/70 transition-all duration-300 transform hover:scale-105 text-left focus:outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-white font-medium text-lg">
                        {game.name}
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-300 font-bold text-xl mr-1">{game.cost}</span>
                        <span className="text-xs text-purple-300">COINS</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button 
                  onClick={() => navigate("/home")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePlayerGames; 