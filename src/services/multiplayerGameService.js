import { io } from 'socket.io-client';
import { getUserProfile } from './userService';

class MultiplayerGameService {
    constructor() {
        this.socket = io('http://localhost:3001');
        this.gameStateCallbacks = new Map();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('gameState', (gameState) => {
            const callback = this.gameStateCallbacks.get(gameState.gameId);
            if (callback) callback(gameState);
        });

        this.socket.on('playerJoined', (data) => {
            console.log('Player joined:', data);
        });

        this.socket.on('playerLeft', (data) => {
            console.log('Player left:', data);
        });

        this.socket.on('gameOver', (data) => {
            console.log('Game over:', data);
        });
    }

    async joinGame(gameType, userId) {
        const userProfile = await getUserProfile(userId);
        this.socket.emit('joinGame', {
            gameType,
            userId,
            username: userProfile.username || userProfile.email
        });
    }

    leaveGame(gameId) {
        this.socket.emit('leaveGame', { gameId });
    }

    makeMove(gameId, move) {
        this.socket.emit('makeMove', { gameId, move });
    }

    onGameState(gameId, callback) {
        this.gameStateCallbacks.set(gameId, callback);
    }

    removeGameStateListener(gameId) {
        this.gameStateCallbacks.delete(gameId);
    }

    // Chess specific methods
    makeChessMove(gameId, from, to) {
        this.socket.emit('makeMove', {
            gameId,
            move: { type: 'chess', from, to }
        });
    }

    // Rock Paper Scissors specific methods
    makeRPSChoice(gameId, choice) {
        this.socket.emit('makeMove', {
            gameId,
            move: { type: 'rps', choice }
        });
    }
}

export const multiplayerService = new MultiplayerGameService(); 