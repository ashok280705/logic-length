import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import http from 'http';

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

// Console log for debugging
console.log('Server loaded, Socket.io Server available:', !!Server);

dotenv.config();

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
  pingTimeout: 60000, // Increased to 60 seconds
  pingInterval: 25000, // Keep ping interval at 25 seconds
  transports: ['websocket', 'polling'], // Support both WebSocket and polling
  connectTimeout: 45000, // Increased connection timeout
  allowUpgrades: true,
  maxHttpBufferSize: 1e8,
  path: '/socket.io/',
  // Add new configurations for better reliability
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  // Enable compression
  perMessageDeflate: {
    threshold: 2048 // Only compress data above 2KB
  },
  // Connection stabilization
  upgradeTimeout: 30000,
  rememberUpgrade: true,
  // Error handling
  forceNew: true,
  autoConnect: true
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: false
  }));
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
  const activeGames = new Map();
  const waitingPlayers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected with ID:', socket.id);
    
    // Enhanced connection logging
    console.log('Connection details:', {
      transport: socket.conn.transport.name,
      remoteAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      time: new Date().toISOString()
    });
    
    // Improved heartbeat mechanism
    let missedHeartbeats = 0;
    const maxMissedHeartbeats = 3;
    
    const heartbeat = setInterval(() => {
      socket.volatile.emit('ping', { timestamp: Date.now() });
    }, 25000);
    
    socket.on('pong', () => {
      missedHeartbeats = 0; // Reset on pong received
    });
    
    // Check for missed heartbeats
    const heartbeatCheck = setInterval(() => {
      missedHeartbeats++;
      if (missedHeartbeats >= maxMissedHeartbeats) {
        console.log(`Client ${socket.id} missed too many heartbeats, disconnecting...`);
        socket.disconnect(true);
      }
    }, 30000);
    
    // Enhanced error handling
    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error:`, error);
      // Attempt to reconnect on error
      if (socket.connected) {
        socket.disconnect().connect();
      }
    });
    
    // Clean disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected. Reason: ${reason}`);
      clearInterval(heartbeat);
      clearInterval(heartbeatCheck);
      handlePlayerDisconnect(socket.id);
      
      // Attempt to reconnect on certain disconnect reasons
      if (reason === 'transport close' || reason === 'ping timeout') {
        console.log(`Attempting to reconnect client ${socket.id}...`);
        socket.connect();
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
    case 'chess':
      const pieces = {
        Pawn: "♙", Knight: "♘", Bishop: "♗", Rook: "♖", Queen: "♕", King: "♔",
        pawn: "♟", knight: "♞", bishop: "♝", rook: "♜", queen: "♛", king: "♚"
      };
      
      return {
        board: [
          [pieces.rook, pieces.knight, pieces.bishop, pieces.queen, pieces.king, pieces.bishop, pieces.knight, pieces.rook],
          [pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn, pieces.pawn],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          [pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn, pieces.Pawn],
          [pieces.Rook, pieces.Knight, pieces.Bishop, pieces.Queen, pieces.King, pieces.Bishop, pieces.Knight, pieces.Rook]
        ],
        moveHistory: []
      };
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
    case 'chess':
      // Create a copy of the board
      const newChessBoard = state.board.map(row => [...row]);
      
      // Apply the move
      newChessBoard[move.to[0]][move.to[1]] = move.piece;
      newChessBoard[move.from[0]][move.from[1]] = "";
      
      // Add to move history
      const moveHistory = [...(state.moveHistory || []), move];
      
      return {
        ...state,
        board: newChessBoard,
        moveHistory: moveHistory,
        lastMove: move
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
    case 'chess':
      // In a real implementation, we would check for checkmate, stalemate, etc.
      // For now, let's just use a simplified check for kings
      
      // Check if both kings are still on the board
      let whiteKingFound = false;
      let blackKingFound = false;
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = state.board[row][col];
          if (piece === "♔") whiteKingFound = true;
          if (piece === "♚") blackKingFound = true;
        }
      }
      
      if (!whiteKingFound) {
        return {
          gameOver: true,
          winner: 'black'
        };
      }
      
      if (!blackKingFound) {
        return {
          gameOver: true,
          winner: 'white'
        };
      }
      
      // If move history has 50+ moves (25 per player), declare a draw
      // This is simplified, real chess has more complex draw rules
      if (state.moveHistory && state.moveHistory.length >= 50) {
        return {
          gameOver: true,
          draw: true,
          reason: 'Game drawn due to move limit'
        };
      }
      
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