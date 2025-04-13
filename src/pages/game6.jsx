import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MineGame = () => {
  const [cells, setCells] = useState(Array(25).fill(null));
  const [bombIndex, setBombIndex] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
  const [score, setScore] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setBombIndex(Math.floor(Math.random() * 25));
  }, []);

  const handleCellClick = (index) => {
    if (gameEnded || cells[index]) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }

    const newCells = [...cells];
    if (index === bombIndex) {
      newCells[index] = 'bomb';
      setVideoSrc('assets/video/lose.mp4');
      setGameEnded(true);
    } else {
      newCells[index] = 'safe';
      setScore(score + 10);
      setRevealedCount(revealedCount + 1);
      const safeCount = newCells.filter(cell => cell === 'safe').length;
      if (safeCount === 24) {
        setVideoSrc('assets/video/win.mp4');
        setGameEnded(true);
      }
    }
    setCells(newCells);
  };

  const resetGame = () => {
    setCells(Array(25).fill(null));
    setBombIndex(Math.floor(Math.random() * 25));
    setGameEnded(false);
    setVideoSrc(null);
    setScore(0);
    setRevealedCount(0);
    setGameStarted(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // SVG Icons
  const SafeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-green-500">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  );

  const BombIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-red-500">
      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0c0124] to-[#1a0347] p-5 relative overflow-hidden">
      {/* Background particles effect */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {Array(20).fill(0).map((_, i) => (
          <div 
            key={i} 
            className="absolute w-2 h-2 bg-purple-500 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-5 right-5 px-5 py-2.5 bg-gradient-to-r from-red-700 to-orange-700 text-white rounded-lg font-bold transition-all duration-300 hover:from-red-600 hover:to-orange-600 hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] z-20"
      >
        Logout
      </button>

      <div className="z-10 relative">
        <h1 className="text-5xl font-bold text-white mb-2 text-center drop-shadow-[0_0_15px_rgba(99,32,221,0.7)]">
          Mine Game
        </h1>
        <p className="text-xl text-purple-300 mb-6 text-center">Find the safe cells and win 10x!</p>
        
        <div className="flex justify-between items-center mb-6 w-full max-w-[600px]">
          <div className="bg-[rgba(99,32,221,0.2)] p-3 rounded-lg border border-[#6320dd]">
            <p className="text-white text-lg">Score: <span className="font-bold text-purple-300">{score}</span></p>
          </div>
          <div className="bg-[rgba(99,32,221,0.2)] p-3 rounded-lg border border-[#6320dd]">
            <p className="text-white text-lg">Revealed: <span className="font-bold text-purple-300">{revealedCount}/24</span></p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 max-w-[600px] mx-auto my-5">
          {cells.map((cell, index) => (
            <div
              key={index}
              className={`w-24 h-24 border-2 border-[#6320dd] rounded-lg flex items-center justify-center cursor-pointer bg-[rgba(99,32,221,0.1)] transition-all duration-300 hover:scale-105 hover:bg-[rgba(99,32,221,0.2)] hover:shadow-[0_0_20px_rgba(99,32,221,0.7)] ${
                cell ? 'pointer-events-none' : ''
              } ${cell === 'safe' ? 'bg-[rgba(0,255,0,0.2)] border-green-500' : ''} ${cell === 'bomb' ? 'bg-[rgba(255,0,0,0.2)] border-red-500' : ''}`}
              onClick={() => handleCellClick(index)}
            >
              {cell === 'bomb' && (
                <div className="animate-bounce">
                  <BombIcon />
                </div>
              )}
              {cell === 'safe' && (
                <div className="animate-pulse">
                  <SafeIcon />
                </div>
              )}
            </div>
          ))}
        </div>

        {videoSrc && (
          <video
            src={videoSrc}
            autoPlay
            loop
            muted={false}
            className="fixed top-0 left-0 w-full h-full object-cover z-[-1] opacity-30"
          />
        )}

        {gameEnded && (
          <div className="mt-8 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {cells[bombIndex] === 'bomb' ? 'Game Over!' : 'You Won!'}
            </h2>
            <p className="text-xl text-purple-300 mb-6">Final Score: {score}</p>
            <div className="flex gap-4">
              <button
                className="px-8 py-3 bg-gradient-to-r from-[#6320dd] to-[#7a3dff] text-white rounded-lg hover:from-[#7a3dff] hover:to-[#6320dd] hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(99,32,221,0.5)] font-bold text-lg"
                onClick={resetGame}
              >
                Play Again
              </button>
              <button
                className="px-8 py-3 bg-gradient-to-r from-red-700 to-orange-700 text-white rounded-lg hover:from-red-600 hover:to-orange-600 hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] font-bold text-lg"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {!gameStarted && !gameEnded && (
          <div className="mt-8 text-center">
            <p className="text-xl text-purple-300">Click any cell to start the game!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MineGame;