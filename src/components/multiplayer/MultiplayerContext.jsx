import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const MultiplayerContext = createContext();

// Create a custom hook to use the multiplayer context
export const useMultiplayer = () => useContext(MultiplayerContext);

export const MultiplayerProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [inMatchmaking, setInMatchmaking] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [gameMessages, setGameMessages] = useState([]);
  
  // Initialize socket connection
  useEffect(() => {
    // Connect to the socket server
    // Use environment variable for server URL or fallback to development URL
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';
    console.log('Connecting to server at:', serverUrl);
    
    try {
      // Make sure the serverUrl is used exactly as provided from env
      const socketInstance = io(serverUrl, {
        withCredentials: true,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        // Explicitly set secure to true for HTTPS connections
        secure: serverUrl.startsWith('https'),
        // Remove any path from the URL to avoid issues
        path: '/socket.io/',
        autoConnect: true,
        // Add debug mode to see more detailed logs
        debug: true
      });
      
      console.log('Socket instance created with options:', {
        url: serverUrl,
        secure: serverUrl.startsWith('https'),
        transports: ['websocket', 'polling']
      });
      
      setSocket(socketInstance);
      
      // Add some test events to diagnose
      socketInstance.io.on("error", (error) => {
        console.error("Socket.io manager error:", error);
        setConnectionError(`IO manager error: ${error.message}`);
      });
      
      socketInstance.io.on("reconnect_attempt", (attempt) => {
        console.log(`Socket.io reconnect attempt #${attempt}`);
      });
    } catch (error) {
      console.error('Error creating socket connection:', error);
      setConnectionError(`Failed to create socket connection: ${error.message}`);
    }
    
    // Clean up on unmount
    return () => {
      if (socket) {
        console.log('Disconnecting socket on cleanup');
        socket.disconnect();
      }
    };
  }, []);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to multiplayer server, socket ID:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(`Failed to connect to multiplayer server: ${error.message}`);
      setIsConnected(false);
      
      // Attempt some diagnostics
      console.log('Connection diagnostics:', {
        readyState: socket.io.engine?.transport?.ws?.readyState,
        transport: socket.io.engine?.transport?.name,
        hostname: window.location.hostname
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
      
      // If we were in a game when disconnection happened, handle it
      if (currentGame) {
        setGameMessages([...gameMessages, {
          type: 'error',
          message: 'You were disconnected from the server'
        }]);
      }
    });
    
    // Game events
    socket.on('match_found', (data) => {
      console.log('Match found:', data);
      setInMatchmaking(false);
      
      const { roomId, gameType, players, initialState, currentTurn } = data;
      
      // Find opponent (the player that isn't us)
      const opponentData = players.find(player => player.userId !== getUserInfo().userId);
      
      setCurrentGame({
        roomId,
        gameType,
        startTime: Date.now()
      });
      
      setGameState(initialState);
      setOpponent(opponentData);
      setIsMyTurn(currentTurn === socket.id);
      setGameResult(null);
      
      // Add a welcome message
      setGameMessages([{
        type: 'info',
        message: `Game started! You're playing with ${opponentData.username}`
      }]);
    });
    
    socket.on('game_update', (data) => {
      console.log('Game update:', data);
      
      const { state, lastMove, currentTurn, result } = data;
      
      setGameState(state);
      setIsMyTurn(currentTurn === socket.id);
      
      // Add move to messages
      if (lastMove) {
        const moveBy = currentTurn === socket.id ? 'Opponent' : 'You';
        setGameMessages(prev => [...prev, {
          type: 'move',
          message: `${moveBy} made a move`
        }]);
      }
      
      // Handle game result
      if (result) {
        setGameResult(result);
        
        let resultMessage;
        if (result.draw) {
          resultMessage = "It's a draw!";
        } else if ((result.winner === 'X' && getUserInfo().symbol === 'X') || 
                   (result.winner === 'O' && getUserInfo().symbol === 'O')) {
          resultMessage = "You won!";
        } else {
          resultMessage = "You lost!";
        }
        
        setGameMessages(prev => [...prev, {
          type: 'result',
          message: resultMessage
        }]);
      }
    });
    
    socket.on('opponent_left', (data) => {
      console.log('Opponent left:', data);
      
      setGameMessages(prev => [...prev, {
        type: 'warning',
        message: 'Your opponent left the game'
      }]);
      
      if (data.winByDefault) {
        setGameResult({
          gameOver: true,
          winByDefault: true,
          message: "You win by default!"
        });
        
        setGameMessages(prev => [...prev, {
          type: 'result',
          message: "You win by default!"
        }]);
      }
    });
    
    socket.on('error', (data) => {
      console.error('Game error:', data);
      
      setGameMessages(prev => [...prev, {
        type: 'error',
        message: data.message
      }]);
    });
    
    return () => {
      // Remove all listeners on cleanup
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('match_found');
      socket.off('game_update');
      socket.off('opponent_left');
      socket.off('error');
    };
  }, [socket, currentGame, gameMessages]);
  
  // Helper to get user info from localStorage
  const getUserInfo = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { userId: 'guest', username: 'Guest' };
    return user;
  };
  
  // Join the matchmaking queue
  const joinMatchmaking = (gameType) => {
    if (!socket || !isConnected) {
      setConnectionError('Not connected to multiplayer server');
      return;
    }
    
    const user = getUserInfo();
    
    socket.emit('join_matchmaking', {
      gameType,
      userId: user.userId,
      username: user.username
    });
    
    setInMatchmaking(true);
    setGameMessages([{
      type: 'info',
      message: 'Looking for an opponent...'
    }]);
  };
  
  // Cancel matchmaking
  const cancelMatchmaking = () => {
    if (socket && isConnected) {
      socket.emit('cancel_matchmaking');
    }
    
    setInMatchmaking(false);
    setGameMessages([]);
  };
  
  // Make a move in the current game
  const makeMove = (move) => {
    if (!socket || !isConnected || !currentGame || !isMyTurn) {
      return false;
    }
    
    socket.emit('game_move', {
      roomId: currentGame.roomId,
      move
    });
    
    return true;
  };
  
  // Leave the current game
  const leaveGame = () => {
    if (socket && isConnected && currentGame) {
      socket.emit('leave_game', {
        roomId: currentGame.roomId
      });
    }
    
    // Reset game state
    setCurrentGame(null);
    setGameState(null);
    setOpponent(null);
    setIsMyTurn(false);
    setGameResult(null);
    setGameMessages([]);
  };
  
  // Send a chat message (if we implemented chat)
  const sendChatMessage = (message) => {
    if (!socket || !isConnected || !currentGame) {
      return;
    }
    
    socket.emit('chat_message', {
      roomId: currentGame.roomId,
      message
    });
    
    setGameMessages(prev => [...prev, {
      type: 'chat',
      from: 'You',
      message
    }]);
  };
  
  const value = {
    socket,
    isConnected,
    connectionError,
    inMatchmaking,
    currentGame,
    gameState,
    opponent,
    isMyTurn,
    gameResult,
    gameMessages,
    joinMatchmaking,
    cancelMatchmaking,
    makeMove,
    leaveGame,
    sendChatMessage
  };
  
  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}; 