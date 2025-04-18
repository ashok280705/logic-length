import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import http from 'http';
import { setupSocketProxy } from './middleware/socketProxy.js';

// First try to use the global SocketIO
let Server;
if (global.SocketIO) {
  console.log('Using global SocketIO');
  Server = global.SocketIO.Server;
} else {
  // If global is not available, try direct import 
  try {
    console.log('Trying direct import of socket.io');
    // Use dynamic import for ESM compatibility
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const socketIO = require('socket.io');
    Server = socketIO.Server;
    console.log('Socket.io loaded via require');
  } catch (error) {
    console.error('Failed to load socket.io:', error);
    // Create a dummy Server class for graceful fallback
    Server = class DummyServer {
      constructor() {
        console.warn('Using dummy Socket.io server - no real-time functionality will be available');
        this.sockets = { sockets: new Map() };
      }
      on() { console.warn('Dummy socket.io - on() called'); }
      emit() { console.warn('Dummy socket.io - emit() called'); }
      to() { return { emit: () => {} }; }
    };
  }
}

// Import route modules but remove MongoDB dependency
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import fallbackRoutes from './routes/fallback.js';

// Console log for debugging
console.log('Server loaded, Socket.io Server available:', !!Server);
console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? '✓ Present' : '✗ Missing'
});

const app = express();
const server = http.createServer(app);

// Add this section for Render specific configuration
// Check if we're on Render platform
const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL;
console.log('Running on Render:', isRender);

if (isRender) {
  // Set keepAliveTimeout higher than Render's load balancer timeout
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // slightly more than keepAliveTimeout
  console.log('Set server timeouts for Render platform');
}

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.RENDER_EXTERNAL_URL || "https://logiclen.vercel.app", "https://logiclen.vercel.app"] 
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000, // Increased from 30000 to 60000
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Allow both transports with websocket preferred
  connectTimeout: 45000, // Increased from 20000 to 45000
  allowUpgrades: true,
  maxHttpBufferSize: 1e8,
  path: '/socket.io/',
  // Added for better reconnection handling
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  // Add additional options for better websocket reliability
  upgradeTimeout: 30000, // Give more time for upgrades
  rememberUpgrade: true, // Remember successful transport upgrades
  perMessageDeflate: {
    threshold: 1024, // Only compress data above this size
    zlibDeflateOptions: {
      chunkSize: 1024,
      level: 3 // Lower compression level for speed
    }
  }
});

// Add a global error handler for Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err);
});

// Handle polling errors - these indicate transport issues
io.engine.on('pollError', (err) => {
  console.error('Socket.IO polling error:', err);
});

// Monitor websocket issues specifically
io.engine.on('upgradeError', (err) => {
  console.error('Socket.IO upgrade error:', err);
});

// Log all server-side socket errors
io.on('error', (err) => {
  console.error('Socket.IO server error:', err);
});

// Modified initialization with async IIFE - without MongoDB
(async function startServer() {
  try {
    console.log('Starting server with Firebase backend...');
    
    // Setup Express
    setupExpress();
    setupRoutes();
    startListening();
    setupSocketIO();
    
  } catch (error) {
    console.error(`Server initialization error:`, error.message);
    process.exit(1);
  }
})();

function setupExpress() {
  app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'X-Client-Version', 'If-None-Match', 'Pragma'],
    credentials: false,
    maxAge: 86400 // Cache CORS preflight requests for 24 hours
  }));
  
  // Add cache control headers for polling requests
  app.use((req, res, next) => {
    // Avoid caching for socket.io polling requests
    if (req.url.includes('/socket.io/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  
  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Install the Socket.IO proxy middleware
  setupSocketProxy(app);
  
  // Add error handling middleware
  app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  });
}

function setupRoutes() {
  // Add specific OPTIONS handler for socket.io requests
  app.options('/socket.io/*', cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'X-Client-Version', 'If-None-Match', 'Pragma'],
    credentials: true
  }));
  
  // Add specific handler for socket.io polling
  app.get('/socket.io/*', (req, res, next) => {
    // Log polling requests for debugging
    console.log('Socket.io polling request:', req.url);
    console.log('Socket.io polling headers:', req.headers);
    
    // Set headers for CORS and caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // If it's a preflight request, respond immediately
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });

  // Test route
  app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
  });
  
  // Simple health check route without MongoDB dependency
  app.get('/health', async (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      backend: 'Firebase'
    });
  });

  // API health check
  app.get('/api/health', async (req, res) => {
    res.json({ status: 'ok', service: 'logic-length-api' });
  });

  // Add a specific auth test endpoint for health checks
  app.get('/api/auth/test', (req, res) => {
    res.json({ message: 'Auth endpoint is accessible' });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/fallback', fallbackRoutes);
  
  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

function startListening() {
  const PORT = process.env.PORT || 5002;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.io listening for connections');
  });
}

// Socket.io setup function
function setupSocketIO() {
  // Socket.io connection and events
  const activeGames = new Map(); // Store active games by room ID
  const waitingPlayers = new Map(); // Store players waiting for a match

  io.on('connection', (socket) => {
    console.log('New client connected with ID:', socket.id);
    
    // Log connection details for debugging
    console.log('Connection details:', {
      transport: socket.conn.transport.name,
      remoteAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      time: new Date().toISOString()
    });
    
    // Log transport changes to help debug websocket issues
    socket.conn.on('upgrade', (transport) => {
      console.log(`Client ${socket.id} upgraded transport to: ${transport.name}`);
    });
    
    // Log any socket warnings (often precedes errors)
    socket.conn.on('warn', (warning) => {
      console.warn(`Client ${socket.id} warning:`, warning);
    });
    
    // Track transport errors specifically
    socket.conn.transport.on('error', (error) => {
      console.error(`Transport error for client ${socket.id}:`, error.message);
    });
    
    // Set up heartbeat to detect disconnects earlier
    const heartbeat = setInterval(() => {
      socket.volatile.emit('ping', { timestamp: Date.now() });
    }, 25000);
    
    // Handle pong response to confirm connection is still alive
    socket.on('pong', (data) => {
      console.log(`Received pong from ${socket.id}, latency: ${Date.now() - data.timestamp}ms`);
    });
    
    // Add transport diagnostic endpoint
    socket.on('connection_diagnostic', (callback) => {
      // Gather transport information
      const diagnosticInfo = {
        socketId: socket.id,
        connected: socket.connected,
        transport: socket.conn.transport.name,
        address: socket.handshake.address,
        timestamp: Date.now(),
        server: {
          uptime: process.uptime(),
          activeConnections: io.engine.clientsCount,
          memoryUsage: process.memoryUsage(),
          transportSupport: io.engine.opts.transports
        }
      };
      
      // Send diagnostic info back to client
      callback(diagnosticInfo);
    });
    
    // Improved disconnection handling with more detailed logging
    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected. Reason: ${reason}`);
      clearInterval(heartbeat);
      
      // Store disconnection info with timestamp for reconnection handling
      socket.disconnectTime = Date.now();
      socket.disconnectReason = reason;
      
      // Only clean up resources if it's a permanent disconnect
      if (reason === 'transport close' || reason === 'ping timeout') {
        // Wait a short period before cleanup to allow for quick reconnections
        setTimeout(() => {
          // Only proceed with cleanup if socket hasn't reconnected
          if (!io.sockets.sockets.has(socket.id)) {
            handlePlayerDisconnect(socket.id);
          }
        }, 10000); // Wait 10 seconds before cleanup
      } else {
        // For other disconnect reasons, clean up immediately
        handlePlayerDisconnect(socket.id);
      }
    });
    
    // Enhanced reconnection handling
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Client ${socket.id} reconnection attempt #${attemptNumber}`);
    });
    
    socket.on('reconnect', () => {
      console.log(`Client ${socket.id} reconnected successfully`);
      
      // Allow the client to recover their game session
      socket.emit('reconnect_success', { 
        socketId: socket.id,
        timestamp: Date.now()
      });
    });
    
    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error: ${error.message}`);
    });
    
    // Add recovery mechanism for clients
    socket.on('recover_session', (data) => {
      const { userId, gameRoomId } = data;
      console.log(`User ${userId} attempting to recover session in room ${gameRoomId}`);
      
      // Check if the game still exists
      const game = activeGames.get(gameRoomId);
      if (game) {
        // Find the player in the game
        const playerIndex = game.players.findIndex(p => p.userId === userId);
        if (playerIndex !== -1) {
          // Update the player's socket ID
          game.players[playerIndex].socketId = socket.id;
          
          // Rejoin the room
          socket.join(gameRoomId);
          
          // Send the current game state
          socket.emit('game_recovered', {
            roomId: gameRoomId,
            gameType: game.gameType,
            state: game.state,
            players: game.players.map(p => ({ userId: p.userId, username: p.username })),
            currentTurn: game.currentTurn
          });
          
          console.log(`Session recovered for user ${userId} in room ${gameRoomId}`);
        }
      }
    });
    
    // When a user joins the matchmaking queue
    socket.on('join_matchmaking', (userData) => {
      const { gameType, userId, username } = userData;
      console.log(`${username} (${userId}) joined matchmaking for ${gameType}`);
      
      // Store the player in the waiting list with their game preference
      waitingPlayers.set(socket.id, {
        userId,
        username,
        gameType,
        socketId: socket.id,
        joinedAt: Date.now()
      });
      
      // Check if there's another player waiting for the same game type
      const players = Array.from(waitingPlayers.values())
        .filter(player => player.gameType === gameType && player.socketId !== socket.id);
      
      if (players.length > 0) {
        // Take the player who's been waiting the longest
        const opponent = players.sort((a, b) => a.joinedAt - b.joinedAt)[0];
        
        // Create a new game room
        const roomId = `game_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Remove both players from waiting list
        waitingPlayers.delete(socket.id);
        waitingPlayers.delete(opponent.socketId);
        
        // Add players to the room
        socket.join(roomId);
        io.sockets.sockets.get(opponent.socketId)?.join(roomId);
        
        // Initialize game state
        const gameState = initializeGameState(gameType);
        activeGames.set(roomId, {
          gameType,
          players: [
            { userId, username, socketId: socket.id },
            { userId: opponent.userId, username: opponent.username, socketId: opponent.socketId }
          ],
          state: gameState,
          currentTurn: Math.random() < 0.5 ? socket.id : opponent.socketId, // Randomly choose who starts
          startTime: Date.now()
        });
        
        // Notify both players that a match has been found
        io.to(roomId).emit('match_found', {
          roomId,
          gameType,
          players: [
            { userId, username },
            { userId: opponent.userId, username: opponent.username }
          ],
          initialState: gameState,
          currentTurn: activeGames.get(roomId).currentTurn
        });
      }
    });
    
    // When a player makes a move
    socket.on('game_move', ({ roomId, move }) => {
      const game = activeGames.get(roomId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Check if it's the player's turn
      if (game.currentTurn !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }
      
      // Update game state based on the move
      const updatedState = processGameMove(game.gameType, game.state, move);
      
      // Check for win or draw
      const result = checkGameResult(game.gameType, updatedState);
      
      // Update the game state
      game.state = updatedState;
      
      // Switch turns if game is still ongoing
      if (!result.gameOver) {
        // Find other player's socket ID
        const otherPlayer = game.players.find(p => p.socketId !== socket.id);
        game.currentTurn = otherPlayer.socketId;
      }
      
      // Emit updated state to all players in the room
      io.to(roomId).emit('game_update', {
        state: updatedState,
        lastMove: move,
        currentTurn: game.currentTurn,
        result: result.gameOver ? result : null
      });
      
      // If game is over, clean up
      if (result.gameOver) {
        // Maybe store the result in the database here
        setTimeout(() => {
          activeGames.delete(roomId);
        }, 30000); // Delete game data after 30 seconds
      }
    });
    
    // When a player cancels matchmaking
    socket.on('cancel_matchmaking', () => {
      if (waitingPlayers.has(socket.id)) {
        waitingPlayers.delete(socket.id);
        console.log(`User ${socket.id} cancelled matchmaking`);
      }
    });
    
    // When a player leaves a game
    socket.on('leave_game', ({ roomId }) => {
      handlePlayerLeave(socket, roomId);
    });
  });
}

// Helper function for handlePlayerDisconnect
function handlePlayerDisconnect(socketId) {
  // Remove from waiting players if applicable
  if (waitingPlayers.has(socketId)) {
    waitingPlayers.delete(socketId);
  }
  
  // Handle leaving any active games
  for (const [roomId, game] of activeGames.entries()) {
    if (game.players.some(p => p.socketId === socketId)) {
      handlePlayerLeave(socketId, roomId);
      break;
    }
  }
}

// Helper function for handling player leaving a game
function handlePlayerLeave(socketId, roomId) {
  const game = activeGames.get(roomId);
  
  if (!game) return;
  
  const leavingPlayer = game.players.find(p => p.socketId === socketId);
  const remainingPlayer = game.players.find(p => p.socketId !== socketId);
  
  if (!leavingPlayer || !remainingPlayer) return;
  
  // Notify the remaining player
  io.to(remainingPlayer.socketId).emit('opponent_left', {
    winByDefault: true
  });
  
  // Remove the game
  activeGames.delete(roomId);
}

// Helper function to initialize game state
function initializeGameState(gameType) {
  switch(gameType) {
    case 'tictactoe':
      return {
        board: Array(9).fill(null),
        moveCount: 0
      };
    // Add other game types as needed
    default:
      return {};
  }
}

// Process game move
function processGameMove(gameType, state, move) {
  switch(gameType) {
    case 'tictactoe':
      const newBoard = [...state.board];
      newBoard[move.position] = move.symbol;
      return {
        ...state,
        board: newBoard,
        moveCount: state.moveCount + 1
      };
    default:
      return state;
  }
}

// Check game result
function checkGameResult(gameType, state) {
  switch(gameType) {
    case 'tictactoe':
      // Check for win or draw in tic-tac-toe
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
      ];
      
      for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
          return {
            gameOver: true,
            winner: state.board[a],
            winningPattern: pattern
          };
        }
      }
      
      // Check for draw
      if (state.moveCount === 9) {
        return {
          gameOver: true,
          draw: true
        };
      }
      
      // Game is still ongoing
      return {
        gameOver: false
      };
    default:
      return {
        gameOver: false
      };
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
}); 