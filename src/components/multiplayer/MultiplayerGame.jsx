import React, { useEffect, useState } from 'react';
import { useMultiplayer } from './MultiplayerContext';
import TicTacToeBoard from './games/TicTacToeBoard';
import './MultiplayerGame.css';

const MultiplayerGame = () => {
  const { 
    isConnected, 
    connectionError, 
    currentGame, 
    opponent, 
    gameState, 
    isMyTurn,
    gameResult,
    gameMessages,
    makeMove,
    leaveGame,
    reconnectToServer
  } = useMultiplayer();

  const [showConnectionWarning, setShowConnectionWarning] = useState(false);
  
  // Show connection warning if we've been disconnected for more than 5 seconds
  useEffect(() => {
    let warningTimer;
    if (!isConnected && currentGame) {
      warningTimer = setTimeout(() => {
        setShowConnectionWarning(true);
      }, 5000);
    } else {
      setShowConnectionWarning(false);
    }
    
    return () => {
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [isConnected, currentGame]);
  
  const handleReconnect = () => {
    setShowConnectionWarning(false);
    reconnectToServer();
  };

  // Show loading state if we don't have a game yet
  if (!currentGame) return <div className="loading">Waiting for game...</div>;
  
  // Choose the right game component based on game type
  const renderGameBoard = () => {
    switch (currentGame.gameType) {
      case 'tictactoe':
        return <TicTacToeBoard 
          board={gameState?.board || []} 
          onMove={makeMove} 
          isMyTurn={isMyTurn}
          gameOver={gameResult?.gameOver}
        />;
      default:
        return <div>Unsupported game type</div>;
    }
  };
  
  return (
    <div className="multiplayer-game">
      {/* Connection warning overlay */}
      {showConnectionWarning && (
        <div className="connection-warning">
          <div className="warning-content">
            <h3>Connection Issue</h3>
            <p>Lost connection to the game server. This may happen on Render's free tier.</p>
            <button onClick={handleReconnect} className="reconnect-button">
              Reconnect
            </button>
          </div>
        </div>
      )}
      
      <div className="game-header">
        <h2>Game: {currentGame.gameType}</h2>
        <div className="game-status">
          {connectionError && <p className="error">{connectionError}</p>}
          {!isConnected && <p className="warning">Disconnected from server</p>}
          {gameResult?.gameOver ? (
            <p className="result">{gameResult.draw ? "It's a draw!" : gameResult.winByDefault ? "Winner by forfeit!" : "Game over!"}</p>
          ) : (
            <p>{isMyTurn ? "Your turn" : "Opponent's turn"}</p>
          )}
        </div>
        {opponent && (
          <div className="opponent-info">
            <span>Playing against: <strong>{opponent.username}</strong></span>
          </div>
        )}
      </div>
      
      <div className="game-board-container">
        {renderGameBoard()}
      </div>
      
      <div className="game-messages">
        <h3>Game Log</h3>
        <div className="message-list">
          {gameMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.message}
            </div>
          ))}
        </div>
      </div>
      
      <div className="game-actions">
        <button onClick={leaveGame} className="leave-button">
          Leave Game
        </button>
        
        {!isConnected && (
          <button onClick={handleReconnect} className="reconnect-button">
            Reconnect to Server
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiplayerGame; 