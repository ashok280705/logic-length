import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/navbar.jsx";
import Main_bar from "./components/main_bar.jsx";
import Login from "./components/login.jsx"; // Ensure correct capitalization
import Game1 from "./pages/game1.jsx"; // Import the Game1 component
import Game3 from "./pages/game3.jsx";
import Game4 from "./pages/game4.jsx"; // Import the Game4 component for snakes
import Game5 from "./pages/game5.jsx"; // Import the Game5 component for mines-plinko
import Game6 from "./pages/game6.jsx"; // Import the Game6 component for snail race
import Game7 from "./pages/game7.jsx"; // Import the Game7 component for plinko
import Game8 from "./pages/game8.jsx"; // Import the Game8 component for aviator
import Payment from "./components/Payment.jsx";
import MultiplayerGames from "./pages/MultiplayerGames.jsx"; // Import new page
import SinglePlayerGames from "./pages/SinglePlayerGames.jsx"; // Import new page
import GameHistory from "./pages/GameHistory.jsx"; // Import Game History page
import TransactionHistory from "./pages/TransactionHistory.jsx"; // Import Transaction History page
import ProfileSettings from "./pages/ProfileSettings.jsx"; // Import Profile Settings page
import ErrorBoundary from "./components/ErrorBoundary.jsx"; // Import Error Boundary
import axios from "axios";
import { MultiplayerProvider } from "./components/multiplayer/MultiplayerContext.jsx";
import MultiplayerTicTacToe from "./components/multiplayer/MultiplayerTicTacToe.jsx";

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
  const [user, setUser] = useState(null);
  const [activeZone, setActiveZone] = useState('coin'); // Default to coin zone for direct payments

  // Fetch stored user info from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // If user exists in localStorage, set it in state
    }
    
    // Initialize zone mode if not present
    const storedZone = localStorage.getItem('activeZone');
    if (storedZone) {
      setActiveZone(storedZone);
    } else {
      // Default to coin zone if not set
      localStorage.setItem('activeZone', 'coin');
    }
  }, []);

  // Logout function: Clears user session
  const handleLogout = (updatedUser = null) => {
    if (updatedUser) {
      // If updatedUser is provided, update the user state instead of logging out
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } else {
      // If no updatedUser, perform normal logout
      
      // Before clearing localStorage, save any important user data to database
      if (user && user.id) {
        try {
          console.log("Saving user data before logout", user.coins);
          // This could be an async API call to update user data in the database
          axios.post('/api/auth/update-user', {
            userId: user.id,
            coins: user.coins,
            // Add any other fields that need to be saved
          }).catch(error => {
            console.error("Error saving user data before logout:", error);
          });
        } catch (error) {
          console.error("Error in pre-logout data save:", error);
        }
      }
      
      // Now clear local state
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const handlePaymentSuccess = (coins) => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      const updatedUser = { 
        ...currentUser, 
        coins: (parseInt(currentUser.coins) || 0) + parseInt(coins) 
      };
      
      // Update both state and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Updated user coins:', updatedUser.coins);
    }
  };

  // Function to check if user has enough coins for a game
  const hasEnoughCoins = (gamePath) => {
    const gameKey = gamePath.replace('/', '');
    const requiredCoins = GAME_COSTS[gameKey] || 0;
    
    return user && parseInt(user.coins || 0) >= requiredCoins;
  };

  // Function to deduct coins when starting a game
  const deductCoins = (gamePath) => {
    if (!user) return false;
    
    const gameKey = gamePath.replace('/', '');
    const requiredCoins = GAME_COSTS[gameKey] || 0;
    
    if (parseInt(user.coins || 0) >= requiredCoins) {
      const updatedUser = {
        ...user,
        coins: parseInt(user.coins) - requiredCoins
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    }
    
    return false;
  };

  // Handle zone change
  const handleZoneChange = (zone) => {
    setActiveZone(zone);
    localStorage.setItem('activeZone', zone);
  };

  return (
    <Router>
      <MultiplayerProvider>
        <Routes>
          {/* If there's no user, render Login page */}
          <Route path="/" element={!user ? <Login setUser={setUser} /> : <Navigate to="/home" />} />

          {/* Protected Home Page */}
          <Route
            path="/home"
            element={
              user ? (
                <>
                  <Navbar onLogout={handleLogout} user={user} />
                  <Main_bar gameCosts={GAME_COSTS} onZoneChange={handleZoneChange} initialZone={activeZone} />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Game History */}
          <Route
            path="/game-history"
            element={
              user ? (
                <>
                  <Navbar onLogout={handleLogout} user={user} />
                  <ErrorBoundary>
                    <GameHistory user={user} />
                  </ErrorBoundary>
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Transaction History */}
          <Route
            path="/transaction-history"
            element={
              user ? (
                <>
                  <Navbar onLogout={handleLogout} user={user} />
                  <ErrorBoundary>
                    <TransactionHistory user={user} />
                  </ErrorBoundary>
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Profile Settings */}
          <Route
            path="/profile-settings"
            element={
              user ? (
                <>
                  <Navbar onLogout={handleLogout} user={user} />
                  <ProfileSettings user={user} />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* New Multiplayer Games Page */}
          <Route
            path="/multiplayer-games"
            element={
              user ? (
                <>
                  <Navbar onLogout={handleLogout} user={user} />
                  <MultiplayerGames 
                    games={[
                      { name: "Chess", path: "/chess", cost: GAME_COSTS.chess },
                      { name: "Tic Tac Toe", path: "/tictactoe", cost: GAME_COSTS.tictactoe },
                      { name: "Rock Paper Scissors", path: "/rock-paper-scissors", cost: GAME_COSTS['mines-plinko'] }
                    ]} 
                  />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* New Single Player Games Page */}
          <Route
            path="/single-player-games"
            element={
              user ? (
                <>
                  <Navbar onLogout={handleLogout} user={user} />
                  <SinglePlayerGames 
                    games={[
                      { name: "Stack-Game", path: "/snakes", cost: GAME_COSTS.snakes },
                      { name: "Mines", path: "/snail-race", cost: GAME_COSTS['snail-race'] },
                      { name: "Rock-Paper-Sissors", path: "/mines-plinko", cost: 10 }
                    ]} 
                  />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Protected Games Page with coin requirements */}
          <Route 
            path="/tictactoe" 
            element={
              user ? (
                hasEnoughCoins('tictactoe') ? (
                  <Game1 cost={GAME_COSTS.tictactoe} deductCoins={() => deductCoins('tictactoe')} user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route 
            path="/chess" 
            element={
              user ? (
                hasEnoughCoins('chess') ? (
                  <Game3 cost={GAME_COSTS.chess} deductCoins={() => deductCoins('chess')} user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route 
            path="/snakes" 
            element={
              user ? (
                hasEnoughCoins('snakes') ? (
                  <Game4 cost={GAME_COSTS.snakes} deductCoins={() => deductCoins('snakes')} user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route 
            path="/rock-paper-scissors" 
            element={
              user ? (
                hasEnoughCoins('rock-paper-scissors') ? (
                  <Game5 cost={GAME_COSTS['rock-paper-scissors']} deductCoins={() => deductCoins('rock-paper-scissors')} user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route 
            path="/snail-race" 
            element={
              user ? (
                hasEnoughCoins('snail-race') ? (
                  <Game6 cost={GAME_COSTS['snail-race']} deductCoins={() => deductCoins('snail-race')} user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route 
            path="/game7" 
            element={
              user ? (
                hasEnoughCoins('game7') ? (
                  <Game7 cost={GAME_COSTS.game7} deductCoins={() => deductCoins('game7')} user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route 
            path="/game8" 
            element={
              user ? (
                hasEnoughCoins('game8') ? (
                  <Game8 cost={GAME_COSTS.game8} deductCoins={() => deductCoins('game8')} user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route
            path="/payment"
            element={
              user ? (
                <>
                  <Navbar onLogout={handleLogout} user={user} />
                  <Payment 
                    key={`payment-page-${activeZone}`} 
                    onSuccess={handlePaymentSuccess} 
                    zoneMode={activeZone} 
                  />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Add new route for Multiplayer Tic Tac Toe with coin requirement */}
          <Route 
            path="/multiplayer-tictactoe" 
            element={
              user ? (
                hasEnoughCoins('multiplayer-tictactoe') ? (
                  <>
                    <Navbar onLogout={handleLogout} user={user} />
                    <ErrorBoundary>
                      <MultiplayerTicTacToe cost={GAME_COSTS['multiplayer-tictactoe']} deductCoins={() => deductCoins('multiplayer-tictactoe')} user={user} />
                    </ErrorBoundary>
                  </>
                ) : (
                  <Navigate to="/payment" />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
        </Routes>
      </MultiplayerProvider>
    </Router>
  );
};

export default App;
