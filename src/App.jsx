import React from "react";
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
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  
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
      
      // Check if user has enough coins - IMPORTANT CHECK
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
  
  // If auth loading, show a loading spinner instead of redirecting
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
    <MultiplayerProvider>
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
                  <Navbar onLogout={logout} user={userProfile} />
                  <div className="pt-24">
                    <div className="container mx-auto px-4">
                      <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-8">
                        Multiplayer Tic-Tac-Toe
                      </h1>
                      <MultiplayerProvider>
                        <MultiplayerTicTacToe 
                          cost={GAME_COSTS['multiplayer-tictactoe']} 
                          deductCoins={() => deductCoins(GAME_COSTS['multiplayer-tictactoe'], 'multiplayer-tictactoe')} 
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
