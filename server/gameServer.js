const { Server } = require('socket.io');
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Store active games
const activeGames = new Map();

// Game matchmaking queues
const queues = {
    chess: [],
    rps: []
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', ({ gameType, userId, username }) => {
        console.log(`${username} (${userId}) wants to join ${gameType}`);
        
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
                    { userId: player1.userId, username: player1.username, color: 'white' },
                    { userId: player2.userId, username: player2.username, color: 'black' }
                ],
                currentPlayer: 'white',
                board: gameType === 'chess' ? createInitialChessBoard() : null,
                choices: gameType === 'rps' ? {} : null
            };
            
            activeGames.set(gameId, game);
            
            // Join both players to game room
            player1.socket.join(gameId);
            player2.socket.join(gameId);
            
            // Notify players
            io.to(gameId).emit('gameState', game);
        }
    });

    socket.on('makeMove', ({ gameId, move }) => {
        const game = activeGames.get(gameId);
        if (!game) return;

        if (game.type === 'chess') {
            handleChessMove(game, move);
        } else if (game.type === 'rps') {
            handleRPSMove(game, move);
        }

        // Update game state
        activeGames.set(gameId, game);
        io.to(gameId).emit('gameState', game);
    });

    socket.on('leaveGame', ({ gameId }) => {
        const game = activeGames.get(gameId);
        if (game) {
            io.to(gameId).emit('playerLeft', { gameId });
            activeGames.delete(gameId);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clean up any games/queues this socket was in
        for (const [gameType, queue] of Object.entries(queues)) {
            queues[gameType] = queue.filter(player => player.socket.id !== socket.id);
        }
    });
});

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
}); 