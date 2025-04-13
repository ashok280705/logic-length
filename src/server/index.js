import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from '../config/db.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'], // Your frontend URLs
  credentials: true
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

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

// Socket.io connection and events
const activeGames = new Map(); // Store active games by room ID
const waitingPlayers = new Map(); // Store players waiting for a match

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
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
  
  // When a player disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from waiting players if applicable
    if (waitingPlayers.has(socket.id)) {
      waitingPlayers.delete(socket.id);
    }
    
    // Handle leaving any active games
    for (const [roomId, game] of activeGames.entries()) {
      if (game.players.some(p => p.socketId === socket.id)) {
        handlePlayerLeave(socket, roomId);
        break;
      }
    }
  });
});

// Helper function to handle a player leaving a game
function handlePlayerLeave(socket, roomId) {
  const game = activeGames.get(roomId);
  
  if (!game) return;
  
  // Find the player who's leaving
  const leavingPlayer = game.players.find(p => p.socketId === socket.id);
  const stayingPlayer = game.players.find(p => p.socketId !== socket.id);
  
  if (leavingPlayer && stayingPlayer) {
    // Notify the other player that their opponent left
    io.to(stayingPlayer.socketId).emit('opponent_left', {
      gameType: game.gameType,
      winByDefault: true
    });
    
    // Maybe update stats in the database here
    
    // Remove the game
    activeGames.delete(roomId);
  }
}

// Helper functions for game logic
function initializeGameState(gameType) {
  switch (gameType) {
    case 'tictactoe':
      return {
        board: Array(9).fill(null),
        moves: 0
      };
    case 'chess':
      return {
        // Initialize chess board state here
        board: 'initial',
        moves: []
      };
    case 'mines':
      return {
        // Initialize mines game here
        board: Array(100).fill(false),
        mines: []
      };
    default:
      return {};
  }
}

function processGameMove(gameType, state, move) {
  // Clone state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state));
  
  switch (gameType) {
    case 'tictactoe': {
      // Handle tic-tac-toe move
      const { position, symbol } = move;
      if (newState.board[position] === null) {
        newState.board[position] = symbol;
        newState.moves++;
      }
      return newState;
    }
    case 'chess': {
      // Handle chess move
      newState.moves.push(move);
      newState.board = 'updated'; // You would update the actual board state here
      return newState;
    }
    case 'mines': {
      // Handle mines game move
      return newState;
    }
    default:
      return state;
  }
}

function checkGameResult(gameType, state) {
  switch (gameType) {
    case 'tictactoe': {
      // Check for tic-tac-toe win or draw
      const { board } = state;
      
      // Win patterns: rows, columns, diagonals
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
      ];
      
      for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return {
            gameOver: true,
            winner: board[a],
            winningLine: line
          };
        }
      }
      
      // Check for draw
      if (state.moves === 9) {
        return {
          gameOver: true,
          draw: true
        };
      }
      
      return { gameOver: false };
    }
    case 'chess':
      // Implement chess win/draw detection
      return { gameOver: false };
    case 'mines':
      // Implement mines game win/loss detection
      return { gameOver: false };
    default:
      return { gameOver: false };
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

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io listening for connections`);
}); 