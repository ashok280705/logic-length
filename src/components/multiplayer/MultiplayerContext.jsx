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
    let socketInstance = null;
    const retryDelay = 2000; // Base retry delay
    let retryAttempts = 0;
    const maxRetries = 15; // Increased from 10 to 15
    
    const setupSocket = () => {
      // Clean up any existing connection
      if (socketInstance) {
        socketInstance.disconnect();
      }
      
      // Use environment variable for server URL or fallback to development URL
      let serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';
      console.log('Initial server URL:', serverUrl);
      
      // Check for potential URL format issues
      if (serverUrl.endsWith('/')) {
        serverUrl = serverUrl.slice(0, -1); // Remove trailing slash
      }
      
      // Ensure secure protocol on production
      if (window.location.protocol === 'https:' && serverUrl.startsWith('http:')) {
        serverUrl = serverUrl.replace('http:', 'https:');
        console.log('Updated to secure URL:', serverUrl);
      }
      
      // Check if we're connecting to Render
      const isRenderConnection = serverUrl.includes('onrender.com');
      console.log('Connecting to Render hosted server:', isRenderConnection);
      
      try {
        // Make sure the serverUrl is used exactly as provided from env
        socketInstance = io(serverUrl, {
          withCredentials: true,
          reconnectionAttempts: isRenderConnection ? 30 : 15, // Increased for Render
          reconnectionDelay: 1000,
          reconnectionDelayMax: isRenderConnection ? 15000 : 10000, // Increased for Render
          timeout: isRenderConnection ? 30000 : 10000, // Increased timeout for Render
          transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
          secure: serverUrl.startsWith('https'),
          path: '/socket.io/',
          autoConnect: true,
          forceNew: false, // Changed to false to avoid creating new connections unnecessarily
          reconnection: true,
          randomizationFactor: 0.5,
          pingTimeout: isRenderConnection ? 60000 : 45000, // Increased for Render
          pingInterval: isRenderConnection ? 25000 : 20000,
          // Additional options for XHR errors
          xhrHeaders: {
            'Cache-Control': 'no-cache',
            'pragma': 'no-cache',
            'expires': '0'
          },
          // Enhanced CORS handling
          cors: {
            origin: '*',
            methods: ['GET', 'POST', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization']
          },
          // Adding new options for better stability
          upgrade: true,
          rememberUpgrade: true,
          rejectUnauthorized: false,
          extraHeaders: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "client-version": "1.0.0" // Tag client version for troubleshooting
          }
        });
        
        setSocket(socketInstance);
        
        // Setup connection event handlers
        socketInstance.on('connect', () => {
          console.log('Connected to multiplayer server, socket ID:', socketInstance.id);
          setIsConnected(true);
          setConnectionError(null);
          retryAttempts = 0; // Reset retry counter on successful connection
          
          // Store session info
          localStorage.setItem('socketSessionId', socketInstance.id);
          
          // If we were in a game when reconnection happened, attempt to rejoin
          if (currentGame) {
            const gameId = currentGame.roomId;
            const userId = getUserInfo()?.userId;
            
            if (gameId && userId) {
              console.log(`Attempting to recover game session for room ${gameId}`);
              socketInstance.emit('recover_session', {
                userId,
                gameRoomId: gameId
              });
            }
          }
        });
        
        // Handle successful reconnection
        socketInstance.on('reconnect_success', (data) => {
          console.log('Reconnection successful:', data);
          
          // Notify user
          setGameMessages(prev => [...prev, {
            type: 'success',
            message: 'Connection restored!'
          }]);
        });
        
        // Handle game recovery response
        socketInstance.on('game_recovered', (gameData) => {
          console.log('Game session recovered:', gameData);
          
          // Restore game state
          setCurrentGame({
            roomId: gameData.roomId,
            gameType: gameData.gameType
          });
          
          setGameState(gameData.state);
          setOpponent(gameData.players.find(p => p.userId !== getUserInfo()?.userId));
          setIsMyTurn(gameData.currentTurn === socketInstance.id);
          
          // Notify user
          setGameMessages(prev => [...prev, {
            type: 'success',
            message: 'Game session recovered!'
          }]);
        });
        
        socketInstance.on('connect_error', (error) => {
          console.error('Connection error:', error);
          setConnectionError(`Connection error: ${error.message}`);
          setIsConnected(false);
          
          // Special handling for xhr poll errors
          if (error.message.includes('xhr poll error')) {
            console.error('XHR Poll Error detected, implementing recovery strategy...');
            
            // Log diagnostic information to help debug
            console.log('Browser info:', navigator.userAgent);
            console.log('Current URL:', window.location.href);
            console.log('Server URL:', serverUrl);
            console.log('Transport options:', socketInstance.io.opts.transports);
            
            // Set to polling only with additional parameters that might help
            socketInstance.io.opts.transports = ['polling'];
            socketInstance.io.opts.polling = {
              extraHeaders: {
                'Cache-Control': 'no-cache',
                'If-None-Match': Date.now().toString(),
                'X-Client-Version': '1.0'
              }
            };
            
            // Add a small delay and implement a forceful reconnect
            setTimeout(() => {
              // Force close and reconnect
              socketInstance.disconnect();
              
              setTimeout(() => {
                console.log('Attempting reconnection with modified transport options...');
                socketInstance.connect();
              }, 2000);
            }, 1000);
            
            // Notify user
            setGameMessages(prev => [...prev, {
              type: 'warning',
              message: 'Connection issue detected, attempting to recover...'
            }]);
            
            return; // Skip normal reconnect flow for this specific error
          }
          
          // Only retry if under max attempts
          if (retryAttempts < maxRetries) {
            const waitTime = retryDelay * Math.pow(1.5, retryAttempts);
            retryAttempts++;
            console.log(`Attempting reconnection ${retryAttempts}/${maxRetries} in ${waitTime}ms...`);
            
            setTimeout(() => {
              if (!socketInstance.connected) {
                console.log('Reconnecting...');
                socketInstance.connect();
              }
            }, waitTime);
          } else {
            console.error('Maximum reconnection attempts reached');
          }
        });
        
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
          
          // Special handling for websocket errors
          if (error.message.includes('websocket error')) {
            console.log('Websocket error detected, attempting to recover connection...');
            
            // Force transport to polling first, then try to upgrade later
            socketInstance.io.opts.transports = ['polling', 'websocket'];
            
            // Try immediate reconnect with polling transport
            if (!socketInstance.connected) {
              console.log('Reconnecting with polling transport...');
              
              // Close existing connection first
              socketInstance.disconnect();
              
              // Wait a moment before reconnecting to allow cleanup
              setTimeout(() => {
                socketInstance.connect();
              }, 1000);
              
              // Add a notification
              setGameMessages(prev => [...prev, {
                type: 'info',
                message: 'Reconnecting to server...'
              }]);
            }
          } else if (error.message.includes('timeout')) {
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
    };
    
    setupSocket();
    
    // Clean up on unmount
    return () => {
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('match_found');
        socket.off('game_update');
        socket.off('opponent_left');
        socket.off('game_over');
        socket.off('error');
        
        // Explicitly disconnect the socket
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
      console.log('Disconnected from multiplayer server, reason:', reason);
      setIsConnected(false);
      
      // If we were in a game when disconnection happened, handle it
      if (currentGame) {
        setGameMessages([...gameMessages, {
          type: 'error',
          message: 'You were disconnected from the server'
        }]);
      }
      
      // Try to reconnect if the disconnect was not intentional
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
        console.log('Attempting to reconnect after server disconnect...');
        setTimeout(() => {
          if (socket && !socket.connected) {
            console.log('Reconnecting after server-initiated disconnect...');
            socket.connect();
          }
        }, 2000);
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
      
      // Add error to game messages list
      setGameMessages(prev => [...prev, {
        type: 'error',
        message: data.message || 'An unknown error occurred'
      }]);
      
      // If it's a connection-related error, try to reconnect
      if (data.type === 'connection' && socket) {
        console.log('Attempting to reconnect after game error...');
        setTimeout(() => {
          if (!socket.connected) {
            socket.connect();
          }
        }, 3000);
      }
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
  
  // Enhanced reconnection method that handles session recovery
  const reconnectToServer = () => {
    if (socket) {
      console.log('Manually reconnecting to server...');
      
      // Store important game data before reconnecting
      const gameData = currentGame ? {
        roomId: currentGame.roomId,
        gameType: currentGame.gameType,
        state: gameState
      } : null;
      
      // If we've seen a websocket error, try with polling first
      if (connectionError && connectionError.includes('websocket error')) {
        switchTransport('polling');
      } else {
        // Otherwise just reconnect with existing settings
        socket.connect();
      }
      
      // Notify user
      setGameMessages(prev => [...prev, {
        type: 'info',
        message: 'Reconnecting to server...'
      }]);
      
      return true;
    }
    
    return false;
  };
  
  // Add ping function to monitor connection health
  const pingServer = () => {
    if (socket && socket.connected) {
      const startTime = Date.now();
      socket.volatile.emit('ping', { timestamp: startTime }, () => {
        const latency = Date.now() - startTime;
        console.log(`Current latency: ${latency}ms`);
        return latency;
      });
    }
    return null;
  };
  
  // Detect network changes and reconnect
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      if (socket && !socket.connected) {
        reconnectToServer();
      }
    };
    
    const handleOffline = () => {
      console.log('Network connection lost');
      setConnectionError('Network connection lost');
      setIsConnected(false);
    };
    
    // Set up event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket]);
  
  // Set up regular connection checking
  useEffect(() => {
    if (!socket) return;
    
    // Check connection health periodically
    const connectionHealthCheck = setInterval(() => {
      if (socket && !socket.connected && navigator.onLine) {
        console.log('Socket disconnected but network available, attempting reconnect');
        socket.connect();
      }
    }, 15000);
    
    return () => {
      clearInterval(connectionHealthCheck);
    };
  }, [socket]);
  
  // Add a regular websocket health check
  useEffect(() => {
    if (!socket) return;
    
    // Check websocket health regularly
    const websocketHealthCheck = setInterval(() => {
      if (socket.connected) {
        // Check the transport
        const currentTransport = socket.io.engine?.transport?.name;
        console.log(`Current transport: ${currentTransport}`);
        
        // If using polling for too long, try to upgrade to websocket
        if (currentTransport === 'polling') {
          const pollingStart = socket.io._pollingStartTime || Date.now();
          const pollingDuration = Date.now() - pollingStart;
          
          // If we've been on polling for more than 2 minutes, try to upgrade
          if (pollingDuration > 120000) {
            console.log('Been on polling transport too long, attempting to upgrade to websocket');
            socket.io._pollingStartTime = null; // Reset the timer
            
            // Try upgrading by disconnecting and reconnecting with websocket preference
            switchTransport('websocket');
          }
        } else if (currentTransport === 'websocket') {
          // If using websocket, store the time we started using it
          if (!socket.io._websocketStartTime) {
            socket.io._websocketStartTime = Date.now();
          }
        }
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(websocketHealthCheck);
    };
  }, [socket, connectionError]);
  
  // Add a function to explicitly switch transport if needed
  const switchTransport = (preferredTransport = 'polling') => {
    if (!socket) return false;
    
    try {
      console.log(`Manually switching transport to ${preferredTransport}`);
      
      // Disconnect first
      socket.disconnect();
      
      // Modify the transport options
      socket.io.opts.transports = preferredTransport === 'polling' 
        ? ['polling', 'websocket'] 
        : ['websocket', 'polling'];
      
      // Reconnect with new transport priority
      setTimeout(() => {
        socket.connect();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error switching transport:', error);
      return false;
    }
  };
  
  const connectionStatus = () => {
    if (!socket) return 'Not initialized';
    
    if (socket.connected) {
      return {
        connected: true,
        transport: socket.io.engine?.transport?.name || 'unknown',
        id: socket.id,
        attempts: socket.io.reconnectionAttempts || 0
      };
    } else {
      return {
        connected: false,
        reason: connectionError || 'Not connected',
        attempting: socket.io.reconnecting || false
      };
    }
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
    reconnectToServer,
    pingServer,
    connectionStatus,
    switchTransport
  };
  
  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}; 