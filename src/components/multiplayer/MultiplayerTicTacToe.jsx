import React, { useState, useEffect } from 'react';
import { useMultiplayer } from './MultiplayerContext';
import { useNavigate } from 'react-router-dom';

const MultiplayerTicTacToe = ({ cost, deductCoins, user }) => {
  const navigate = useNavigate();
  const {
    isConnected,
    connectionError,
    inMatchmaking,
    currentGame,
    gameState,
    opponent,
    isMyTurn,
    gameResult,
    gameMessages,
    joinMatchmaking,
    cancelMatchmaking,
    makeMove,
    leaveGame
  } = useMultiplayer();
  
  const [symbol, setSymbol] = useState(null); // 'X' or 'O'
  const [coinsDeducted, setCoinsDeducted] = useState(false);
  
  // Set the player's symbol when the game starts
  useEffect(() => {
    if (currentGame && gameState && !coinsDeducted) {
      // First player is typically X, second is O
      // This is a simple way to determine symbols based on turn order
      setSymbol(isMyTurn ? 'X' : 'O');
      
      // Deduct coins when match is found
      deductCoins();
      setCoinsDeducted(true);
    }
  }, [currentGame, gameState, isMyTurn, coinsDeducted, deductCoins]);

  // Function to start matchmaking
  const startMatchmaking = () => {
    joinMatchmaking('tictactoe');
  };
  
  // Reset coins deducted when leaving the game
  useEffect(() => {
    if (!currentGame) {
      setCoinsDeducted(false);
    }
  }, [currentGame]);
  
  // Handle board click
  const handleCellClick = (index) => {
    if (!isMyTurn || !gameState || gameState.board[index] || gameResult) {
      return;
    }
    
    makeMove({
      position: index,
      symbol: symbol
    });
  };
  
  // Render game board
  const renderBoard = () => {
    if (!gameState) return null;
    
    return (
      <div className="grid grid-cols-3 gap-2 w-80 h-80 mx-auto">
        {gameState.board.map((cell, index) => (
          <div
            key={index}
            onClick={() => handleCellClick(index)}
            className={`
              flex items-center justify-center text-5xl font-bold
              bg-[#170042]/40 border border-purple-500/30 rounded-lg
              cursor-pointer transition-all hover:bg-[#1a0050]/60
              ${!isMyTurn || cell || gameResult ? 'cursor-not-allowed' : 'hover:shadow-md'}
              ${gameResult?.winningLine?.includes(index) ? 'bg-green-500/30 border-green-500/50' : ''}
            `}
          >
            {cell === 'X' && <span className="text-blue-400">X</span>}
            {cell === 'O' && <span className="text-pink-400">O</span>}
          </div>
        ))}
      </div>
    );
  };
  
  // Render game messages
  const renderMessages = () => {
    return (
      <div className="mt-4 p-3 bg-[#170042]/30 border border-purple-500/20 rounded-lg max-h-40 overflow-y-auto">
        <h3 className="text-sm font-medium text-purple-300 mb-2">Game Log:</h3>
        <div className="space-y-1">
          {gameMessages.map((msg, index) => (
            <div 
              key={index} 
              className={`text-sm ${
                msg.type === 'error' ? 'text-red-400' :
                msg.type === 'warning' ? 'text-yellow-400' :
                msg.type === 'result' ? 'text-green-400 font-medium' :
                msg.type === 'chat' ? 'text-white' : 'text-purple-300'
              }`}
            >
              {msg.message}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render game status
  const renderGameStatus = () => {
    if (gameResult) {
      let statusText = '';
      let statusClass = '';
      
      if (gameResult.draw) {
        statusText = "It's a draw!";
        statusClass = 'text-yellow-400';
      } else if (gameResult.winByDefault) {
        statusText = "You win by default!";
        statusClass = 'text-green-400';
      } else if (gameResult.winner === symbol) {
        statusText = "You won!";
        statusClass = 'text-green-400';
      } else {
        statusText = "You lost!";
        statusClass = 'text-red-400';
      }
      
      return (
        <div className={`text-center text-xl font-bold ${statusClass} my-4`}>
          {statusText}
        </div>
      );
    }
    
    if (currentGame) {
      return (
        <div className="text-center my-4">
          <div className="text-lg font-medium text-purple-300">
            {isMyTurn ? "Your turn" : "Opponent's turn"}
          </div>
          <div className="text-sm text-white mt-1">
            You are <span className={symbol === 'X' ? 'text-blue-400 font-bold' : 'text-pink-400 font-bold'}>{symbol}</span>
            {opponent && (
              <span> playing against <span className="text-purple-300 font-medium">{opponent.username}</span></span>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen bg-[#0c0124] text-white pt-[9vh] pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="border-b border-[#2c0b7a]/30 pb-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Multiplayer Tic Tac Toe
            </h1>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <div className="px-3 py-1.5 bg-[#1a0050]/40 text-yellow-300 rounded-lg border border-purple-500/20">
                <span className="text-sm text-purple-300 mr-2">Cost:</span>
                <span className="font-bold">{cost}</span>
                <span className="text-xs text-purple-300 ml-1">COINS</span>
              </div>
              <button 
                onClick={() => navigate("/home")}
                className="px-4 py-2 text-sm bg-[#1a0050]/40 hover:bg-[#1a0050]/60 text-white rounded-lg border border-purple-500/20 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-[#1a0050]/40 to-[#09001a]/40 rounded-xl border border-purple-500/20 shadow-xl p-6">
          {/* Connection status */}
          {!isConnected && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-purple-300">
                {connectionError || "Connecting to multiplayer server..."}
              </p>
            </div>
          )}
          
          {/* Matchmaking */}
          {isConnected && !currentGame && !inMatchmaking && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-white mb-6">Play Tic Tac Toe Online</h2>
              <p className="text-purple-300 mb-8">Challenge other players in real-time multiplayer matches!</p>
              
              <button
                onClick={startMatchmaking}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 font-medium"
              >
                Find a Match
              </button>
            </div>
          )}
          
          {/* Searching for opponent */}
          {isConnected && inMatchmaking && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-white mb-2">Finding an opponent...</h2>
              <p className="text-purple-300 mb-6">This may take a few moments</p>
              
              <button
                onClick={cancelMatchmaking}
                className="px-4 py-2 bg-[#1a0050]/60 hover:bg-[#1a0050]/80 text-white rounded-lg transition-all border border-purple-500/30"
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Active game */}
          {currentGame && (
            <div>
              {/* Game status */}
              {renderGameStatus()}
              
              {/* Game board */}
              <div className="mt-6">
                {renderBoard()}
              </div>
              
              {/* Game messages */}
              {renderMessages()}
              
              {/* Game actions */}
              <div className="mt-6 flex justify-center">
                {gameResult ? (
                  <div className="space-x-4">
                    <button
                      onClick={() => startMatchmaking()}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={leaveGame}
                      className="px-5 py-2.5 bg-[#1a0050]/60 hover:bg-[#1a0050]/80 text-white rounded-lg transition-all border border-purple-500/30"
                    >
                      Quit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={leaveGame}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all border border-red-500/30"
                  >
                    Forfeit Game
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerTicTacToe; 