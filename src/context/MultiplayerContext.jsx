import React, { createContext, useContext, useState, useEffect } from 'react';
import { multiplayerService } from '../services/multiplayerGameService';

const MultiplayerContext = createContext();

export const useMultiplayer = () => {
    const context = useContext(MultiplayerContext);
    if (!context) {
        throw new Error('useMultiplayer must be used within a MultiplayerProvider');
    }
    return context;
};

export const MultiplayerProvider = ({ children }) => {
    const [gameState, setGameState] = useState(null);
    const [currentGameId, setCurrentGameId] = useState(null);
    const [opponent, setOpponent] = useState(null);
    const [isWaiting, setIsWaiting] = useState(false);

    useEffect(() => {
        if (currentGameId) {
            multiplayerService.onGameState(currentGameId, (newState) => {
                setGameState(newState);
                if (newState.players && newState.players.length > 1) {
                    const userStr = localStorage.getItem('user');
                    const currentUser = userStr ? JSON.parse(userStr) : null;
                    const opponentPlayer = newState.players.find(p => p.userId !== currentUser?.uid);
                    setOpponent(opponentPlayer);
                    setIsWaiting(false);
                }
            });
        }

        return () => {
            if (currentGameId) {
                multiplayerService.removeGameStateListener(currentGameId);
            }
        };
    }, [currentGameId]);

    const joinGame = async (gameType) => {
        setIsWaiting(true);
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (!user) {
            throw new Error('User not found');
        }

        await multiplayerService.joinGame(gameType, user.uid);
    };

    const leaveGame = () => {
        if (currentGameId) {
            multiplayerService.leaveGame(currentGameId);
            setCurrentGameId(null);
            setGameState(null);
            setOpponent(null);
            setIsWaiting(false);
        }
    };

    const makeMove = (move) => {
        if (currentGameId) {
            multiplayerService.makeMove(currentGameId, move);
        }
    };

    const value = {
        gameState,
        currentGameId,
        opponent,
        isWaiting,
        joinGame,
        leaveGame,
        makeMove,
        setCurrentGameId
    };

    return (
        <MultiplayerContext.Provider value={value}>
            {children}
        </MultiplayerContext.Provider>
    );
}; 