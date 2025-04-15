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
import { useAuth } from "./config/AuthContext.jsx";

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
    if (!userProfile) return false;
    return (userProfile.balance || 0) >= GAME_COSTS[gameType];
  };

  // Deduct coins when playing a game
  const deductCoins = async (gameType) => {
    try {
      // Get fresh user data from localStorage to ensure we have the latest balance
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error("No user data found in localStorage");
        return false;
      }
      
      let userData;
      try {
        userData = JSON.parse(userStr);
      } catch (e) {
        console.error("Error parsing user data:", e);
        return false;
      }
      
      const cost = GAME_COSTS[gameType] || 0;
      console.log(`Attempting to deduct ${cost} coins from balance:`, userData.coins);
      
      // Check if user has enough coins
      if ((userData.coins || 0) < cost) {
        console.error("Not enough coins to play");
        alert(`Not enough coins! You need ${cost} coins to play.`);
        navigate('/payment');
        return false;
      }
      
      // Update coins in localStorage
      const updatedUserData = {
        ...userData,
        coins: Math.max(0, (userData.coins || 0) - cost),
        transactions: [
          ...(userData.transactions || []),
          {
            amount: -cost,
            type: 'game_fee',
            gameType: gameType,
            date: new Date().toISOString()
          }
        ]
      };
      
      // Save updated user data to localStorage
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      console.log("Updated user data after deduction:", updatedUserData);
      
      // Dispatch an event to notify components about the coin balance update
      window.dispatchEvent(new CustomEvent('coinBalanceUpdated', { 
        detail: { 
          newBalance: updatedUserData.coins,
          userData: updatedUserData
        } 
      }));
      
      return true;
    } catch (error) {
      console.error("Error deducting coins:", error);
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
              hasEnoughCoins('tictactoe') ? (
                <Game1 cost={GAME_COSTS.tictactoe} deductCoins={() => deductCoins('tictactoe')} />
              ) : (
                <Navigate to="/payment" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/chess" 
          element={
            currentUser ? (
              hasEnoughCoins('chess') ? (
                <Game3 cost={GAME_COSTS.chess} deductCoins={() => deductCoins('chess')} />
              ) : (
                <Navigate to="/payment" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/snakes" 
          element={
            currentUser ? (
              hasEnoughCoins('snakes') ? (
                <Game4 cost={GAME_COSTS.snakes} deductCoins={() => deductCoins('snakes')} />
              ) : (
                <Navigate to="/payment" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/rock-paper-scissors" 
          element={
            currentUser ? (
              hasEnoughCoins('rock-paper-scissors') ? (
                <Game5 cost={GAME_COSTS['rock-paper-scissors']} deductCoins={() => deductCoins('rock-paper-scissors')} />
              ) : (
                <Navigate to="/payment" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/mines-plinko" 
          element={
            currentUser ? (
              hasEnoughCoins('mines-plinko') ? (
                <Game6 cost={GAME_COSTS['mines-plinko']} deductCoins={() => deductCoins('mines-plinko')} />
              ) : (
                <Navigate to="/payment" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/snail-race" 
          element={
            currentUser ? (
              hasEnoughCoins('snail-race') ? (
                <Game7 cost={GAME_COSTS['snail-race']} deductCoins={() => deductCoins('snail-race')} />
              ) : (
                <Navigate to="/payment" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/aviator" 
          element={
            currentUser ? (
              hasEnoughCoins('game8') ? (
                <Game8 cost={GAME_COSTS.game8} deductCoins={() => deductCoins('game8')} />
              ) : (
                <Navigate to="/payment" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/multiplayer-tictactoe" 
          element={
            currentUser ? (
              hasEnoughCoins('multiplayer-tictactoe') ? (
                <MultiplayerTicTacToe cost={GAME_COSTS['multiplayer-tictactoe']} deductCoins={() => deductCoins('multiplayer-tictactoe')} />
              ) : (
                <Navigate to="/payment" />
              )
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
