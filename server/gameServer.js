const { Server } = require('socket.io');
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));
const server = http.createServer(app);

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
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    connectTimeout: 45000,
    allowUpgrades: true,
    maxHttpBufferSize: 1e8,
    path: '/socket.io/',
    // Add additional options for websocket stability
    upgradeTimeout: 30000,
    rememberUpgrade: true,
    // Add explicit websocket config
    wsEngine: 'ws',
    // Reduce compression overhead for better performance
    perMessageDeflate: {
        threshold: 1024,
        zlibDeflateOptions: {
            chunkSize: 1024,
            level: 3
        }
    }
});

// Add error handlers for better debugging
io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err);
});

io.engine.on('pollError', (err) => {
    console.error('Socket.IO polling error:', err);
});

io.engine.on('upgradeError', (err) => {
    console.error('Socket.IO upgrade error:', err);
});

// Store active games
const activeGames = new Map();

// Game matchmaking queues
const queues = {
    chess: [],
    rps: []
};

// Store player session information for recovery
const playerSessions = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Log transport info
    console.log(`Client ${socket.id} using transport: ${socket.conn.transport.name}`);
    
    // Monitor transport changes
    socket.conn.on('upgrade', (transport) => {
        console.log(`Client ${socket.id} upgraded transport to: ${transport.name}`);
    });
    
    // Track transport-specific errors
    socket.conn.transport.on('error', (error) => {
        console.error(`Transport error for client ${socket.id}:`, error.message);
    });
    
    // Handle websocket-specific diagnostics
    socket.on('transport_diagnostic', (callback) => {
        if (typeof callback === 'function') {
            callback({
                transport: socket.conn.transport.name,
                socketId: socket.id,
                timestamp: Date.now(),
                serverUptime: process.uptime(),
                activeConnections: io.engine.clientsCount
            });
        }
    });
    
    // Handle ping/pong for connection health monitoring
    socket.on('ping', (data) => {
        if (data && data.timestamp) {
            socket.emit('pong', data);
        }
    });
    
    // Handle session recovery
    socket.on('recover_session', ({ userId, gameId }) => {
        console.log(`User ${userId} attempting to recover session for game ${gameId}`);
        
        // Check if this user had an active game
        if (playerSessions.has(userId)) {
            const sessionData = playerSessions.get(userId);
            const game = activeGames.get(sessionData.gameId);
            
            if (game) {
                // Update player's socket
                const playerIndex = game.players.findIndex(p => p.userId === userId);
                if (playerIndex !== -1) {
                    // Update socket reference
                    const oldSocketId = game.players[playerIndex].socket.id;
                    game.players[playerIndex].socket = socket;
                    
                    console.log(`Updated socket for player ${userId} from ${oldSocketId} to ${socket.id}`);
                    
                    // Let player join the game room
                    socket.join(gameId);
                    
                    // Notify player with current game state
                    socket.emit('gameState', game);
                    
                    return;
                }
            }
        }
        
        // If recovery failed
        socket.emit('recovery_failed', { message: 'Could not recover game session' });
    });

    socket.on('joinGame', ({ gameType, userId, username }) => {
        console.log(`${username} (${userId}) wants to join ${gameType}`);
        
        // Store player session info
        playerSessions.set(userId, {
            socketId: socket.id,
            username,
            lastActive: Date.now()
        });
        
        // Add player to queue
        queues[gameType].push({ socket, userId, username });
        
        // Check if we can start a game
        if (queues[gameType].length >= 2) {
            const player1 = queues[gameType].shift();
            const player2 = queues[gameType].shift();
            
            // Create game
            const gameId = Math.random().toString(36).substring(7);
            const game = {
                id: gameId,
                type: gameType,
                players: [
                    { userId: player1.userId, username: player1.username, color: 'white', socket: player1.socket },
                    { userId: player2.userId, username: player2.username, color: 'black', socket: player2.socket }
                ],
                currentPlayer: 'white',
                board: gameType === 'chess' ? createInitialChessBoard() : null,
                choices: gameType === 'rps' ? {} : null,
                startTime: Date.now(),
                lastActivityTime: Date.now()
            };
            
            activeGames.set(gameId, game);
            
            // Update player session info
            playerSessions.set(player1.userId, { socketId: player1.socket.id, gameId, username: player1.username, lastActive: Date.now() });
            playerSessions.set(player2.userId, { socketId: player2.socket.id, gameId, username: player2.username, lastActive: Date.now() });
            
            // Join both players to game room
            player1.socket.join(gameId);
            player2.socket.join(gameId);
            
            // Notify players without sending socket objects
            const gameCopy = {
                id: game.id,
                type: game.type,
                players: game.players.map(p => ({ userId: p.userId, username: p.username, color: p.color })),
                currentPlayer: game.currentPlayer,
                board: game.board,
                choices: game.choices
            };
            
            io.to(gameId).emit('gameState', gameCopy);
        }
    });

    socket.on('makeMove', ({ gameId, move }) => {
        const game = activeGames.get(gameId);
        if (!game) return;

        // Update last activity time
        game.lastActivityTime = Date.now();

        if (game.type === 'chess') {
            handleChessMove(game, move);
        } else if (game.type === 'rps') {
            handleRPSMove(game, move);
        }

        // Update game state
        activeGames.set(gameId, game);
        
        // Create a copy without socket objects for sending
        const gameCopy = {
            id: game.id,
            type: game.type,
            players: game.players.map(p => ({ userId: p.userId, username: p.username, color: p.color })),
            currentPlayer: game.currentPlayer,
            board: game.board,
            choices: game.choices
        };
        
        io.to(gameId).emit('gameState', gameCopy);
    });

    socket.on('leaveGame', ({ gameId }) => {
        const game = activeGames.get(gameId);
        if (game) {
            // Find player who's leaving
            const leavingPlayer = game.players.find(p => p.socket.id === socket.id);
            if (leavingPlayer) {
                // Remove from player sessions
                playerSessions.delete(leavingPlayer.userId);
            }
            
            io.to(gameId).emit('playerLeft', { gameId });
            activeGames.delete(gameId);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Store disconnect time to allow for reconnect window
        socket.disconnectTime = Date.now();
        
        // We'll only clean up queues immediately, but wait for reconnect before removing from games
        for (const [gameType, queue] of Object.entries(queues)) {
            queues[gameType] = queue.filter(player => player.socket.id !== socket.id);
        }
        
        // For games, we'll have a grace period for reconnection
        setTimeout(() => {
            cleanupDisconnectedPlayer(socket.id);
        }, 30000); // 30 second grace period
    });
});

// Helper function to cleanup disconnected player after grace period
function cleanupDisconnectedPlayer(socketId) {
    // Check all active games
    for (const [gameId, game] of activeGames.entries()) {
        const disconnectedPlayerIndex = game.players.findIndex(player => player.socket.id === socketId);
        
        if (disconnectedPlayerIndex !== -1) {
            // Check if the socket is still disconnected
            if (!io.sockets.sockets.has(socketId)) {
                const disconnectedPlayer = game.players[disconnectedPlayerIndex];
                
                // Notify other players
                game.players.forEach((player, index) => {
                    if (index !== disconnectedPlayerIndex && player.socket) {
                        player.socket.emit('opponentDisconnected', {
                            gameId,
                            userId: disconnectedPlayer.userId
                        });
                    }
                });
                
                // Remove game if active
                activeGames.delete(gameId);
                
                // Remove from player sessions
                if (disconnectedPlayer.userId) {
                    playerSessions.delete(disconnectedPlayer.userId);
                }
            }
        }
    }
}

function handleChessMove(game, move) {
    const { from, to, piece } = move;
    if (!game.board) return;
    
    // Update board
    game.board[to.row][to.col] = piece;
    game.board[from.row][from.col] = '';
    
    // Switch turns
    game.currentPlayer = game.currentPlayer === 'white' ? 'black' : 'white';
}

function handleRPSMove(game, move) {
    const { choice, userId } = move;
    if (!game.choices) game.choices = {};
    
    game.choices[userId] = choice;
    
    // If both players have made their choices, determine winner
    if (Object.keys(game.choices).length === 2) {
        const [player1, player2] = game.players;
        const choice1 = game.choices[player1.userId];
        const choice2 = game.choices[player2.userId];
        
        game.result = determineRPSWinner(choice1, choice2);
    }
}

function determineRPSWinner(choice1, choice2) {
    if (choice1 === choice2) return { draw: true };
    
    const winningMoves = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper'
    };
    
    return choice2 === winningMoves[choice1] ? 'player1' : 'player2';
}

function createInitialChessBoard() {
    // Return your initial chess board configuration
    return Array(8).fill(null).map(() => Array(8).fill(''));
}

// Clean up inactive games periodically
setInterval(() => {
    const now = Date.now();
    for (const [gameId, game] of activeGames.entries()) {
        // Remove games inactive for more than 1 hour
        if (now - game.lastActivityTime > 3600000) {
            console.log(`Removing inactive game ${gameId}`);
            activeGames.delete(gameId);
            
            // Notify players if still connected
            game.players.forEach(player => {
                if (player.socket && io.sockets.sockets.has(player.socket.id)) {
                    player.socket.emit('gameExpired', { gameId });
                }
                
                // Clear player session
                if (player.userId) {
                    playerSessions.delete(player.userId);
                }
            });
        }
    }
}, 300000); // Check every 5 minutes

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
}); 