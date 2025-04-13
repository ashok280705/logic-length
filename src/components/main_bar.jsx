import React, { useState, useEffect } from 'react'
import Sidebar from './sidebar'
import Cards1 from './cards1'    
import Cards2 from './cards2'
import Footer from './footer'
import BigCard from './big_cards'
import Payment from './Payment'

const MainBar = ({ gameCosts = {}, initialZone = 'coin', onZoneChange }) => {
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState('online');
  const [userData, setUserData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [zoneMode, setZoneMode] = useState(initialZone); // Start with passed initialZone
  const [formData, setFormData] = useState({
    username: '',
    coins: 0,
    level: 1,
    xp: 30
  });
  
  // Sync with parent component's zone state
  useEffect(() => {
    setZoneMode(initialZone);
    // Log current zone mode for debugging
    console.log('Main bar zone mode updated:', initialZone);
  }, [initialZone]);
  
  // Handle zone change from sidebar
  const handleZoneChange = (zone) => {
    console.log('Zone change requested:', zone);
    
    // Only update if zone actually changed
    if (zone !== zoneMode) {
      setZoneMode(zone);
      
      // Save to localStorage
      localStorage.setItem('activeZone', zone);
      
      // Force UI to update by creating a custom event
      window.dispatchEvent(new CustomEvent('zoneChange', { detail: { zone } }));
      
      // Notify parent component
      if (onZoneChange) {
        onZoneChange(zone);
      }
      
      // Close payment modal if open (to ensure it reopens with new zone)
      if (showPaymentModal) {
        setShowPaymentModal(false);
      }
    }
  };
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUserData(parsedUser);
      setFormData(parsedUser);
    } else {
      // Default user data if none exists
      const defaultUser = {
        username: 'Anuj Mayekar',
        coins: 100,
        level: 1,
        xp: 30
      };
      setUserData(defaultUser);
      setFormData(defaultUser);
    }
    
    return () => clearTimeout(timer);
  }, []);
  
  // Random statuses for demo
  useEffect(() => {
    const statuses = ['online', 'playing', 'idle', 'online'];
    let index = 0;
    
    const statusInterval = setInterval(() => {
      setUserStatus(statuses[index]);
      index = (index + 1) % statuses.length;
    }, 10000);
    
    return () => clearInterval(statusInterval);
  }, []);
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'playing': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convert numeric fields to numbers
    if (name === 'coins' || name === 'level' || name === 'xp') {
      parsedValue = parseInt(value) || 0;
      
      // Limit XP to 0-100
      if (name === 'xp' && parsedValue > 100) parsedValue = 100;
      if (name === 'xp' && parsedValue < 0) parsedValue = 0;
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };
  
  // Save profile changes
  const saveProfile = () => {
    localStorage.setItem('user', JSON.stringify(formData));
    setUserData(formData);
    setShowEditModal(false);
    
    // Show success notification (optional)
    const notification = document.createElement('div');
    notification.className = 'fixed top-5 right-5 bg-green-500 text-white p-3 rounded-lg shadow-lg animate-fade-in-out z-50';
    notification.textContent = 'Profile updated successfully!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };
  
  // Function to handle opening payment modal
  const handleOpenPayment = () => {
    // Ensure latest zone mode is loaded from localStorage
    const currentZone = localStorage.getItem('activeZone') || zoneMode;
    if (currentZone !== zoneMode) {
      setZoneMode(currentZone);
    }
    
    // Now open the payment modal
    setShowPaymentModal(true);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#06013a] flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin absolute top-4 left-4"></div>
          <div className="absolute top-10 left-10 text-white text-xl font-bold animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container flex w-full relative">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-purple-500/20 animate-float-slow"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>
      
      <div className="menu-section shrink-0 h-screen sticky top-0 z-20">
        <Sidebar 
          initialZone={zoneMode} 
          onZoneChange={handleZoneChange} 
          onOpenPayment={handleOpenPayment} 
        />
      </div>
      
      <div className="content-section flex-1 bg-[#06013a] grid grid-rows-[auto_1fr_auto] min-h-screen pl-4 relative z-10">
        <div className="grid1_col flex items-center justify-evenly bg-gradient-to-r from-[#0b001f] via-[#12002e] to-[#160041] p-6 rounded-bl-3xl relative overflow-hidden">
          {/* Animated background patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] bg-repeat animate-pulse"></div>
          </div>
          
          {/* Enhanced dynamic user profile card */}
          <div className="max-w-[350px] w-full rounded-xl bg-gradient-to-t from-[#0a0119] to-[#170045] border-[3px] border-[#2c0b7a] shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-500 transform hover:-translate-y-1 grid grid-rows-[1fr_2fr] overflow-hidden group">
            <div className="row-1 flex items-center justify-between px-5 py-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
                  {userData?.username ? userData.username.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <p className="text-white text-xl font-semibold gradient-text">
                    {userData?.username || "Anuj Mayekar"}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${getStatusColor(userStatus)} animate-pulse`}></span>
                    <span className="text-xs text-gray-300 capitalize">{userStatus}</span>
                  </div>
                </div>
              </div>
              <img src="star.svg" alt="star" className="h-8 w-8 hover:scale-125 transition-transform duration-300 animate-float" />
            </div>
            <div className="row-2 p-4 bg-[#0d0028]/80 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-yellow-300 font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span>{userData?.coins || 0}</span>
                  <span className="text-xs text-gray-300 ml-1">COINS</span>
                </div>
                <div className="text-purple-300 text-sm">
                  Level {userData?.level || 1}
                </div>
              </div>
              <div className="w-full bg-[#2c0b7a]/30 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full" style={{ width: `${userData?.xp || 30}%` }}></div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="flex-1 py-1.5 bg-gradient-to-r from-[#4e1ebb] to-[#8b5cf6] rounded-lg text-white text-sm font-medium transition-all duration-300 hover:shadow-[0_0_10px_rgba(139,92,246,0.5)] group-hover:from-[#6320dd] group-hover:to-[#a78bfa]"
                >
                  Edit Profile
                </button>
                
                {/* Show top-up button only in Prime Zone */}
                {zoneMode === 'prime' && (
                  <button 
                    onClick={handleOpenPayment}
                    className="flex-1 py-1.5 bg-gradient-to-r from-[#b72e1e] to-[#f65c5c] rounded-lg text-white text-sm font-medium transition-all duration-300 hover:shadow-[0_0_10px_rgba(246,92,92,0.5)]"
                  >
                    Top Up
                  </button>
                )}
              </div>
            </div>
            
            {/* Animated border effect */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/50 rounded-xl pointer-events-none transition-all duration-500"></div>
          </div>
          
          {/* Enhanced category cards with proper spacing and responsive sizing */}
          <div className="flex gap-8 justify-center flex-1">
            <div className="transform hover:scale-105 transition-all duration-300 relative group max-w-[300px] w-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative z-20">
                <Cards1 
                  image="multiplayer.webp" 
                  title="MULTIPLAYER" 
                  games={[
                    { name: "Chess", path: "/chess", cost: 10 },
                    { name: "Tic Tac Toe", path: "/tictactoe", cost: 5 },
                    { name: "Rock Paper Scissors", path: "/mines-plinko", cost: 15 }
                  ]}
                />
              </div>
            </div>
            
            <div className="transform hover:scale-105 transition-all duration-300 relative group max-w-[300px] w-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative z-20">
                <Cards1 
                  image="single.webp" 
                  title="SINGLE PLAYER" 
                  games={[
                    { name: "Snake & Ladder", path: "/snakes", cost: 5 },
                    { name: "Snail Race", path: "/snail-race", cost: 10 },
                    { name: "Dice", path: "/game6", cost: 10 }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid2_col bg-gradient-to-r from-[#0c0021] via-[#0e0129] to-[#06013a] p-6 relative">
          {/* Enhanced subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle,_#8b5cf6_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
          </div>

          {/* Improved game cost display with animation */}
          <div className="mb-8 px-6 py-4 bg-gradient-to-r from-[#190040] to-[#120033] rounded-2xl border-2 border-[#2c0b7a]/30 shadow-lg relative z-10 hover:shadow-[0_5px_20px_rgba(107,33,168,0.3)] transition-all duration-500">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
              Game Coin Requirements
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(gameCosts).map(([game, cost]) => (
                <div 
                  key={game} 
                  className="bg-[#1a0050]/40 p-3 rounded-xl border border-purple-500/30 hover:border-purple-500/70 transition-all duration-300 shadow-md hover:shadow-[0_4px_15px_rgba(139,92,246,0.3)] transform hover:scale-105 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white font-medium capitalize text-lg group-hover:text-purple-300 transition-colors duration-300">
                      {game.replace('-', ' ')}
                    </div>
                    <div className="flex items-center">
                      <span className="text-yellow-300 font-bold text-xl mr-1 group-hover:scale-110 transition-transform duration-300">{cost}</span>
                      <span className="text-xs text-purple-300">COINS</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
         
          {/* Game cards section */}
          <div className="relative z-10">
            <BigCard title="TRENDING"/>
            <BigCard title="PLAYING"/>
            <BigCard title="GAMES"/> 
          </div>
        </div>
        
        <div className='row3'>
          <Footer />
        </div>
      </div>
      
      {/* Zone indicator banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 py-2 z-30 text-center text-white text-sm 
          ${zoneMode === 'prime' 
            ? 'bg-gradient-to-r from-purple-600/70 to-blue-600/70' 
            : 'bg-gradient-to-r from-green-600/70 to-teal-600/70'
          } backdrop-blur-sm`}
      >
        <strong>{zoneMode === 'prime' 
          ? "Prime Zone: Top up coins to play premium games" 
          : "Coin Zone: Add coins directly to play games"}</strong>
        <button 
          onClick={() => handleZoneChange(zoneMode === 'prime' ? 'coin' : 'prime')}
          className="ml-3 px-2 py-0.5 rounded-full bg-white/20 text-xs hover:bg-white/30 transition-colors"
        >
          Switch Zone
        </button>
      </div>
      
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div 
            className="relative bg-gradient-to-b from-[#1a0045] to-[#0d0028] w-full max-w-md p-6 rounded-xl border-2 border-purple-500/30 shadow-[0_0_25px_rgba(139,92,246,0.3)] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -inset-px bg-gradient-to-r from-purple-600/20 via-transparent to-blue-600/20 rounded-xl blur-sm"></div>
            <div className="relative">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Edit Your Profile
                </h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-purple-300 block mb-1 text-sm">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full bg-[#0a0124] border border-purple-500/30 rounded-lg py-2 px-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                    placeholder="Enter your username"
                  />
                </div>
                
                <div>
                  <label className="text-purple-300 block mb-1 text-sm">Coins</label>
                  <input
                    type="number"
                    name="coins"
                    value={formData.coins}
                    onChange={handleInputChange}
                    className="w-full bg-[#0a0124] border border-purple-500/30 rounded-lg py-2 px-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all opacity-70 cursor-not-allowed"
                    placeholder="Enter your coins"
                    disabled
                  />
                  <p className="text-xs text-purple-300/70 mt-1">Coins cannot be edited directly</p>
                </div>
                
                <div>
                  <label className="text-purple-300 block mb-1 text-sm">Level</label>
                  <input
                    type="number"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full bg-[#0a0124] border border-purple-500/30 rounded-lg py-2 px-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all opacity-70 cursor-not-allowed"
                    min="1"
                    placeholder="Enter your level"
                    disabled
                  />
                  <p className="text-xs text-purple-300/70 mt-1">Level cannot be edited directly</p>
                </div>
                
                <div>
                  <label className="text-purple-300 block mb-1 text-sm">XP Progress (0-100%)</label>
                  <input
                    type="range"
                    name="xp"
                    value={formData.xp}
                    onChange={handleInputChange}
                    className="w-full h-2 rounded-lg appearance-none bg-[#0a0124] cursor-pointer accent-purple-500"
                    min="0"
                    max="100"
                  />
                  <div className="flex justify-between text-xs text-purple-300/70 mt-1">
                    <span>0%</span>
                    <span>{formData.xp}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative max-w-5xl w-full max-h-[90vh] overflow-auto rounded-2xl">
            <button
              className="absolute top-2 right-2 text-white bg-[#3a0ca3] hover:bg-[#5521ce] w-8 h-8 rounded-full flex items-center justify-center z-10"
              onClick={() => setShowPaymentModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <Payment 
              key={`payment-${zoneMode}`}
              zoneMode={zoneMode} 
              onSuccess={(coins) => {
                // Update user data with new coins
                const userStr = localStorage.getItem('user');
                if (userStr) {
                  const userData = JSON.parse(userStr);
                  const updatedUserData = {
                    ...userData,
                    coins: (parseInt(userData.coins) || 0) + parseInt(coins)
                  };
                  localStorage.setItem('user', JSON.stringify(updatedUserData));
                  setUserData(updatedUserData);
                }
                setShowPaymentModal(false);
                
                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'fixed top-5 right-5 bg-green-500 text-white p-3 rounded-lg shadow-lg animate-fade-in-out z-50';
                notification.textContent = `Successfully added ${coins} coins to your account!`;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                  notification.remove();
                }, 3000);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainBar;
