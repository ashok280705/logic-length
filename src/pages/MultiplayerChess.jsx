import React from 'react';
import Navbar from '../components/navbar';
import MultiplayerChess from '../components/multiplayer/MultiplayerChess';
import { MultiplayerProvider } from '../components/multiplayer/MultiplayerContext';
import { useAuth } from '../config/AuthContext';

const MultiplayerChessPage = () => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0124] via-[#12002e] to-[#160041]">
      <Navbar onLogout={logout} user={userProfile} />
      
      <div className="pt-24 pb-8 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          MULTIPLAYER CHESS
        </h1>
        <p className="text-purple-300 mt-2">Challenge players from around the world!</p>
      </div>
      
      <MultiplayerProvider>
        <MultiplayerChess cost={20} />
      </MultiplayerProvider>
      
      <div className="relative mt-8 pt-4 pb-6 text-center text-purple-300/70 text-sm">
        <p>© 2024-2025 TEAM LOGICLENGTH. All rights reserved.</p>
      </div>
    </div>
  );
};

export default MultiplayerChessPage; 