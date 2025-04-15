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
    
    // Check if we're connecting to Render
    const isRenderConnection = serverUrl.includes('onrender.com');
    console.log('Connecting to Render hosted server:', isRenderConnection);
    
    try {
      // Make sure the serverUrl is used exactly as provided from env
      const socketInstance = io(serverUrl, {
        withCredentials: true,
        reconnectionAttempts: isRenderConnection ? 15 : 10,
        reconnectionDelay: isRenderConnection ? 5000 : 3000,
        reconnectionDelayMax: 15000,
        timeout: isRenderConnection ? 60000 : 30000, // Increased timeout
        transports: ['websocket', 'polling'],
        secure: serverUrl.startsWith('https'),
        path: '/socket.io/',
        autoConnect: true,
        debug: true,
        forceNew: false,
        pingTimeout: isRenderConnection ? 60000 : 30000,
        pingInterval: isRenderConnection ? 20000 : 25000,
        // Add new configurations for better reliability
        reconnection: true,
        randomizationFactor: 0.5,
        // Enable compression
        perMessageDeflate: true,
        // Connection stabilization
        rememberUpgrade: true,
        upgrade: true,
        // Retry strategy
        retries: 5,
        // Buffer optimization
        maxHttpBufferSize: 1e6,
        // Transport options
        transportOptions: {
          polling: {
            extraHeaders: {
              'X-Client-Info': 'LogicLen Game Client'
            }
          }
        }
      });
      
      console.log('Socket instance created with options:', {
        url: serverUrl,
        secure: serverUrl.startsWith('https'),
        transports: ['websocket', 'polling'],
        isRenderConnection,
        pingTimeout: isRenderConnection ? 60000 : 30000,
        reconnectionAttempts: isRenderConnection ? 15 : 10
      });
      
      setSocket(socketInstance);
      
      // Add Render-specific event listener for transport errors
      if (isRenderConnection) {
        socketInstance.io.engine.on('transport_error', (error) => {
          console.error('Transport error:', error);
          // Implement exponential backoff for reconnection
          let retryCount = 0;
          const maxRetries = 5;
          const baseDelay = 1000;
          
          const attemptReconnection = () => {
            if (retryCount < maxRetries) {
              const delay = Math.min(baseDelay * Math.pow(2, retryCount), 15000);
              console.log(`Attempting transport recovery after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                if (!socketInstance.connected) {
                  socketInstance.io.engine.close();
                  socketInstance.connect();
                  retryCount++;
                }
              }, delay);
            }
          };
          
          attemptReconnection();
        });
      }
      
      // Enhanced error handling
      socketInstance.io.on("error", (error) => {
        console.error("Socket.io manager error:", error);
        setConnectionError(`IO manager error: ${error.message}`);
        
        if (error.message.includes('timeout')) {
          console.log('Attempting to reconnect after timeout...');
          // Implement progressive delay for timeout reconnection
          let timeoutRetryCount = 0;
          const maxTimeoutRetries = 3;
          
          const attemptTimeoutRecovery = () => {
            if (timeoutRetryCount < maxTimeoutRetries && !socketInstance.connected) {
              const delay = 3000 * (timeoutRetryCount + 1);
              console.log(`Attempting timeout recovery in ${delay}ms (attempt ${timeoutRetryCount + 1}/${maxTimeoutRetries})`);
              setTimeout(() => {
                if (!socketInstance.connected) {
                  socketInstance.connect();
                  timeoutRetryCount++;
                }
              }, delay);
            }
          };
          
          attemptTimeoutRecovery();
        }
      });
      
      // Add connection quality monitoring
      let connectionQualityInterval;
      socketInstance.on('connect', () => {
        connectionQualityInterval = setInterval(() => {
          const start = Date.now();
          socketInstance.volatile.emit('ping_test', null, () => {
            const latency = Date.now() - start;
            console.log(`Current connection latency: ${latency}ms`);
            if (latency > 1000) {
              console.warn('High latency detected');
            }
          });
        }, 30000);
      });
      
      socketInstance.on('disconnect', () => {
        if (connectionQualityInterval) {
          clearInterval(connectionQualityInterval);
        }
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
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
      });
      
      // Force reconnect after delay if still disconnected
      if (error.message.includes('timeout')) {
        setTimeout(() => {
          if (socket && !socket.connected) {
            console.log('Forcing reconnection after timeout...');
            socket.connect();
          }
        }, 5000);
      }
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
    let user = { userId: 'guest', username: 'Guest', coins: 0 };
    
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        user = { 
          ...parsedUser,
          userId: parsedUser.userId || parsedUser._id || parsedUser.id || 'guest',
          username: parsedUser.username || parsedUser.name || 'Guest',
          coins: parsedUser.coins || 0
        };
      } catch (e) {
        console.error("Error parsing user data from localStorage:", e);
      }
    }
    
    return user;
  };
  
  // Join the matchmaking queue
  const joinMatchmaking = (gameType) => {
    if (!socket || !isConnected) {
      setConnectionError('Not connected to multiplayer server');
      return;
    }
    
    // Force refresh user data before joining
    const user = getUserInfo();
    console.log("Joining matchmaking with user:", user);
    
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
  
  // Add a new function to handle manual reconnection
  const reconnectToServer = () => {
    if (socket) {
      console.log('Manual reconnection attempt...');
      // First close any existing connection
      socket.close();
      // Attempt to reconnect
      setTimeout(() => {
        socket.connect();
      }, 1000);
      
      setConnectionError('Attempting to reconnect...');
      return true;
    }
    return false;
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
    sendChatMessage,
    reconnectToServer
  };
  
  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}; 