import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/navbar.jsx";
import Main_bar from "./components/main_bar.jsx";
import Login from "./components/login.jsx";
import Game1 from "./pages/game1.jsx";
import Game3 from "./pages/game3.jsx";
import Game4 from "./pages/game4.jsx";
import Game5 from "./pages/game5.jsx";
import Game6 from "./pages/game6.jsx";
import Game7 from "./pages/game7.jsx";
import Game8 from "./pages/game8.jsx";
import Payment from "./components/Payment.jsx";
import MultiplayerGames from "./pages/MultiplayerGames.jsx";
import SinglePlayerGames from "./pages/SinglePlayerGames.jsx";
import GameHistory from "./pages/GameHistory.jsx";
import TransactionHistory from "./pages/TransactionHistory.jsx";
import ProfileSettings from "./pages/ProfileSettings.jsx";
import UserProfile from "./components/UserProfile.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { MultiplayerProvider } from "./components/multiplayer/MultiplayerContext.jsx";
import MultiplayerTicTacToe from "./components/multiplayer/MultiplayerTicTacToe.jsx";
import MultiplayerChessPage from "./pages/MultiplayerChess.jsx";
import { useAuth } from "./config/AuthContext.jsx";
import { updateUserCoins } from "./services/authService.js";
import FallbackConnection from './components/multiplayer/FallbackConnection';
import FallbackClient from './components/multiplayer/FallbackClient';
import ConnectionDebug from './components/debugging/ConnectionDebug';

// Fallback component when app is loading or fails to load
const AppFallback = ({ error }) => {
  return (
    <div className="min-h-screen bg-[#06013a] flex flex-col items-center justify-center text-white p-4">
      <div className="w-24 h-24 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin mb-8"></div>
      <h1 className="text-3xl font-bold mb-4">Logic Length Games</h1>
      {error ? (
        <>
          <p className="text-red-400 text-lg mb-4">There was a problem initializing the app</p>
          <p className="bg-[#150a48] p-4 rounded max-w-lg mb-6">{error.toString()}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
        </>
      ) : (
        <p className="text-lg">Loading amazing game experience...</p>
      )}
    </div>
  );
};

// Game coin requirements
const GAME_COSTS = {
  tictactoe: 10,
  chess: 20,
  snakes: 5,
  'mines-plinko': 30,
  'snail-race': 10,
  game7: 20,
  game8: 25,
  'rock-paper-scissors': 15,
  'multiplayer-tictactoe': 15,
  'multiplayer-chess': 20
};

const App = () => {
  const { currentUser, userProfile, loading, error } = useAuth();
  const navigate = useNavigate();
  const [appError, setAppError] = useState(null);
  const [showConnectionDebugger, setShowConnectionDebugger] = useState(false);
  
  // Debugging useEffect to track state changes
  useEffect(() => {
    console.log("App state updated:");
    console.log("- Loading:", loading);
    console.log("- Current user:", currentUser ? "Yes" : "No");
    console.log("- User profile:", userProfile ? "Yes" : "No");
    console.log("- Error:", error || "None");
    
    // Check localStorage for user data
    try {
      const storedUser = localStorage.getItem('user');
      console.log("- localStorage user:", storedUser ? "Present" : "Not found");
    } catch (e) {
      console.error("Error checking localStorage:", e);
    }
  }, [loading, currentUser, userProfile, error]);
  
  // Handle any app level errors
  useEffect(() => {
    const handleError = (event) => {
      console.error("Unhandled error caught:", event.error);
      setAppError(event.error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Check if user is authenticated either via Firebase or localStorage
  const isAuthenticated = () => {
    return currentUser || localStorage.getItem('user');
  };

  // Check if user has enough coins for a game
  const hasEnoughCoins = (gameType) => {
    // Get coin balance directly from localStorage
    try {
      // Get latest user data from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) return false;
      
      const userData = JSON.parse(userStr);
      const currentCoins = parseInt(userData.coins) || 0;
      const cost = GAME_COSTS[gameType] || 0;
      
      console.log(`Checking coin access - Game: ${gameType}, Cost: ${cost}, Available: ${currentCoins}`);
      
      // Return true if user has enough coins
      return currentCoins >= cost;
    } catch (e) {
      console.error("Error checking coin balance:", e);
      return false;
    }
  };

  // Deduct coins when playing a game
  const deductCoins = async (gameType) => {
    try {
      // First check if gameType is valid
      if (!gameType || !GAME_COSTS[gameType]) {
        console.error(`Invalid gameType: ${gameType}`);
        return false;
      }

      const cost = GAME_COSTS[gameType] || 0;
      console.log(`----- DEDUCTING COINS -----`);
      console.log(`Game: ${gameType}, Cost: ${cost} coins`);
      
      // Get user data directly from localStorage for immediate check
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error("No user data found in localStorage");
        alert("User data not found. Please log in again.");
        navigate('/login');
        return false;
      }
      
      // Parse user data
      let userData;
      try {
        userData = JSON.parse(userStr);
        console.log(`Current coins: ${userData.coins || 0}`);
      } catch (e) {
        console.error("Error parsing user data:", e);
        alert("There was an error with your user data. Please log in again.");
        navigate('/login');
        return false;
      }
      
      // Check if user has enough coins
      const currentCoins = parseInt(userData.coins) || 0;
      if (currentCoins < cost) {
        console.error(`Not enough coins. Has: ${currentCoins}, Needs: ${cost}`);
        alert(`Not enough coins! You need ${cost} coins to play this game, but you only have ${currentCoins}. Please top up your balance.`);
        navigate('/payment');
        return false;
      }
      
      console.log(`User has enough coins. Proceeding with deduction...`);
      
      // Use the updateUserCoins function from authService to update in Firebase
      const result = await updateUserCoins(-cost, 'game_fee', gameType);
      
      if (!result.success) {
        console.error("Failed to deduct coins:", result.error);
        
        // Manual fallback if Firebase fails
        try {
          // Calculate new balance
          const newCoins = currentCoins - cost;
          console.log(`Firebase update failed. Manual updating to ${newCoins} coins`);
          
          // Update user data
          userData.coins = newCoins;
          userData.transactions = [
            ...(userData.transactions || []),
            {
              amount: -cost,
              type: 'game_fee',
              gameType: gameType,
              date: new Date().toISOString()
            }
          ];
          
          // Save to localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Dispatch event to update UI
          window.dispatchEvent(new CustomEvent('coinBalanceUpdated', {
            detail: {
              newBalance: newCoins,
              userData: userData
            }
          }));
          
          console.log(`Manual coin deduction successful. New balance: ${newCoins}`);
          return true;
        } catch (fallbackError) {
          console.error("Manual fallback failed:", fallbackError);
          alert("There was an error deducting coins. Please try again.");
          return false;
        }
      }
      
      console.log(`Coin deduction successful! New balance: ${result.coins}`);
      return true;
    } catch (error) {
      console.error("Error deducting coins:", error);
      alert("An unexpected error occurred. Please try again.");
      return false;
    }
  };
  
  // If there's an app-level error, show the fallback screen
  if (appError) {
    return <AppFallback error={appError} />;
  }
  
  // If auth loading, show a loading spinner instead of redirecting
  if (loading) {
    return <AppFallback />;
  }

  // Add the connection debugger toggle function
  const toggleConnectionDebugger = () => {
    setShowConnectionDebugger(prev => !prev);
  };

  return (
    <MultiplayerProvider>
      {/* Add fallback components outside of Routes */}
      <FallbackConnection />
      <FallbackClient />
      
      {/* Conditionally show connection debugger */}
      {showConnectionDebugger && <ConnectionDebug />}
      
      {/* Debug button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={toggleConnectionDebugger}
          className="bg-gray-800 text-white rounded-full p-2 shadow-lg hover:bg-gray-700"
          title="Toggle Connection Debugger"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <Routes>
        {/* If there's no user, render Login page */}
        <Route path="/" element={!isAuthenticated() ? <Login /> : <Navigate to="/home" />} />
        
        {/* Add explicit login route */}
        <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/home" />} />
        
        {/* Add explicit register route */}
        <Route path="/register" element={!isAuthenticated() ? <Login isLogin={false} /> : <Navigate to="/home" />} />

        {/* Add profile route */}
        <Route
          path="/profile"
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <UserProfile />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Home Page */}
        <Route
          path="/home"
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Main_bar gameCosts={GAME_COSTS} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Game History */}
        <Route
          path="/game-history"
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <ErrorBoundary>
                  <GameHistory />
                </ErrorBoundary>
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Transaction History */}
        <Route
          path="/transaction-history"
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <ErrorBoundary>
                  <TransactionHistory />
                </ErrorBoundary>
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Profile Settings */}
        <Route
          path="/profile-settings"
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <ProfileSettings />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* New Multiplayer Games Page */}
        <Route
          path="/multiplayer-games"
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <MultiplayerGames 
                  games={[
                    { name: "Chess", path: "/multiplayer-chess", cost: GAME_COSTS['multiplayer-chess'], new: true, description: "Challenge players to the classic game of strategy!" },
                    { name: "Tic Tac Toe", path: "/multiplayer-tictactoe", cost: GAME_COSTS['multiplayer-tictactoe'], description: "Simple but fun! Be the first to get three in a row." }
                  ]} 
                />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* New Single Player Games Page */}
        <Route
          path="/single-player-games"
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <SinglePlayerGames 
                  games={[
                    { name: "Stack-Game", path: "/snakes", cost: GAME_COSTS.snakes },
                    { name: "Mines", path: "/snail-race", cost: GAME_COSTS['snail-race'] },
                    { name: "Rock-Paper-Sissors", path: "/mines-plinko", cost: 10 }
                  ]} 
                />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Games Page with coin requirements */}
        <Route 
          path="/tictactoe" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Game1 cost={GAME_COSTS.tictactoe} deductCoins={() => deductCoins('tictactoe')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/chess" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Game3 cost={GAME_COSTS.chess} deductCoins={() => deductCoins('chess')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/snakes" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Game4 cost={GAME_COSTS.snakes} deductCoins={() => deductCoins('snakes')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/rock-paper-scissors" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Game5 cost={GAME_COSTS['rock-paper-scissors']} deductCoins={() => deductCoins('rock-paper-scissors')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/mines-plinko" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Game6 cost={GAME_COSTS['mines-plinko']} deductCoins={() => deductCoins('mines-plinko')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/snail-race" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Game7 cost={GAME_COSTS['snail-race']} deductCoins={() => deductCoins('snail-race')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/aviator" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Game8 cost={GAME_COSTS.game8} deductCoins={() => deductCoins('game8')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Add routes for multiplayer games */}
        <Route
          path="/multiplayer-tictactoe"
          element={
            isAuthenticated() ? (
              <ErrorBoundary>
                <div className="min-h-screen bg-gradient-to-b from-[#0c0124] via-[#12002e] to-[#160041]">
                  <Navbar />
                  <div className="pt-24">
                    <div className="container mx-auto px-4">
                      <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-8">
                        Multiplayer Tic-Tac-Toe
                      </h1>
                      <MultiplayerProvider>
                        <MultiplayerTicTacToe 
                          cost={GAME_COSTS['multiplayer-tictactoe']} 
                          deductCoins={() => deductCoins('multiplayer-tictactoe')} 
                          user={userProfile} 
                        />
                      </MultiplayerProvider>
                    </div>
                  </div>
                </div>
              </ErrorBoundary>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Add the route for multiplayer chess */}
        <Route
          path="/multiplayer-chess"
          element={
            isAuthenticated() ? (
              <ErrorBoundary>
                <MultiplayerChessPage />
              </ErrorBoundary>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Payment page */}
        <Route 
          path="/payment" 
          element={
            isAuthenticated() ? (
              <>
                <Navbar />
                <Payment />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Catch all route - redirect to home if logged in or login page if not */}
        <Route path="*" element={isAuthenticated() ? <Navigate to="/home" /> : <Navigate to="/login" />} />
      </Routes>
    </MultiplayerProvider>
  );
};

export default App;
