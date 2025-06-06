import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Payment from "./Payment";
import { logoutUser, getUserDataFromFirebase } from "../services/authService.js";
import { useAuth } from "../config/AuthContext";
import "./Navbar.css"; // Make sure you have a CSS file for styling
import Sidebar from './sidebar';

const Navbar = ({ onLogout, user }) => {
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeZone, setActiveZone] = useState('coin'); // Default to coin zone for direct payments
  const [dataInitialized, setDataInitialized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Get auth context
  const { userProfile } = useAuth();

  // Sample game data - in a real app, this might come from an API or context
  const availableGames = [
    { id: 1, name: 'Chess', image: 'chess.webp', coins: 50, category: 'strategy' },
    { id: 2, name: 'mines', image: 'sudoku.webp', coins: 20, category: 'puzzle' },
    { id: 3, name: 'Tic Tac Toe', image: 'tictactoe.webp', coins: 10, category: 'casual' },
    { id: 4, name: 'Checkers', image: 'checkers.webp', coins: 30, category: 'strategy' },
    { id: 5, name: 'Memory Match', image: 'memory.webp', coins: 15, category: 'puzzle' },
    { id: 6, name: 'Word Puzzle', image: 'word.webp', coins: 25, category: 'puzzle' },
    { id: 7, name: 'Chess Variants', image: 'chess-variants.webp', coins: 60, category: 'strategy' },
    { id: 8, name: 'Multiplayer Chess', image: 'multiplayer-chess.webp', coins: 70, category: 'strategy' },
  ];

  // Initialize user data from different sources with priority order
  useEffect(() => {
    const initializeUserData = () => {
      console.log("Initializing user data in Navbar");
      let userData = null;
      
      // Priority 1: Props passed directly to component
      if (user) {
        console.log("Using user data from props");
        userData = user;
      } 
      // Priority 2: Auth context userProfile
      else if (userProfile) {
        console.log("Using user data from Auth context");
        userData = userProfile;
      } 
      // Priority 3: localStorage
      else {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            console.log("Using user data from localStorage");
            userData = JSON.parse(userStr);
          }
        } catch (err) {
          console.error("Error parsing user data from localStorage", err);
        }
      }
      
      // If we have user data from any source, set it
      if (userData) {
        // Ensure coins is always treated as a number
        userData.coins = parseInt(userData.coins) || 0;
        setCurrentUser(userData);
        setDataInitialized(true);
        console.log(`[Navbar] Initial user data loaded. Username: ${userData.username}, Coins: ${userData.coins}`);
      } else {
        console.warn("[Navbar] No user data found from any source");
      }
    };
    
    initializeUserData();
  }, [user, userProfile]);
  
  // Separate effect to watch for changes in userProfile from context
  useEffect(() => {
    if (userProfile && dataInitialized) {
      console.log("[Navbar] Updating from userProfile context change");
      setCurrentUser({
        ...userProfile,
        coins: parseInt(userProfile.coins) || 0
      });
    }
  }, [userProfile, dataInitialized]);
  
  // Regular polling for fresh data
  useEffect(() => {
    if (!dataInitialized) return;
    
    // Set up regular polling for localStorage data
    const localInterval = setInterval(() => {
      loadUserData();
    }, 2000); // Check localStorage every 2 seconds
    
    return () => {
      clearInterval(localInterval);
    };
  }, [dataInitialized]);
  
  // Separate function to load user data from localStorage
  const loadUserData = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        // Ensure coins is always treated as a number
        userData.coins = parseInt(userData.coins) || 0;
        
        // Only update if different (to avoid unnecessary re-renders)
        if (!currentUser || userData.coins !== currentUser.coins) {
          setCurrentUser(userData);
          console.log(`[Navbar] Updated coin balance: ${userData.coins}`);
        }
      } catch (err) {
        console.error("Error parsing user data from localStorage", err);
      }
    }
  };

  // Listen for coin balance updates
  useEffect(() => {
    const handleCoinUpdate = (event) => {
      console.log("Coin balance updated event received", event.detail);
      
      if (event.detail.userData) {
        // If the event includes full user data, use it directly
        const updatedUser = {
          ...event.detail.userData,
          coins: parseInt(event.detail.userData.coins) || 0
        };
        setCurrentUser(updatedUser);
      } else if (event.detail.newBalance !== undefined) {
        // If only the balance is provided, update just that field
        setCurrentUser(prevUser => ({
          ...prevUser,
          coins: parseInt(event.detail.newBalance) || 0
        }));
      } else {
        // Otherwise, get the updated user from localStorage
        loadUserData();
      }
    };
    
    // Add event listener
    window.addEventListener('coinBalanceUpdated', handleCoinUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('coinBalanceUpdated', handleCoinUpdate);
    };
  }, []);

  // Handle search functionality
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Simulate search delay (like an API call)
    setTimeout(() => {
      const filteredGames = availableGames.filter(game => 
        game.name.toLowerCase().includes(query.toLowerCase()) ||
        game.category.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredGames);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 300);
  };
  
  // Navigate to game page
  const navigateToGame = (gameId) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Map game IDs to their corresponding routes
    const gameRoutes = {
      1: '/chess',
      2: '/tictactoe',
      3: '/tictactoe',
      4: '/game/checkers',
      5: '/game/memory',
      6: '/game/word-puzzle',
      7: '/game/chess-variants',
      8: '/game/multiplayer-chess'
    };
    
    // Find the game in our list to get its details
    const game = availableGames.find(g => g.id === gameId);
    
    if (game) {
      console.log(`Navigating to ${game.name} game`);
      
      // Navigate to the appropriate route
      if (gameRoutes[gameId]) {
        navigate(gameRoutes[gameId]);
      } else {
        // Fallback to a generic route with the game ID
        navigate(`/game/${gameId}`);
      }
    }
  };
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-menu') && !event.target.closest('.profile-button')) {
        setShowProfileDropdown(false);
      }
      if (!event.target.closest('.menu-container')) {
        setIsMenuOpen(false);
      }
      if (!event.target.closest('.notification-container') && !event.target.closest('.notification-button')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLogout = async () => {
    try {
      await logoutUser(); // This will call Firebase signOut and clear localStorage
      
      // If there's an onLogout callback, call it
      if (onLogout) {
        onLogout();
      }
      
      // Navigate to login page
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      
      // Fallback to manual logout if the service fails
      localStorage.removeItem("user");
      if (onLogout) onLogout();
      navigate("/");
    }
  };

  // Add notification function
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      read: false,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show notification badge animation
    const notificationButton = document.querySelector('.notification-badge');
    if (notificationButton) {
      notificationButton.classList.add('animate-ping-once');
      setTimeout(() => {
        notificationButton.classList.remove('animate-ping-once');
      }, 1000);
    }
  };
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    // Close other menus
    setShowProfileDropdown(false);
    setIsMenuOpen(false);
  };
  
  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const handlePaymentSuccess = (coins) => {
    console.log("Payment successful! Added coins:", coins);
    
    // Get the updated user from localStorage to ensure we have the latest data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const updatedUser = JSON.parse(userStr);
      
      // Update parent component state to reflect new coin balance
      if (onLogout) {
        // Pass the updated user to update the state without logging out
        onLogout(updatedUser);
      }
      
      // Update local state
      setCurrentUser(updatedUser);
    }
    
    // Close the payment modal
    setShowPayment(false);
    
    // Add payment success notification
    addNotification(`Payment successful! Added ${coins} coins to your account.`, 'success');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    // Close other menus
    setIsMenuOpen(false);
    setShowNotifications(false);
  };
  
  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Format time for notifications
  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds difference
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Handle navigation to different profile sections
  const navigateToProfileSection = (section) => {
    console.log(`Navigating to ${section}`);
    setShowProfileDropdown(false);
    navigate(`/${section}`);
  };

  // Get active zone from localStorage or another source
  useEffect(() => {
    const storedZone = localStorage.getItem('activeZone');
    if (storedZone) {
      setActiveZone(storedZone);
    }
    
    // Listen for zone changes from other components
    const handleZoneChange = (event) => {
      const newZone = event.detail.zone;
      console.log('Navbar received zone change:', newZone);
      setActiveZone(newZone);
    };
    
    window.addEventListener('zoneChange', handleZoneChange);
    
    // Also listen for changes to localStorage directly
    const handleStorageChange = (event) => {
      if (event.key === 'activeZone') {
        const newZone = event.newValue;
        console.log('Navbar detected localStorage zone change:', newZone);
        setActiveZone(newZone);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('zoneChange', handleZoneChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Ensure payment modal uses the latest zone
  const openPaymentModal = () => {
    // Refresh zone from localStorage before opening modal
    const currentZone = localStorage.getItem('activeZone');
    if (currentZone) {
      setActiveZone(currentZone);
    }
    setShowPayment(true);
  };

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile & Tablet Navbar */}
      <nav className="fixed top-0 left-0 w-full h-14 bg-[#150832] flex items-center justify-between px-3 shadow-lg z-50 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            aria-label="Open menu"
            className="p-2 rounded-full hover:bg-[#23234a] focus:outline-none"
            onClick={() => setShowSidebar(true)}
          >
            <img src="menu.svg" alt="menu" className="h-6 w-6" />
          </button>
          <img src="logo.png" alt="logo" className="h-8" onClick={() => navigate('/home')} />
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Wallet" className="flex items-center bg-[#23234a] rounded-full px-2 py-1" onClick={openPaymentModal}>
            <img src="wallet.svg" alt="wallet" className="h-5 mr-1" />
            <span className="text-white text-sm font-bold">{currentUser?.coins || user?.coins || 0}</span>
          </button>
          <button aria-label="Search" onClick={() => setShowSearchResults(true)}><img src="search.svg" alt="search" className="h-6" /></button>
          <button aria-label="Notifications" onClick={toggleNotifications}><img src="notification.svg" alt="notifications" className="h-6" /></button>
          <button aria-label="Profile" onClick={toggleProfileDropdown}><img src="profile.svg" alt="profile" className="h-6" /></button>
        </div>
      </nav>

      {/* Mobile/Tablet Sidebar Slide-in */}
      {showSidebar && (
        <div className="fixed inset-0 z-[9999] flex flex-row lg:hidden">
          {/* Sidebar on the left */}
          <div className="w-72 max-w-full h-full bg-[#120133] shadow-2xl animate-slideInLeft relative">
            <button
              className="absolute top-4 right-4 text-white text-2xl z-10"
              onClick={() => setShowSidebar(false)}
              aria-label="Close menu"
            >
              &times;
            </button>
            <Sidebar />
          </div>
          {/* Overlay fills the rest */}
          <div className="flex-1 bg-black/60" onClick={() => setShowSidebar(false)}></div>
        </div>
      )}
      <style jsx>{`
        @keyframes slideInLeft {
          0% { transform: translateX(-100%); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1) forwards;
        }
      `}</style>

      {/* Mobile & Tablet Search Modal */}
      {showSearchResults && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex flex-col items-center justify-start pt-20 px-4 lg:hidden">
          <div className="w-full max-w-md bg-[#1a0050] rounded-xl shadow-2xl border border-[#6320dd]/40 p-4 relative">
            <button className="absolute top-2 right-2 text-white text-2xl" onClick={() => setShowSearchResults(false)} aria-label="Close search">&times;</button>
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
              className="py-3 pl-12 pr-4 bg-[#2a1664]/40 border border-[#6320dd]/40 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[#6320dd] w-full transition-all duration-300 text-lg mb-4"
            />
            <img src="search.svg" alt="search" className="h-6 w-6 absolute left-6 top-7 transform -translate-y-1/2" />
            {/* Search results dropdown (reuse existing logic) */}
            <div className="max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-t-2 border-r-2 border-purple-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-purple-300 mt-2 text-sm">Searching games...</p>
                </div>
              ) : searchResults.length === 0 && searchQuery.trim() !== '' ? (
                <div className="p-4 text-center">
                  <p className="text-gray-400">No games found for "{searchQuery}"</p>
                </div>
              ) : (
                <div>
                  {searchResults.map(game => (
                    <div 
                      key={game.id}
                      onClick={() => { setShowSearchResults(false); navigateToGame(game.id); }}
                      className="p-3 hover:bg-[#2a1664] transition-all duration-200 cursor-pointer border-b border-[#2c0b7a]/10 last:border-0 flex items-center"
                    >
                      <div className="w-10 h-10 rounded bg-[#2c0b7a]/20 overflow-hidden mr-3 flex items-center justify-center">
                        {game.image ? (
                          <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold">
                            {game.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{game.name}</p>
                        <p className="text-[#b69fff] text-xs capitalize">{game.category}</p>
                      </div>
                      <div className="flex items-center text-yellow-300 ml-2">
                        <span className="text-sm font-semibold">{game.coins}</span>
                        <span className="text-xs ml-1">COINS</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navbar (unchanged) */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''} hidden lg:block`}>
        <nav className={`h-[9vh] flex justify-between items-center border-b border-[#0b0c33] ${scrolled ? 'bg-[#150832]/95' : 'bg-[#150832]'} backdrop-blur-sm transition-all duration-500`}>
          {/* Hamburger menu for mobile - bigger and thumb-friendly */}
          <div className="menu h-[9vh] w-[16vw] flex justify-center items-center bg-[#111134] hover:bg-[#0d0d2a] transition-all duration-300 pulse-effect relative menu-container md:hidden">
            <button 
              className="menu-btn cursor-pointer p-4 rounded-full bg-[#23234a]/80 hover:bg-[#2a1664] shadow-lg flex items-center justify-center transition-transform duration-200"
              style={{ minWidth: 56, minHeight: 56 }}
              onClick={handleToggle}
              aria-label="Open menu"
            >
              <img src="menu.svg" alt="menu" width="32px" className="filter brightness-200" />
            </button>
          </div>

          {/* Main nav-content: hidden on mobile, flex on md+ */}
          <div className="main_nav w-[96vw] h-[9vh] bg-[#150832] items-center relative overflow-hidden hidden md:flex">
            {/* Grid overlay pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(99,32,221,0.1)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(99,32,221,0.1)_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(139,92,246,0.3)_0%,_transparent_70%)]"></div>
            <div className="nav-content w-full flex justify-between items-center px-8 relative z-10">
              <div className="logo w-[11vw] flex justify-center perspective-container">
                <img 
                  src="logo.png" 
                  alt="logic-length logo" 
                  className="h-10 hover:scale-105 transition-transform duration-300 animate-float perspective-element cursor-pointer"
                  onClick={() => navigate('/home')}
                />
              </div>

              <div className="wallet h-[6vh] w-[15vw] grid grid-cols-[2fr_1fr] rounded-[8px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 futuristic-border cursor-pointer relative overflow-hidden shine-effect" onClick={openPaymentModal}>
                <div className="value text-white flex items-center bg-gradient-to-r from-[#463d5d] to-[#57457a] pl-4 font-medium text-lg">
                  <span className="mr-1 rainbow-text font-bold">{currentUser?.coins || user?.coins || 0}</span>
                  <span className="text-xs text-[#b69fff] ml-1">COINS</span>
                </div>
                <div className="wallet-icon flex items-center justify-center bg-gradient-to-r from-[#0b4da9] to-[#0f5ecc] hover:from-[#0f5ecc] hover:to-[#1470f5] transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.8)_0%,_transparent_50%)] opacity-0 hover:opacity-40 transition-opacity duration-500"></div>
                  <img src="wallet.svg" alt="wallet" className="h-7 relative z-10" />
                </div>
              </div>

              <div className="search-container relative mr-4">
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onFocus={() => {
                    if (searchQuery.trim() !== '') {
                      setShowSearchResults(true);
                    }
                  }}
                  className="py-2 pl-10 pr-4 bg-[#2a1664]/40 border border-[#6320dd]/40 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[#6320dd] w-64 transition-all duration-300"
                />
                <img src="search.svg" alt="search" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" />
                
                {/* Search results dropdown */}
                {showSearchResults && (
                  <div className="fixed mt-1 w-[350px] bg-gradient-to-b from-[#1a0050] to-[#09001a] rounded-xl shadow-2xl border border-[#6320dd]/40 overflow-hidden z-[9999] max-h-96 overflow-y-auto search-results-popup" style={{ top: "calc(9vh + 5px)", left: "50%", transform: "translateX(-50%)" }}>
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="w-6 h-6 border-t-2 border-r-2 border-purple-500 rounded-full animate-spin mx-auto"></div>
                        <p className="text-purple-300 mt-2 text-sm">Searching games...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-400">No games found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <div>
                        <div className="p-3 border-b border-[#2c0b7a]/30 bg-[#1a0050]/80">
                          <p className="text-white text-sm font-medium">Search Results for "{searchQuery}"</p>
                        </div>
                        {searchResults.map(game => (
                          <div 
                            key={game.id}
                            onClick={() => navigateToGame(game.id)}
                            className="p-3 hover:bg-[#2a1664] transition-all duration-200 cursor-pointer border-b border-[#2c0b7a]/10 last:border-0 flex items-center"
                          >
                            <div className="w-10 h-10 rounded bg-[#2c0b7a]/20 overflow-hidden mr-3 flex items-center justify-center">
                              {game.image ? (
                                <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold">
                                  {game.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{game.name}</p>
                              <p className="text-[#b69fff] text-xs capitalize">{game.category}</p>
                            </div>
                            <div className="flex items-center text-yellow-300 ml-2">
                              <span className="text-sm font-semibold">{game.coins}</span>
                              <span className="text-xs ml-1">COINS</span>
                            </div>
                          </div>
                        ))}
                        {searchResults.length > 0 && (
                          <div className="p-2 text-center bg-[#1a0050]/50">
                            <button 
                              className="text-sm text-purple-300 hover:text-white transition-colors"
                              onClick={() => setShowSearchResults(false)}
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="user-controls flex items-center gap-3">
                <div className="notification-container relative">
                  <button 
                    className="relative p-2 hover:bg-[#2a2a4d] rounded-full transition-all duration-200 super-glass flex items-center justify-center group notification-button"
                    onClick={toggleNotifications}
                  >
                    <img src="notification.svg" alt="notification" className="h-6" />
                    {unreadCount > 0 && (
                      <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full border border-[#150832] flex items-center justify-center notification-badge">
                        <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </div>
                    )}
                  </button>
                  
                  {/* Notifications panel */}
                  {showNotifications && (
                    <div className="fixed top-[9vh] right-20 w-[320px] bg-[#150038] rounded-xl shadow-2xl transform transition-all duration-300 scale-100 opacity-100 origin-top-right z-[9999] border border-[#2c0b7a]/50 overflow-hidden animate-fadeIn">
                      <div className="bg-[#1a0050] p-3 border-b border-[#2c0b7a]/30 flex justify-between items-center">
                        <h3 className="text-white font-medium">Notifications</h3>
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearAllNotifications}
                            className="text-xs text-purple-300 hover:text-white transition-colors py-1 px-2 rounded hover:bg-[#2a1664]/40"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          <div>
                            {notifications.map(notification => (
                              <div 
                                key={notification.id}
                                className={`p-3 border-b border-[#2c0b7a]/10 hover:bg-[#2a1664]/20 transition-colors ${notification.read ? 'opacity-70' : ''}`}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="flex items-start">
                                  <div className={`w-2 h-2 rounded-full mt-2 mr-2 ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} ${notification.read ? 'opacity-40' : 'animate-pulse'}`}></div>
                                  <div className="flex-1">
                                    <p className="text-sm text-white">{notification.message}</p>
                                    <p className="text-xs text-purple-300 mt-1">{formatTime(notification.timestamp)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="relative profile-menu">
                  <button 
                    className={`p-2 hover:bg-[#2a2a4d] rounded-full transition-all duration-200 super-glass profile-button ${showProfileDropdown ? 'bg-[#2a2a4d]' : ''}`}
                    onClick={toggleProfileDropdown}
                  >
                    <img src="profile.svg" alt="profile" className="h-7" />
                  </button>
                </div>
                
                <button 
                  className="cybr-btn px-4 py-2 bg-gradient-to-r from-[#4e1ebb] to-[#8b5cf6] rounded-lg text-white text-sm font-medium transform hover:scale-105 transition-all duration-300 ml-2"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-5xl w-full max-h-[90vh] overflow-auto rounded-2xl">
            <button
              className="absolute top-2 right-2 text-white bg-[#3a0ca3] hover:bg-[#5521ce] w-8 h-8 rounded-full flex items-center justify-center z-10"
              onClick={() => setShowPayment(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <Payment 
              key={`payment-modal-${activeZone}`}
              onSuccess={handlePaymentSuccess} 
              zoneMode={activeZone} 
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .fixed-popup {
          box-shadow: 0 5px 25px rgba(99, 32, 221, 0.4);
          position: absolute;
          transform: translateY(0);
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .search-results-popup {
          box-shadow: 0 5px 30px rgba(99, 32, 221, 0.5);
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        @keyframes popIn {
          0% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-10px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0) scale(1); 
          }
        }
        
        @keyframes ping-once {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-ping-once {
          animation: ping-once 1s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
      `}</style>
    </>
  );
};

export default Navbar;
