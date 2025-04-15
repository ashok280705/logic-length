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
import { MultiplayerProvider } from "./context/MultiplayerContext.jsx";
import MultiplayerTicTacToe from "./components/multiplayer/MultiplayerTicTacToe.jsx";
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
  'multiplayer-tictactoe': 15
};

const App = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

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

  return (
    <MultiplayerProvider>
      <Routes>
        {/* If there's no user, render Login page */}
        <Route path="/" element={!currentUser ? <Login /> : <Navigate to="/home" />} />
        
        {/* Add explicit login route */}
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/home" />} />
        
        {/* Add explicit register route */}
        <Route path="/register" element={!currentUser ? <Login isLogin={false} /> : <Navigate to="/home" />} />

        {/* Add profile route */}
        <Route
          path="/profile"
          element={
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
              <>
                <Navbar />
                <MultiplayerGames 
                  games={[
                    { name: "Chess", path: "/chess", cost: GAME_COSTS.chess },
                    { name: "Tic Tac Toe", path: "/tictactoe", cost: GAME_COSTS.tictactoe },
                    { name: "Rock Paper Scissors", path: "/rock-paper-scissors", cost: GAME_COSTS['mines-plinko'] }
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
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
            currentUser ? (
              <>
                <Navbar />
                <Game8 cost={GAME_COSTS.game8} deductCoins={() => deductCoins('game8')} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/multiplayer-tictactoe" 
          element={
            currentUser ? (
              <>
                <Navbar />
                <MultiplayerTicTacToe 
                  cost={GAME_COSTS['multiplayer-tictactoe']} 
                  deductCoins={() => deductCoins('multiplayer-tictactoe')} 
                />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Payment page */}
        <Route 
          path="/payment" 
          element={
            currentUser ? (
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
        <Route path="*" element={currentUser ? <Navigate to="/home" /> : <Navigate to="/login" />} />
      </Routes>
    </MultiplayerProvider>
  );
};

export default App;
