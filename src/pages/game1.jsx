import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/navbar.jsx';
import { logoutUser } from "../services/authService";

const PlayerForm = ({ onStart, coinCost }) => {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name1 && name2) {
      onStart(name1, name2);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Enter Player Names</h2>
      
      {/* Coin requirement card */}
      <div className="w-full max-w-md mb-6 p-4 rounded-xl bg-[#1a1039]/90 border-2 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">Game Cost:</span>
          <div className="flex items-center">
            <span className="text-yellow-300 font-bold text-2xl mr-1">{coinCost}</span>
            <span className="text-xs text-purple-300">COINS</span>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">Coins will be deducted when the game starts</p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Player 1 Name"
            className="w-full p-4 border-2 border-purple-500/30 bg-[#1a1039]/80 text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            value={name1}
            onChange={(e) => setName1(e.target.value)}
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Player 2 Name"
            className="w-full p-4 border-2 border-purple-500/30 bg-[#1a1039]/80 text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            value={name2}
            onChange={(e) => setName2(e.target.value)}
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/20 to-red-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
        <button className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-lg font-bold cursor-pointer hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.5)] transform hover:scale-105">
          Start Game
        </button>
      </form>
    </div>
  );
};

const GameBoard = ({ players, onReset }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(players[0]);
  const [winner, setWinner] = useState(null);

  const checkWinner = (board) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return board.includes(null) ? null : "Tie";
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = currentPlayer.symbol;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
    } else {
      setCurrentPlayer(currentPlayer === players[0] ? players[1] : players[0]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-8">
        {winner ? (winner === "Tie" ? "It's a Tie!" : `${winner} Wins!`) : `${currentPlayer.name}'s Turn`}
      </h2>
      <div className="grid grid-cols-3 gap-4 mt-6 bg-[#1a1039]/80 p-6 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
        {board.map((cell, index) => (
          <div
            key={index}
            className="w-24 h-24 flex items-center justify-center text-4xl font-bold bg-[#2a1b5f] text-white rounded-xl shadow-md cursor-pointer hover:bg-[#3a2b7f] transition-all duration-300 transform hover:scale-105 border border-purple-500/30"
            onClick={() => handleClick(index)}
          >
            {cell && (
              <span className={cell === "X" ? "text-purple-400" : "text-pink-400"}>
                {cell}
              </span>
            )}
          </div>
        ))}
      </div>
      {winner && (
        <button
          className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-lg font-bold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.5)] transform hover:scale-105"
          onClick={onReset}
        >
          Play Again
        </button>
      )}
    </div>
  );
};

export default function TicTacToe({ cost = 5, deductCoins = () => true, user, onLogout }) {
  const [players, setPlayers] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();

  // Get user data from localStorage or from props
  const getUserData = () => {
    if (user) return user;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return { name: "Player", coins: 0 };
  };

  const handleStartGame = (name1, name2) => {
    // Deduct coins when starting the game
    const success = deductCoins();
    
    if (success) {
      setPlayers([{ name: name1, symbol: "X" }, { name: name2, symbol: "O" }]);
      setGameStarted(true);
    } else {
      alert("Not enough coins to play this game! Please add more coins.");
      navigate('/payment');
    }
  };

  const signOut = async () => {
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0c0124] via-[#12002e] to-[#160041] text-white overflow-hidden">
      {/* Navbar */}
      <Navbar onLogout={onLogout || signOut} user={getUserData()} />
      
      {/* Game container with pixel pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#8b5cf6_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Game title */}
      <div className="pt-24 pb-4 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
          TIC-TAC-TOE
        </h1>
        <p className="text-purple-300 mt-2 animate-pulse">Challenge your friends in this classic game!</p>
      </div>

      <main className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="glass-effect p-8 rounded-2xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] max-w-2xl w-full">
          {!players ? (
            <PlayerForm onStart={handleStartGame} coinCost={cost} />
          ) : (
            <GameBoard players={players} onReset={() => setPlayers(null)} />
          )}
        </div>
      </main>
      
      <footer className="relative mt-8 pt-4 pb-6 text-center text-purple-300/70 text-sm">
        <p>© 2024-2025 TEAM LOGICLENGTH. All rights reserved.</p>
      </footer>
    </div>
  );
}
