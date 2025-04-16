import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayer } from './MultiplayerContext';

const pieces = {
  Pawn: "♙", Knight: "♘", Bishop: "♗", Rook: "♖", Queen: "♕", King: "♔",
  pawn: "♟", knight: "♞", bishop: "♝", rook: "♜", queen: "♛", king: "♚"
};

const initialBoard = [
  [pieces.rook, pieces.knight, pieces.bishop, pieces.queen, pieces.king, pieces.bishop, pieces.knight, pieces.rook],
  [pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  [pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn],
  [pieces.Rook, pieces.Knight, pieces.Bishop, pieces.Queen, pieces.King, pieces.Bishop, pieces.Knight, pieces.Rook]
];

const MultiplayerChess = ({ cost = 20 }) => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(initialBoard);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [playerColor, setPlayerColor] = useState(null); // 'white' or 'black'
  const [userCoins, setUserCoins] = useState(0);
  const [coinsDeducted, setCoinsDeducted] = useState(false);
  const GAME_COST = cost;

  // Get the multiplayer context
  const {
    socket,
    isConnected,
    connectionError,
    currentGame,
    gameState,
    isMyTurn,
    gameResult,
    gameMessages,
    joinMatchmaking,
    cancelMatchmaking,
    makeMove,
    leaveGame,
    inMatchmaking
  } = useMultiplayer();

  // Get latest user data from localStorage
  const getLatestUserData = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUserCoins(userData.coins || 0);
        return userData;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  }, []);

  // Initialize user data
  useEffect(() => {
    getLatestUserData();
  }, [getLatestUserData]);

  // Listen for storage changes to keep coins in sync
  useEffect(() => {
    const handleStorageChange = () => {
      getLatestUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('coinBalanceUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('coinBalanceUpdated', handleStorageChange);
    };
  }, [getLatestUserData]);

  // Update the board when gameState changes
  useEffect(() => {
    if (gameState && gameState.board) {
      setBoard(gameState.board);
      setMoveHistory(gameState.moveHistory || []);
    }
  }, [gameState]);

  // Set player color when game starts
  useEffect(() => {
    if (currentGame) {
      const newPlayerColor = currentGame.playerIndex === 0 ? 'white' : 'black';
      setPlayerColor(newPlayerColor);
      console.log(`You are playing as ${newPlayerColor}`);
    }
  }, [currentGame]);

  // Handle user coin deduction when a match is found
  useEffect(() => {
    if (currentGame && !coinsDeducted) {
      // Get the latest user data to ensure we have the most current coin balance
      const userData = getLatestUserData();
      
      if (userData && userData.coins < GAME_COST) {
        alert(`You don't have enough coins to play. Need ${GAME_COST} coins.`);
        leaveGame();
        navigate('/payment');
        return;
      }

      // Deduct coins
      if (userData) {
        const newBalance = userData.coins - GAME_COST;
        userData.coins = newBalance;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent('coinBalanceUpdated', { 
            detail: { 
              balance: newBalance,
              userData: userData
            } 
          })
        );
        
        setUserCoins(newBalance);
        setCoinsDeducted(true);
      }
    }
  }, [currentGame, coinsDeducted, GAME_COST, getLatestUserData, leaveGame, navigate]);

  // Reset coinsDeducted when game ends
  useEffect(() => {
    if (!currentGame) {
      setCoinsDeducted(false);
    }
  }, [currentGame]);

  // Handle game rewards when game ends
  useEffect(() => {
    if (gameResult && gameResult.gameOver) {
      // Get latest user data
      const userData = getLatestUserData();
      if (!userData) return;

      let reward = 0;
      const playerWon = 
        (gameResult.winner === 'white' && playerColor === 'white') || 
        (gameResult.winner === 'black' && playerColor === 'black');
      
      if (playerWon) {
        reward = Math.floor(GAME_COST * 1.5); // 50% profit for winning
        alert(`Congratulations! You won ${reward} coins!`);
      } else if (gameResult.draw) {
        reward = Math.floor(GAME_COST * 0.5); // Get half back for a draw
        alert(`Game drawn! You got back ${reward} coins.`);
      }
      
      if (reward > 0) {
        // Update user coins
        const newBalance = userData.coins + reward;
        userData.coins = newBalance;
        
        // Add transaction record
        if (!userData.transactions) userData.transactions = [];
        userData.transactions.push({
          type: 'reward',
          amount: reward,
          game: 'chess',
          timestamp: new Date().toISOString(),
          details: playerWon ? 'Game won' : 'Game drawn'
        });
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Notify other components
        window.dispatchEvent(
          new CustomEvent('coinBalanceUpdated', { 
            detail: { 
              balance: newBalance,
              userData: userData
            } 
          })
        );
        
        setUserCoins(newBalance);
      }
    }
  }, [gameResult, playerColor, GAME_COST, getLatestUserData]);

  // Check if a move is valid
  const isValidMove = (fromRow, fromCol, toRow, toCol, piece) => {
    // Can't move to the same position
    if (fromRow === toRow && fromCol === toCol) return false;
    
    // Can't capture your own piece
    const targetPiece = board[toRow][toCol];
    if (targetPiece) {
      const isWhitePiece = piece.charCodeAt(0) < 9818;
      const isTargetWhitePiece = targetPiece.charCodeAt(0) < 9818;
      if (isWhitePiece === isTargetWhitePiece) return false;
    }
    
    // Basic movement rules
    const pieceType = getPieceType(piece);
    const isWhite = piece.charCodeAt(0) < 9818;
    
    switch (pieceType) {
      case 'pawn':
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        // Forward move
        if (fromCol === toCol && !targetPiece) {
          if (toRow === fromRow + direction) return true;
          if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[fromRow + direction][fromCol]) return true;
        }
        
        // Capture diagonally
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && targetPiece) return true;
        
        return false;
        
      case 'knight':
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        
      case 'bishop':
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return !isPieceInPath(fromRow, fromCol, toRow, toCol);
        
      case 'rook':
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return !isPieceInPath(fromRow, fromCol, toRow, toCol);
        
      case 'queen':
        if (fromRow !== toRow && fromCol !== toCol && Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return !isPieceInPath(fromRow, fromCol, toRow, toCol);
        
      case 'king':
        return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
        
      default:
        return false;
    }
  };
  
  // Check if path is blocked
  const isPieceInPath = (fromRow, fromCol, toRow, toCol) => {
    const rowDir = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colDir = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let currentRow = fromRow + rowDir;
    let currentCol = fromCol + colDir;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return true;
      currentRow += rowDir;
      currentCol += colDir;
    }
    
    return false;
  };
  
  // Get piece type
  const getPieceType = (piece) => {
    const code = piece.charCodeAt(0);
    if (code === 9817 || code === 9823) return 'pawn';
    if (code === 9816 || code === 9822) return 'knight';
    if (code === 9815 || code === 9821) return 'bishop';
    if (code === 9814 || code === 9820) return 'rook';
    if (code === 9813 || code === 9819) return 'queen';
    if (code === 9812 || code === 9818) return 'king';
    return '';
  };

  const handleDragStart = (row, col) => {
    if (!isMyTurn) return; // Can only move during your turn
    
    const piece = board[row][col];
    if (!piece) return;
    
    // Check if piece color matches player color
    const isWhitePiece = piece.charCodeAt(0) < 9818;
    if ((playerColor === 'white' && !isWhitePiece) || (playerColor === 'black' && isWhitePiece)) {
      return; // Can't move opponent's pieces
    }
    
    setDraggedPiece(piece);
    setDraggedPosition([row, col]);
  };

  const handleDrop = (row, col) => {
    if (!draggedPiece || !draggedPosition || !isMyTurn) {
      setDraggedPiece(null);
      setDraggedPosition(null);
      return;
    }
    
    const fromRow = draggedPosition[0];
    const fromCol = draggedPosition[1];
    const toRow = row;
    const toCol = col;
    
    // Check if the move is valid
    if (!isValidMove(fromRow, fromCol, toRow, toCol, draggedPiece)) {
      setDraggedPiece(null);
      setDraggedPosition(null);
      return;
    }
    
    // Send move to server
    const moveData = {
      piece: draggedPiece,
      from: [fromRow, fromCol],
      to: [toRow, toCol],
      captured: board[toRow][toCol] || null
    };
    
    const result = makeMove(moveData);
    
    setDraggedPiece(null);
    setDraggedPosition(null);
    
    if (result) {
      // Preview the move locally (will be overwritten by server update)
      const newBoard = [...board.map(row => [...row])];
      newBoard[toRow][toCol] = draggedPiece;
      newBoard[fromRow][fromCol] = "";
      setBoard(newBoard);
    }
  };

  const startMatchmaking = () => {
    // Check if user has enough coins
    const userData = getLatestUserData();
    if (!userData || userData.coins < GAME_COST) {
      alert(`Not enough coins! You need ${GAME_COST} coins to play.`);
      navigate('/payment');
      return;
    }
    
    joinMatchmaking('chess');
  };

  // Render the chess board
  const renderBoard = () => {
    // If player is black, flip the board
    const displayBoard = playerColor === 'black' ? [...board].reverse().map(row => [...row].reverse()) : board;
    
    return (
      <div className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden">
        {displayBoard.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            // Calculate actual board positions based on player color
            const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
            const actualCol = playerColor === 'black' ? 7 - colIndex : colIndex;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center ${
                  (rowIndex + colIndex) % 2 === 0 ? "bg-[#1b1039]" : "bg-[#321b5f]"
                } text-white text-3xl md:text-4xl cursor-${piece ? "grab" : "default"} transition-all duration-300 hover:bg-purple-700/30`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(actualRow, actualCol)}
              >
                {piece && (
                  <span
                    draggable
                    onDragStart={() => handleDragStart(actualRow, actualCol)}
                    className={`select-none transition-transform duration-300 hover:scale-110 ${
                      piece.charCodeAt(0) >= 9818 ? "text-gray-300" : "text-white"
                    }`}
                  >
                    {piece}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Render game UI based on state
  const renderGameUI = () => {
    if (connectionError) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-red-500 text-center mb-4">
            <p className="text-xl font-bold">Connection Error</p>
            <p className="text-sm">{connectionError}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
          >
            Reload Page
          </button>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className="text-center p-8">
          <div className="inline-block p-4 rounded-full bg-purple-900/50 animate-pulse mb-4">
            <svg className="w-10 h-10 text-purple-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
            </svg>
          </div>
          <p className="text-purple-300 mb-2">Connecting to multiplayer server...</p>
          <p className="text-xs text-purple-400">This may take a few moments</p>
        </div>
      );
    }

    if (inMatchmaking) {
      return (
        <div className="text-center p-8">
          <div className="inline-block p-4 rounded-full bg-purple-900/50 animate-pulse mb-4">
            <svg className="w-10 h-10 text-purple-400 animate-spin" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <p className="text-purple-300 mb-4">Searching for an opponent...</p>
          <button 
            onClick={cancelMatchmaking}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (!currentGame) {
      return (
        <div className="flex flex-col items-center p-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Multiplayer Chess
          </h2>
          
          <div className="w-full max-w-md mx-auto mb-6 p-4 rounded-xl bg-[#1a1039]/90 border-2 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Game Cost:</span>
              <div className="flex items-center">
                <span className="text-yellow-300 font-bold text-2xl mr-1">{GAME_COST}</span>
                <span className="text-xs text-purple-300">COINS</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">Coins will be deducted when you find a match</p>
          </div>
          
          <p className="text-purple-300 text-center mb-6">
            Challenge other players to a game of chess! 
            <br />Win to earn 1.5x your bet, draw to get 0.5x back.
          </p>
          
          <button 
            onClick={startMatchmaking}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-lg font-bold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.5)] transform hover:scale-105"
          >
            Find Opponent
          </button>
        </div>
      );
    }

    // Game in progress
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Game board */}
        <div className="lg:col-span-3 flex flex-col items-center">
          <div className="glass-effect p-4 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            {renderBoard()}
          </div>
          
          {/* Turn indicator */}
          <div className="mt-4 w-full max-w-md text-center">
            <div className={`text-xl font-bold ${isMyTurn ? "text-green-400" : "text-gray-400"}`}>
              {gameResult?.gameOver ? 
                (gameResult.draw ? "Game Draw!" : `${gameResult.winner === playerColor ? "You Won!" : "You Lost!"}`) : 
                (isMyTurn ? "Your Turn" : "Opponent's Turn")}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Game info */}
          <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Game Info</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-purple-300">Your Color:</span>
                <span className="text-white font-bold">{playerColor === 'white' ? "White" : "Black"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Coins:</span>
                <span className="text-yellow-300 font-bold">{userCoins}</span>
              </div>
              {gameResult?.gameOver && (
                <div className="mt-4 pt-4 border-t border-purple-500/30">
                  <div className="text-center font-bold text-xl text-purple-300">
                    Game Over!
                  </div>
                  <div className="text-center text-white mt-2">
                    {gameResult.draw ? "Game Draw!" : `${gameResult.winner} wins!`}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Game messages */}
          <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <h2 className="text-xl font-bold text-purple-300 mb-2">Game Log</h2>
            <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
              {gameMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded ${
                    msg.type === 'error' ? 'bg-red-900/30 text-red-300' :
                    msg.type === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
                    msg.type === 'result' ? 'bg-green-900/30 text-green-300' :
                    'bg-purple-900/30 text-purple-300'
                  }`}
                >
                  {msg.message}
                </div>
              ))}
              {moveHistory.map((move, idx) => (
                <div key={`move-${idx}`} className="bg-purple-900/30 p-2 rounded text-white">
                  {`Move ${idx + 1}: ${move.piece} from ${String.fromCharCode(97 + move.from[1])}${8 - move.from[0]} to ${String.fromCharCode(97 + move.to[1])}${8 - move.to[0]}`}
                  {move.captured && ` (captured ${move.captured})`}
                </div>
              ))}
            </div>
          </div>
          
          {/* Controls */}
          <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <button 
              onClick={leaveGame} 
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderGameUI()}
    </div>
  );
};

export default MultiplayerChess; 