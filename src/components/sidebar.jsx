import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarComponents from './sidebar_components'
import SidebarSmallComp from './sidebar_small_comp'
import { logoutUser } from '../services/authService'

const Sidebar = ({ initialZone = 'coin', onZoneChange, onOpenPayment }) => {
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState(initialZone);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeSettingsItem, setActiveSettingsItem] = useState('account');

  // Sync local state with parent component and localStorage
  useEffect(() => {
    // Check localStorage first for the source of truth
    const storedZone = localStorage.getItem('activeZone');
    
    if (storedZone) {
      // If localStorage has a value and it's different from our prop, update our state
      if (storedZone !== initialZone) {
        console.log('Sidebar: localStorage zone differs from prop - using localStorage value:', storedZone);
        setActiveZone(storedZone);
        // Also notify parent to sync up
        if (onZoneChange) {
          onZoneChange(storedZone);
        }
      } else {
        setActiveZone(initialZone);
      }
    } else {
      // If no localStorage value, use the prop and set localStorage
      setActiveZone(initialZone);
      localStorage.setItem('activeZone', initialZone);
    }
    
    console.log('Sidebar zone updated to:', activeZone);
    
    // Listen for zone change events from other components
    const handleZoneChangeEvent = (event) => {
      const newZone = event.detail.zone;
      console.log('Sidebar received zone change event:', newZone);
      setActiveZone(newZone);
    };
    
    window.addEventListener('zoneChange', handleZoneChangeEvent);
    
    return () => {
      window.removeEventListener('zoneChange', handleZoneChangeEvent);
    };
  }, [initialZone, onZoneChange]);

  // Handles zone change and notifies parent component
  const handleZoneChange = (zone) => {
    console.log('Sidebar changing zone to:', zone);
    
    if (zone !== activeZone) {
      setActiveZone(zone);
      // Also update localStorage directly
      localStorage.setItem('activeZone', zone);
      // Create event to notify other components
      window.dispatchEvent(new CustomEvent('zoneChange', { detail: { zone } }));
      // Notify parent component
      if (onZoneChange) {
        onZoneChange(zone);
      }
    }
  };

  // Handle settings item selection
  const handleSettingsItemClick = (itemName) => {
    setActiveSettingsItem(itemName);
    
    // Navigate to appropriate page based on settings item
    if (itemName === 'account') {
      navigate('/profile-settings');
    } else if (itemName === 'preferences') {
      navigate('/preferences');
    } else if (itemName === 'settings') {
      navigate('/settings');
    }
  };
  
  // Handle navigation item clicks
  const handleNavItemClick = (itemName) => {
    if (itemName === 'Top Up' || itemName === 'Add Coins') {
      if (onOpenPayment) {
        onOpenPayment();
      }
    } else if (itemName === 'Profile') {
      navigate('/profile-settings');
    } else if (itemName === 'Notifications') {
      navigate('/notifications');
    } else if (itemName === 'Premium') {
      navigate('/premium');
    } else if (itemName === 'Rewards') {
      navigate('/rewards');
    }
  };

  // Add logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      navigate('/');
    }
  };

  return (
    <div className='h-full w-[280px] min-w-[280px] bg-gradient-to-b from-[#120133] via-[#0c0124] to-[#06001c] border-r border-[#2c0b7a]/30 backdrop-blur-xl relative overflow-hidden'>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <div className="absolute -right-24 top-20 w-40 h-40 bg-purple-600 rounded-full filter blur-[80px] animate-pulse-slow"></div>
        <div className="absolute -left-20 top-1/2 w-40 h-40 bg-blue-600 rounded-full filter blur-[80px] animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute -right-28 bottom-20 w-40 h-40 bg-violet-600 rounded-full filter blur-[80px] animate-pulse-slow animation-delay-4000"></div>
      </div>
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDEwKSI+PHJlY3QgaWQ9InBhdHRlcm4tYmFja2dyb3VuZCIgd2lkdGg9IjQwMCUiIGhlaWdodD0iNDAwJSIgZmlsbD0icmdiYSgxOSwwLDEwMCwwKSI+PC9yZWN0PiA8Y2lyY2xlIGZpbGw9InJnYmEoMTQ2LCA2OCwgMjU1LCAwLjAyKSIgY3g9IjIwIiBjeT0iMjAiIHI9IjEiPjwvY2lyY2xlPjxjaXJjbGUgZmlsbD0icmdiYSgxNDYsIDY4LCAyNTUsIDAuMDIpIiBjeD0iMCIgY3k9IjAiIHI9IjEiPjwvY2lyY2xlPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwYXR0ZXJuKSIgaGVpZ2h0PSIxMDAlIiB3aWR0aD0iMTAwJSI+PC9yZWN0Pjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="h-full w-full overflow-y-auto scrollbar-hide flex flex-col p-4 relative z-10">
        {/* App logo/branding at top with animation */}
        <div className="mb-6 pt-2 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#6922e1] to-[#3a0ca3] rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 relative">
              <span className="text-white font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-br from-white to-purple-100">G</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0c0124] animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Zone selector buttons with premium styling */}
        <div className="space-y-3 mb-6">
          <button 
            className={`w-full py-3 px-4 flex items-center gap-3 ${
              activeZone === 'prime' 
                ? 'bg-gradient-to-r from-[#3a0ca3] to-[#6922e1] text-white ring-2 ring-purple-500/50 ring-offset-1 ring-offset-[#120133]' 
                : 'bg-[#170045]/60 text-gray-300 hover:bg-[#230061]/70 hover:text-white backdrop-blur-sm'
            } rounded-xl transition-all duration-500 relative overflow-hidden group`}
            onClick={() => handleZoneChange('prime')}
            onMouseEnter={() => setHoverIndex(0)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div className={`w-8 h-8 rounded-full ${activeZone === 'prime' ? 'bg-white/20' : 'bg-purple-500/10'} flex items-center justify-center transition-all duration-500 ${hoverIndex === 0 ? 'scale-110' : ''}`}>
              <img src="crown.svg" alt="Prime Zone" className={`h-4 w-4 transition-transform duration-500 ${hoverIndex === 0 ? 'rotate-12' : ''}`} />
            </div>
            <span className="font-medium">Prime Zone</span>
            {activeZone === 'prime' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-300 via-white to-blue-300"></div>
            )}
            {/* Shine effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
          </button>
          
          <button 
            className={`w-full py-3 px-4 flex items-center gap-3 ${
              activeZone === 'coin' 
                ? 'bg-gradient-to-r from-[#6922e1] to-[#3a0ca3] text-white ring-2 ring-purple-500/50 ring-offset-1 ring-offset-[#120133]' 
                : 'bg-[#170045]/60 text-gray-300 hover:bg-[#230061]/70 hover:text-white backdrop-blur-sm'
            } rounded-xl transition-all duration-500 relative overflow-hidden group`}
            onClick={() => handleZoneChange('coin')}
            onMouseEnter={() => setHoverIndex(1)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div className={`w-8 h-8 rounded-full ${activeZone === 'coin' ? 'bg-white/20' : 'bg-purple-500/10'} flex items-center justify-center transition-all duration-500 ${hoverIndex === 1 ? 'scale-110' : ''}`}>
              <img src="cards.png" alt="Coin Zone" className={`h-4 w-4 transition-transform duration-500 ${hoverIndex === 1 ? 'rotate-12' : ''}`} />
            </div>
            <span className="font-medium">Coin Zone</span>
            {activeZone === 'coin' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-300 via-white to-blue-300"></div>
            )}
            {/* Shine effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
          </button>
        </div>
        
        {/* Display message based on active zone with glass morphism */}
        <div className={`p-4 rounded-xl mb-5 backdrop-blur-md border relative ${
          activeZone === 'prime' 
            ? 'bg-purple-900/10 border-purple-500/20 text-purple-300' 
            : 'bg-green-900/10 border-green-500/20 text-green-300'
        } overflow-hidden group`}>
          {/* Animated corner shine */}
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activeZone === 'prime' 
                ? 'bg-purple-500/20' 
                : 'bg-green-500/20'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d={activeZone === 'prime' 
                  ? "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" 
                  : "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                } />
              </svg>
            </div>
            <p className="text-sm font-medium">
              <strong>{activeZone === 'prime' 
                ? "Top up coins required in Prime Zone" 
                : "Add coins directly in Coin Zone"}</strong>
            </p>
          </div>
        </div>
        
        {/* Quick action with improved styling */}
        <div className="mb-6">
          <button className="w-full bg-gradient-to-r from-[#1a0050]/40 to-[#270063]/40 hover:from-[#1a0050]/60 hover:to-[#270063]/60 border border-purple-500/10 hover:border-purple-500/30 backdrop-blur-md rounded-xl p-3 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                  <img src="time.svg" alt="Quick action" className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors">Quick Play</span>
              </div>
              <span className="text-purple-400 text-xs font-semibold px-2 py-1 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">5 COINS</span>
            </div>
          </button>
        </div>
        
        {/* Main navigation section header with style */}
        <div className="mb-3 pl-2 flex items-center gap-2">
          <div className="h-px w-2 bg-gradient-to-r from-transparent to-purple-500/50"></div>
          <p className="text-xs text-purple-300/70 font-semibold uppercase tracking-wide">Navigation</p>
          <div className="h-px flex-grow bg-gradient-to-r from-purple-500/50 to-transparent"></div>
        </div>
        
        {/* Display different components based on active zone with improved organization */}
        <div className="space-y-1.5 mb-6">
          {activeZone === 'prime' ? (
            <>
              <div onClick={() => handleNavItemClick('Profile')}>
                <SidebarComponents link="profile.svg" label="Profile" />
              </div>
              <div onClick={() => handleNavItemClick('Notifications')}>
                <SidebarComponents link="notification.svg" label="Notifications" badge="3" />
              </div>
              <div onClick={() => handleNavItemClick('Top Up')}>
                <SidebarComponents link="top-up.svg" label="Top Up" active={true} />
              </div>
              <div onClick={() => handleNavItemClick('Premium')}>
                <SidebarComponents link="premium.svg" label="Premium" special={true} />
              </div>
            </>
          ) : (
            <>
              <div onClick={() => handleNavItemClick('Profile')}>
                <SidebarComponents link="profile.svg" label="Profile" />
              </div>
              <div onClick={() => handleNavItemClick('Notifications')}>
                <SidebarComponents link="notification.svg" label="Notifications" badge="3" />
              </div>
              <div onClick={() => handleNavItemClick('Add Coins')}>
                <SidebarComponents link="coins.svg" label="Add Coins" active={true} />
              </div>
              <div onClick={() => handleNavItemClick('Rewards')}>
                <SidebarComponents link="rewards.svg" label="Rewards" badge="New" />
              </div>
            </>
          )}
        </div>
        
        {/* Settings section header with enhanced visibility */}
        <div className="mb-4 pl-2 flex items-center gap-2">
          <div className="h-px w-2 bg-gradient-to-r from-transparent to-purple-500/80"></div>
          <p className="text-xs text-white font-bold uppercase tracking-wide">Settings</p>
          <div className="h-px flex-grow bg-gradient-to-r from-purple-500/80 to-transparent"></div>
        </div>
        
        {/* Settings items with enhanced visibility and interaction */}
        <div className="mb-6 relative rounded-xl overflow-hidden">
          {/* Background glow for Settings section */}
          <div className="absolute inset-0 bg-[#1a0045]/30 -z-10 rounded-xl border border-purple-500/30"></div>
          
          {/* Account */}
          <button 
            className={`w-full py-3 px-4 flex items-center gap-3 relative ${
              activeSettingsItem === 'account' 
                ? 'bg-gradient-to-r from-[#3a0ca3]/80 to-[#4e14b3]/80 text-white' 
                : 'text-gray-200 hover:bg-[#230061]/40 hover:text-white'
            } transition-all duration-300`}
            onClick={() => handleSettingsItemClick('account')}
          >
            <div className={`w-8 h-8 rounded-full ${activeSettingsItem === 'account' ? 'bg-white/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
              <img src="profile.svg" alt="Account" className="h-4 w-4" />
            </div>
            <span className="font-medium">Account</span>
            {activeSettingsItem === 'account' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
            )}
          </button>
          
          {/* Preferences */}
          <button 
            className={`w-full py-3 px-4 flex items-center gap-3 relative ${
              activeSettingsItem === 'preferences' 
                ? 'bg-gradient-to-r from-[#3a0ca3]/80 to-[#4e14b3]/80 text-white' 
                : 'text-gray-200 hover:bg-[#230061]/40 hover:text-white'
            } transition-all duration-300`}
            onClick={() => handleSettingsItemClick('preferences')}
          >
            <div className={`w-8 h-8 rounded-full ${activeSettingsItem === 'preferences' ? 'bg-white/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
              <img src="notification.svg" alt="Preferences" className="h-4 w-4" />
            </div>
            <span className="font-medium">Preferences</span>
            {activeSettingsItem === 'preferences' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
            )}
          </button>
          
          {/* Settings */}
          <button 
            className={`w-full py-3 px-4 flex items-center gap-3 relative ${
              activeSettingsItem === 'settings' 
                ? 'bg-gradient-to-r from-[#3a0ca3]/80 to-[#4e14b3]/80 text-white' 
                : 'text-gray-200 hover:bg-[#230061]/40 hover:text-white'
            } transition-all duration-300`}
            onClick={() => handleSettingsItemClick('settings')}
          >
            <div className={`w-8 h-8 rounded-full ${activeSettingsItem === 'settings' ? 'bg-white/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
              <img src="settings.svg" alt="Settings" className="h-4 w-4" />
            </div>
            <span className="font-medium">Settings</span>
            {activeSettingsItem === 'settings' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
            )}
          </button>
        </div>
        
        {/* Daily Rewards section */}
        <div className="mb-3 pl-2 flex items-center gap-2">
          <div className="h-px w-2 bg-gradient-to-r from-transparent to-purple-500/50"></div>
          <p className="text-xs text-purple-300/70 font-semibold uppercase tracking-wide">Daily Rewards</p>
          <div className="h-px flex-grow bg-gradient-to-r from-purple-500/50 to-transparent"></div>
        </div>
        
        {/* Daily Rewards tracker - Enhanced UI */}
        <div className="bg-gradient-to-br from-[#1f0060]/40 to-[#120033]/40 rounded-xl border border-purple-500/20 p-4 mb-5 backdrop-blur-md relative overflow-y-auto overflow-x-hidden group min-h-[350px] py-6 max-h-[350px] scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-purple-500/10">
          {/* Background animated effects */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-500"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full filter blur-[80px] animate-pulse-slow"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/20 rounded-full filter blur-[80px] animate-pulse-slow animation-delay-2000"></div>
          
          <div className="relative z-10">
            {/* Header with shine effect */}
            <div className="flex items-center justify-between mb-4 relative overflow-hidden rounded-lg bg-gradient-to-r from-[#20015e]/40 to-[#3a0ca3]/30 p-2 border border-purple-500/20">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/50 to-blue-500/30 border border-purple-500/40 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                  <img src="time.svg" alt="Rewards" className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Day 3 of 7</p>
                  <p className="text-xs bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">Complete all days for max coins</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-green-500/30 to-green-700/30 border border-green-500/40">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-green-300">Available</span>
              </div>
            </div>
            
            {/* Progress bar with animated gradient */}
            <div className="w-full h-3 bg-[#0d0028]/80 rounded-full mb-5 overflow-hidden relative p-0.5">
              <div className="absolute inset-0 bg-[#0d0028] rounded-full"></div>
              <div className="relative h-full w-[42%] bg-gradient-to-r from-[#6922e1] via-[#9546ed] to-[#4e14b3] rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
              </div>
            </div>
            
            {/* Daily rewards bubbles - Enhanced visuals */}
            <div className="flex justify-between items-center mb-4">
              {[5, 10, 15, 25, 40, 60, 100].map((reward, index) => (
                <div 
                  key={index} 
                  className={`relative flex flex-col items-center group/reward ${index <= 2 ? 'opacity-100' : 'opacity-70'}`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300 
                    ${index < 2 
                      ? 'bg-gradient-to-br from-green-500/30 to-green-700/20 border-2 border-green-500/50 shadow-md shadow-green-500/20' 
                      : index === 2 
                        ? 'bg-gradient-to-br from-purple-500/60 to-blue-500/40 border-2 border-purple-500/70 ring-2 ring-purple-500/30 ring-offset-2 ring-offset-[#0c0124] animate-pulse-slow shadow-lg shadow-purple-500/30'
                        : 'bg-[#1a0050]/40 border border-purple-500/20 group-hover/reward:border-purple-500/40 group-hover/reward:bg-[#1a0050]/60'
                    }`}
                  >
                    {index <= 2 && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0c0124] animate-pulse"></div>
                    )}
                    <div className="flex flex-col items-center justify-center">
                      <span className={`text-base font-bold ${index <= 2 ? 'text-white' : 'text-purple-300/90'}`}>{reward}</span>
                      <span className={`text-[8px] ${index <= 2 ? 'text-white/70' : 'text-purple-300/60'}`}>coins</span>
                    </div>
                  </div>
                  <div className={`absolute -bottom-0.5 w-20 h-0.5 ${
                      index < 2 
                        ? 'bg-gradient-to-r from-green-500/0 via-green-500/50 to-green-500/0' 
                        : index === 2 
                          ? 'bg-gradient-to-r from-purple-500/0 via-purple-500/70 to-purple-500/0 animate-pulse-slow'
                          : 'bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover/reward:via-purple-500/30'
                    }`}>
                  </div>
                  <span className={`text-[10px] ${
                      index < 2 
                        ? 'text-green-300' 
                        : index === 2 
                          ? 'text-white font-medium' 
                          : 'text-gray-400'
                    }`}>Day {index + 1}</span>
                </div>
              ))}
            </div>
            
            {/* Daily reward animation for current day */}
            <div className="relative py-2 px-3 mb-3 bg-gradient-to-r from-[#20015e]/40 to-[#3a0ca3]/30 rounded-lg border border-purple-500/30 flex items-center justify-between overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/50 to-blue-600/40 animate-spin-slow"></div>
                  <div className="absolute inset-1 rounded-full bg-[#0c0124]"></div>
                  <div className="relative z-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-base font-bold rounded-full w-9 h-9 flex items-center justify-center">
                    15
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">Today's Reward</h4>
                  <p className="text-xs text-purple-300/80">Claim now - resets in 6h 23m</p>
                </div>
              </div>
              <div className="animate-bounce-subtle">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          
            {/* Claim button - Enhanced */}
            <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 relative overflow-hidden group/button">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/button:translate-x-full transition-all duration-700"></div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
              </svg>
              <span className="relative z-10">CLAIM 15 COINS</span>
            </button>
          </div>
        </div>
        
        {/* Friends section */}
        <div className="mb-3 pl-2 flex items-center gap-2">
          <div className="h-px w-2 bg-gradient-to-r from-transparent to-purple-500/50"></div>
          <p className="text-xs text-purple-300/70 font-semibold uppercase tracking-wide">Friends Online</p>
          <div className="h-px flex-grow bg-gradient-to-r from-purple-500/50 to-transparent"></div>
        </div>
        
        {/* Online friends */}
        <div className="bg-[#170045]/30 rounded-xl border border-purple-500/10 p-3 mb-5 backdrop-blur-md">
          <div className="space-y-3">
            {/* Friend item */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-purple-500/30">
                    <span className="text-white text-xs font-bold">R</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0c0124]"></div>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Rahul</p>
                  <p className="text-xs text-purple-300/60">Playing Chess</p>
                </div>
              </div>
              <button className="w-6 h-6 rounded-full bg-purple-500/10 hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-purple-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            
            {/* Friend item */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-purple-500/30">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 rounded-full border-2 border-[#0c0124]"></div>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Sahil</p>
                  <p className="text-xs text-purple-300/60">Idle</p>
                </div>
              </div>
              <button className="w-6 h-6 rounded-full bg-purple-500/10 hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-purple-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <button className="w-full mt-3 py-1.5 rounded-lg border border-purple-500/20 bg-[#1a0050]/20 hover:bg-[#1a0050]/40 text-purple-300 text-xs transition-all duration-300 flex items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            View All (12)
          </button>
        </div>
        
        {/* Version info with premium styling */}
        <div className="mt-auto pt-3 pb-2 flex justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/10 border border-purple-500/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xs text-purple-300/70">v1.0.2</p>
          </div>
        </div>

        {/* Logout button */}
        <div className="mt-2 pt-3 pb-4 flex flex-col items-center">
          <button
            onClick={handleLogout}
            className="w-full max-w-xs py-3 px-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m0 0l3-3m-3 3l3 3" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
