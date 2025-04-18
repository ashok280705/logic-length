import React, { useState, useEffect } from 'react';
import { useMultiplayer } from './MultiplayerContext';

const ConnectionDiagnostic = () => {
  const { 
    socket, 
    isConnected, 
    connectionError, 
    reconnectToServer,
    pingServer,
    connectionStatus,
    switchTransport
  } = useMultiplayer();
  
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [serverDiagnostics, setServerDiagnostics] = useState(null);
  
  // Get the current connection status when needed
  const refreshStatus = () => {
    setDiagnosticInfo({
      timestamp: new Date().toISOString(),
      status: connectionStatus(),
      userAgent: navigator.userAgent,
      networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
      online: navigator.onLine,
      url: window.location.href,
      // Add error message parsing
      errorDetails: connectionError ? parseConnectionError(connectionError) : null
    });
  };
  
  // Parse error message to extract useful information
  const parseConnectionError = (errorMessage) => {
    if (errorMessage.includes('xhr poll error')) {
      return {
        type: 'xhr_poll',
        details: 'XHR polling transport failed - likely a CORS or network issue',
        suggestions: [
          'Try the "Use Polling" button',
          'Check network connectivity',
          'Verify server is running'
        ]
      };
    } else if (errorMessage.includes('websocket error')) {
      return {
        type: 'websocket',
        details: 'WebSocket connection failed',
        suggestions: [
          'Try the "Use Polling" button',
          'Check for proxy/firewall blocking WebSockets'
        ]
      };
    } else if (errorMessage.includes('timeout')) {
      return {
        type: 'timeout',
        details: 'Connection timeout - server not responding in time',
        suggestions: [
          'Check server status',
          'Try reconnecting'
        ]
      };
    }
    
    return {
      type: 'unknown',
      details: errorMessage
    };
  };
  
  // Add function to run network diagnostics
  const runNetworkDiagnostics = async () => {
    try {
      // Test ping to server
      const pingStart = Date.now();
      pingServer();
      
      // Try a simple fetch to the server root path
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';
      const fetchResult = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const fetchResponse = await fetchResult.json();
      const fetchTime = Date.now() - pingStart;
      
      setDiagnosticInfo(prev => ({
        ...prev,
        networkDiagnostics: {
          status: fetchResult.status,
          time: `${fetchTime}ms`,
          response: fetchResponse
        }
      }));
      
    } catch (error) {
      setDiagnosticInfo(prev => ({
        ...prev,
        networkDiagnostics: {
          error: error.message,
          suggestions: [
            'Server may be down',
            'CORS may be blocking requests',
            'Network connection may be interrupted'
          ]
        }
      }));
    }
  };
  
  // Query the server for diagnostics
  const runServerDiagnostic = () => {
    if (socket && socket.connected) {
      socket.emit('connection_diagnostic', (data) => {
        setServerDiagnostics(data);
      });
    } else {
      setServerDiagnostics({ error: 'Socket not connected, cannot query server' });
    }
  };
  
  // Initial status check
  useEffect(() => {
    refreshStatus();
  }, [isConnected, connectionError]);
  
  // Determine connection status color
  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (connectionError) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="p-3 border rounded shadow-sm bg-white text-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Connection Status</h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {connectionError && (
        <div className="p-2 mb-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
          {connectionError}
          
          {/* Add suggestions if we have error details */}
          {diagnosticInfo?.errorDetails && (
            <div className="mt-1 text-xs">
              <p className="font-semibold">{diagnosticInfo.errorDetails.details}</p>
              {diagnosticInfo.errorDetails.suggestions && (
                <ul className="list-disc pl-4 mt-1">
                  {diagnosticInfo.errorDetails.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-2 mb-3 flex-wrap">
        <button 
          onClick={reconnectToServer} 
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Reconnect
        </button>
        <button 
          onClick={() => switchTransport('polling')} 
          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          Use Polling
        </button>
        <button 
          onClick={() => switchTransport('websocket')} 
          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          Use WebSocket
        </button>
        <button 
          onClick={pingServer} 
          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          Ping
        </button>
        <button 
          onClick={runNetworkDiagnostics} 
          className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          Test Network
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={refreshStatus} 
          className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
        >
          Refresh Status
        </button>
        <button 
          onClick={runServerDiagnostic} 
          className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
        >
          Server Diagnostic
        </button>
        <button 
          onClick={() => setShowDetails(!showDetails)} 
          className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {showDetails && diagnosticInfo && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono">
          <div>Transport: {diagnosticInfo.status.connected ? diagnosticInfo.status.transport : 'N/A'}</div>
          <div>Socket ID: {diagnosticInfo.status.connected ? diagnosticInfo.status.id : 'N/A'}</div>
          <div>Network: {diagnosticInfo.networkType}</div>
          <div>Online: {diagnosticInfo.online ? 'Yes' : 'No'}</div>
          <div>Last Update: {diagnosticInfo.timestamp}</div>
        </div>
      )}
      
      {showDetails && serverDiagnostics && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs font-mono">
          <div className="font-bold">Server Info:</div>
          {serverDiagnostics.error ? (
            <div className="text-red-500">{serverDiagnostics.error}</div>
          ) : (
            <>
              <div>Server Transport: {serverDiagnostics.transport}</div>
              <div>Active Connections: {serverDiagnostics.activeConnections}</div>
              <div>Server Uptime: {Math.floor(serverDiagnostics.serverUptime / 60)} minutes</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionDiagnostic; 