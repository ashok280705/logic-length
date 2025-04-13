import React, { useState, useEffect } from "react";
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

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

const ChessGame = ({ cost = 10, deductCoins = () => true, user, onLogout }) => {
  const [board, setBoard] = useState(initialBoard);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [isSinglePlayer, setIsSinglePlayer] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [userCoins, setUserCoins] = useState(user?.coins || 0);
  const COST_TO_PLAY = cost; // Use the cost from props
  const navigate = useNavigate();

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

  const handleGameOver = (winner) => {
    setGameOver(true);
    setWinner(winner);
    
    // Award coins based on game result
    // Note: This is kept as is, but ideally this should be handled at the App level
    // for consistency with how coins are managed across the application
    let coinsWon = 0;
    if (winner === "white") {
      coinsWon = 30; // Win bonus
    } else if (winner === "draw") {
      coinsWon = 10; // Draw bonus
    }
    
    if (coinsWon > 0) {
      const updatedCoins = userCoins + coinsWon;
      setUserCoins(updatedCoins);
      
      // Update user data in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.coins = updatedCoins;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      alert(`Game Over! You won ${coinsWon} coins!`);
    } else {
      alert('Game Over! Try again to win coins!');
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

  const signOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Navigate to home page
      navigate('/home');
    }
  };

  // Only check authentication, no wallet
  useEffect(() => {
    // Check for user authentication using both methods
    const userStr = localStorage.getItem('user');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!userStr && !currentUser) {
      alert('You are not logged in.');
      window.location.href = '/';
      return;
    }
    
    // If logged in with new system but currentUser not set, copy it
    if (userStr && !currentUser) {
      const user = JSON.parse(userStr);
      const email = user.email || user.username;
      localStorage.setItem('currentUser', email);
    }
    
    // Ensure user data is properly loaded
    if (userStr) {
      const user = JSON.parse(userStr);
      // If user doesn't have coins property, add it with default value
      if (user.coins === undefined) {
        user.coins = 0;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
  }, []);

  // Check if a move is valid according to chess rules
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
    
    // Basic movement rules for each piece type
    const pieceType = getPieceType(piece);
    const isWhite = piece.charCodeAt(0) < 9818;
    
    switch (pieceType) {
      case 'pawn':
        // Pawns move forward one square, or two on their first move
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
        // Knights move in L-shape: 2 squares in one direction and 1 in the other
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        
      case 'bishop':
        // Bishops move diagonally
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return !isPieceInPath(fromRow, fromCol, toRow, toCol);
        
      case 'rook':
        // Rooks move horizontally or vertically
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return !isPieceInPath(fromRow, fromCol, toRow, toCol);
        
      case 'queen':
        // Queens move horizontally, vertically, or diagonally
        if (fromRow !== toRow && fromCol !== toCol && Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return !isPieceInPath(fromRow, fromCol, toRow, toCol);
        
      case 'king':
        // Kings move one square in any direction
        return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
        
      default:
        return false;
    }
  };
  
  // Check if there's a piece blocking the path between from and to positions
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
  
  // Get the type of piece (pawn, knight, etc.)
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
  
  // Check if the king is in check
  const isKingInCheck = (boardState, isWhiteKing) => {
    // Find the king's position
    let kingRow, kingCol;
    const kingCode = isWhiteKing ? 9812 : 9818; // White king or black king
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (boardState[i][j].charCodeAt(0) === kingCode) {
          kingRow = i;
          kingCol = j;
          break;
        }
      }
      if (kingRow !== undefined) break;
    }
    
    // Check if any opponent piece can capture the king
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = boardState[i][j];
        if (!piece) continue;
        
        const isPieceWhite = piece.charCodeAt(0) < 9818;
        if (isPieceWhite === isWhiteKing) continue; // Skip friendly pieces
        
        if (isValidMove(i, j, kingRow, kingCol, piece)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Check if the game is over (checkmate or stalemate)
  const checkGameOver = (boardState, isWhiteTurn) => {
    // Check if the current player's king is in check
    const kingInCheck = isKingInCheck(boardState, isWhiteTurn);
    
    // Check if the current player has any legal moves
    const hasLegalMoves = hasAnyLegalMoves(boardState, isWhiteTurn);
    
    if (kingInCheck && !hasLegalMoves) {
      // Checkmate
      setGameOver(true);
      setWinner(isWhiteTurn ? "Black" : "White");
      return true;
    } else if (!kingInCheck && !hasLegalMoves) {
      // Stalemate
      setGameOver(true);
      setWinner("Draw");
      return true;
    }
    
    return false;
  };
  
  // Check if the current player has any legal moves
  const hasAnyLegalMoves = (boardState, isWhiteTurn) => {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = boardState[fromRow][fromCol];
        if (!piece) continue;
        
        const isPieceWhite = piece.charCodeAt(0) < 9818;
        if (isPieceWhite !== isWhiteTurn) continue; // Skip opponent's pieces
        
        // Try all possible moves
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(fromRow, fromCol, toRow, toCol, piece)) {
              // Make a temporary move to check if it puts/leaves the king in check
              const tempBoard = boardState.map(row => [...row]);
              tempBoard[toRow][toCol] = piece;
              tempBoard[fromRow][fromCol] = "";
              
              if (!isKingInCheck(tempBoard, isWhiteTurn)) {
                return true; // Found at least one legal move
              }
            }
          }
        }
      }
    }
    
    return false; // No legal moves found
  };

  const handleDragStart = (row, col) => {
    const piece = board[row][col];
    if (!piece) return;
    
    // Check if it's the player's turn
    const isWhitePiece = piece.charCodeAt(0) < 9818;
    if (isSinglePlayer && currentPlayer === "white" && !isWhitePiece) return;
    if (!isSinglePlayer) {
      if (currentPlayer === "white" && !isWhitePiece) return;
      if (currentPlayer === "black" && isWhitePiece) return;
    }
    
    setDraggedPiece(piece);
    setDraggedPosition([row, col]);
  };

  const handleDrop = (row, col) => {
    if (draggedPiece && draggedPosition) {
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
      
      // Make a temporary board to check if the move puts/leaves the king in check
      const tempBoard = board.map(r => [...r]);
      tempBoard[toRow][toCol] = draggedPiece;
      tempBoard[fromRow][fromCol] = "";
      
      const isWhiteTurn = currentPlayer === "white";
      if (isKingInCheck(tempBoard, isWhiteTurn)) {
        setDraggedPiece(null);
        setDraggedPosition(null);
        return;
      }
      
      // Record the move
      const move = {
        piece: draggedPiece,
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        captured: board[toRow][toCol] || null
      };
      
      // Update the board
      const newBoard = board.map(r => [...r]);
      newBoard[fromRow][fromCol] = "";
      newBoard[toRow][toCol] = draggedPiece;
      setBoard(newBoard);
      setDraggedPiece(null);
      setDraggedPosition(null);
      setCurrentPlayer("black");
      setMoveHistory([...moveHistory, move]);
      setGameStarted(true);
      
      // Check if the game is over
      if (!checkGameOver(newBoard, false)) {
        if (isSinglePlayer) {
          setTimeout(() => makeComputerMove(newBoard), 500);
        }
      }
    }
  };

  const makeComputerMove = (currentBoard) => {
    // Find all possible moves for black pieces
    let possibleMoves = [];
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = currentBoard[i][j];
        if (!piece) continue;
        
        // Only consider black pieces
        if (piece.charCodeAt(0) >= 9818) {
          // Try all possible destinations
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(i, j, toRow, toCol, piece)) {
                // Make a temporary move to check if it puts/leaves the king in check
                const tempBoard = currentBoard.map(r => [...r]);
                tempBoard[toRow][toCol] = piece;
                tempBoard[i][j] = "";
                
                if (!isKingInCheck(tempBoard, false)) {
                  // Calculate a simple score for this move
                  let score = 0;
                  
                  // Prefer capturing pieces
                  const capturedPiece = currentBoard[toRow][toCol];
                  if (capturedPiece) {
                    const pieceType = getPieceType(capturedPiece);
                    switch (pieceType) {
                      case 'pawn': score += 10; break;
                      case 'knight': score += 30; break;
                      case 'bishop': score += 30; break;
                      case 'rook': score += 50; break;
                      case 'queen': score += 90; break;
                      case 'king': score += 900; break;
                    }
                  }
                  
                  // Prefer controlling the center
                  if ((toRow === 3 || toRow === 4) && (toCol === 3 || toCol === 4)) {
                    score += 5;
                  }
                  
                  // Add some randomness
                  score += Math.random() * 10;
                  
                  possibleMoves.push({
                    from: [i, j],
                    to: [toRow, toCol],
                    score: score
                  });
                }
              }
            }
          }
        }
      }
    }
    
    if (possibleMoves.length > 0) {
      // Sort moves by score (highest first)
      possibleMoves.sort((a, b) => b.score - a.score);
      
      // Pick one of the top 3 moves (or fewer if there are less than 3)
      const moveIndex = Math.floor(Math.random() * Math.min(3, possibleMoves.length));
      const selectedMove = possibleMoves[moveIndex];
      
      const { from, to } = selectedMove;
      const newBoard = currentBoard.map(r => [...r]);
      const movingPiece = newBoard[from[0]][from[1]];
      
      // Record the computer move
      const move = {
        piece: movingPiece,
        from: from,
        to: to,
        captured: newBoard[to[0]][to[1]] || null
      };
      
      newBoard[from[0]][from[1]] = "";
      newBoard[to[0]][to[1]] = movingPiece;
      setBoard(newBoard);
      setMoveHistory([...moveHistory, move]);
      
      // Check if the game is over
      if (!checkGameOver(newBoard, true)) {
        setCurrentPlayer("white");
      }
    } else {
      // No legal moves for black, which means checkmate or stalemate
      checkGameOver(currentBoard, false);
    }
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setCurrentPlayer("white");
    setMoveHistory([]);
    setGameStarted(false);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0124] via-[#12002e] to-[#160041] overflow-hidden">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar onLogout={onLogout || signOut} user={getUserData()} />
      </div>

      {/* Game container with pixel pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#8b5cf6_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Game title */}
      <div className="pt-24 pb-4 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
          CHESS MASTER
        </h1>
        <p className="text-purple-300 mt-2 animate-pulse">Test your strategy against the computer!</p>
      </div>

      {!gameStarted ? (
        // Pre-game startup screen with coin information
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="glass-effect p-8 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] max-w-2xl w-full">
            <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Ready to Play Chess?
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
              <p>Challenge the computer in this classic game of strategy!</p>
              <p className="mt-2">You control the white pieces. Can you outsmart your opponent?</p>
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
        // Main game interface once started
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Game Controls */}
              <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <h2 className="text-xl font-bold text-purple-300 mb-4">Game Controls</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">Game Mode:</span>
                    <div className="relative inline-block w-16 h-8 rounded-full bg-purple-900/50">
                      <button
                        onClick={() => setIsSinglePlayer(!isSinglePlayer)}
                        className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ${
                          isSinglePlayer ? 'bg-purple-500 translate-x-8' : 'bg-pink-500'
                        }`}
                      ></button>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-purple-300">{isSinglePlayer ? "Single Player" : "Multiplayer"}</span>
                  </div>
                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={resetGame}
                      className="w-full py-3 bg-gradient-to-r from-purple-700 to-pink-700 text-white rounded-lg text-lg font-bold transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                    >
                      Reset Game
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Player */}
              <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <h2 className="text-xl font-bold text-purple-300 mb-2">Current Turn</h2>
                <div className={`text-2xl font-bold ${currentPlayer === "white" ? "text-white" : "text-gray-300"}`}>
                  {gameOver ? (winner === "Draw" ? "Game Draw!" : `${winner} Wins!`) : (currentPlayer === "white" ? "White" : "Black")}
                </div>
              </div>

              {/* Move History */}
              <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <h2 className="text-xl font-bold text-purple-300 mb-2">Move History</h2>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {moveHistory.length === 0 ? (
                    <p className="text-purple-300/70 text-center">No moves yet</p>
                  ) : (
                    moveHistory.map((move, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-purple-900/30 rounded-lg">
                        <span className="text-white">{move.piece}</span>
                        <span className="text-purple-300">
                          {String.fromCharCode(97 + move.from[1])}{8 - move.from[0]} → {String.fromCharCode(97 + move.to[1])}{8 - move.to[0]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Chess Board */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <div className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <div className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden">
                  {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-16 h-16 flex items-center justify-center ${
                          (rowIndex + colIndex) % 2 === 0 ? "bg-[#1b1039]" : "bg-[#321b5f]"
                        } text-white text-4xl cursor-${piece ? "grab" : "default"} transition-all duration-300 hover:bg-purple-700/30`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(rowIndex, colIndex)}
                      >
                        {piece && (
                          <span
                            draggable
                            onDragStart={() => handleDragStart(rowIndex, colIndex)}
                            className={`select-none transition-transform duration-300 hover:scale-110 ${
                              piece.charCodeAt(0) >= 9818 ? "text-gray-300" : "text-white"
                            }`}
                          >
                            {piece}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Game Instructions */}
              <div className="mt-6 glass-effect p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] text-center w-full">
                <h2 className="text-xl font-bold text-purple-300 mb-2">How to Play</h2>
                <p className="text-purple-300/90">
                  Drag and drop pieces to move them. In single player mode, you control the white pieces.
                  {gameOver && ` Game Over! ${winner === "Draw" ? "It's a draw!" : `${winner} wins!`}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="game-info">
        <div className="coins">Coins: {userCoins}</div>
      </div>

      {/* Footer */}
      <div className="relative mt-8 pt-4 pb-6 text-center text-purple-300/70 text-sm">
        <p>© 2024-2025 TEAM LOGICLENGTH. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ChessGame;
