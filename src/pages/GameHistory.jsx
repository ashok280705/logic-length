import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GameHistory = ({ user }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState([]);

  // Debug log when component mounts
  useEffect(() => {
    console.log("GameHistory component mounted");
  }, []);

  // Sample game history data - in a real app, this would come from an API
  const sampleGameHistory = [
    { 
      id: 1, 
      game: 'Chess', 
      opponent: 'Player578', 
      result: 'win', 
      coins: 25, 
      date: new Date(2023, 7, 15, 14, 30) 
    },
    { 
      id: 2, 
      game: 'Tic Tac Toe', 
      opponent: 'GamerPro99', 
      result: 'loss', 
      coins: -10, 
      date: new Date(2023, 7, 14, 20, 15) 
    },
    { 
      id: 3, 
      game: 'Rock Paper Scissors', 
      opponent: 'LuckyWinner', 
      result: 'win', 
      coins: 15, 
      date: new Date(2023, 7, 14, 18, 45) 
    },
    { 
      id: 4, 
      game: 'Snakes & Ladder', 
      opponent: 'AI Opponent', 
      result: 'loss', 
      coins: -5, 
      date: new Date(2023, 7, 13, 21, 10) 
    },
    { 
      id: 5, 
      game: 'Chess', 
      opponent: 'ChessMaster', 
      result: 'draw', 
      coins: 0, 
      date: new Date(2023, 7, 12, 15, 30) 
    },
    { 
      id: 6, 
      game: 'Tic Tac Toe', 
      opponent: 'AI Opponent', 
      result: 'win', 
      coins: 5, 
      date: new Date(2023, 7, 11, 19, 20) 
    },
    { 
      id: 7, 
      game: 'Rock Paper Scissors', 
      opponent: 'RockFan22', 
      result: 'win', 
      coins: 15, 
      date: new Date(2023, 7, 10, 17, 45) 
    }
  ];

  useEffect(() => {
    // Simulate API call to get game history
    const fetchGameHistory = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // await axios.get('/api/game-history')
        
        // Using sample data for now
        setTimeout(() => {
          setGameHistory(sampleGameHistory);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch game history:', error);
        setIsLoading(false);
      }
    };

    fetchGameHistory();
  }, []);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get class for result indicator
  const getResultClass = (result) => {
    switch(result.toLowerCase()) {
      case 'win': return 'bg-green-500/60';
      case 'loss': return 'bg-red-500/60';
      case 'draw': return 'bg-yellow-500/60';
      default: return 'bg-gray-500/60';
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0124] text-white pt-[9vh]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Game History
          </h1>
          <button 
            onClick={() => navigate("/home")}
            className="bg-purple-600/50 hover:bg-purple-600/70 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-[#1a0050]/80 to-[#0c0124]/80 rounded-xl p-4 border border-purple-600/30 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Wins</p>
                <p className="text-2xl font-bold">{gameHistory.filter(g => g.result === 'win').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1a0050]/80 to-[#0c0124]/80 rounded-xl p-4 border border-purple-600/30 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Net Coins</p>
                <p className="text-2xl font-bold">{gameHistory.reduce((sum, game) => sum + game.coins, 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1a0050]/80 to-[#0c0124]/80 rounded-xl p-4 border border-purple-600/30 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Games Played</p>
                <p className="text-2xl font-bold">{gameHistory.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game History Table */}
        <div className="bg-gradient-to-b from-[#1a0050]/40 to-[#0c0124]/40 rounded-xl border border-purple-600/30 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 border-purple-500 border-t-4 border-b-4 rounded-full animate-spin"></div>
                  <div className="w-12 h-12 border-blue-500 border-t-4 border-b-4 rounded-full animate-spin absolute top-4 left-4"></div>
                </div>
              </div>
            ) : gameHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No game history found. Start playing to see your history here!</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2a1664]/70">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Game</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Opponent</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-300">Result</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Coins</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2c0b7a]/30">
                  {gameHistory.map((game) => (
                    <tr key={game.id} className="hover:bg-[#2a1664]/20 transition-colors">
                      <td className="py-3 px-4 text-left whitespace-nowrap">
                        <span className="text-white font-medium">{game.game}</span>
                      </td>
                      <td className="py-3 px-4 text-left whitespace-nowrap">
                        <span className="text-gray-300">{game.opponent}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block py-1 px-3 rounded-full text-xs font-medium capitalize ${getResultClass(game.result)}`}>
                          {game.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={game.coins >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {game.coins >= 0 ? '+' : ''}{game.coins}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-gray-400 text-sm">{formatDate(game.date)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHistory; 