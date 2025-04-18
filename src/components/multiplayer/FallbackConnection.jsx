import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useMultiplayer } from './MultiplayerContext';

/**
 * This component provides a last-resort fallback connection when 
 * normal Socket.IO connections fail with XHR poll errors.
 */
const FallbackConnection = () => {
  const { connectionError, reconnectToServer } = useMultiplayer();
  const [activated, setActivated] = useState(false);
  const [attempting, setAttempting] = useState(false);
  
  // Check if we should activate the fallback
  useEffect(() => {
    if (connectionError && 
        (connectionError.includes('xhr poll error') || connectionError.includes('websocket error')) && 
        !activated && 
        !attempting) {
      console.log('FallbackConnection: Detected connection issue, preparing fallback...');
      setAttempting(true);
    }
  }, [connectionError, activated, attempting]);
  
  // When attempting, try the fallback approach
  useEffect(() => {
    if (!attempting) return;
    
    const attemptFallback = async () => {
      try {
        console.log('FallbackConnection: Attempting fallback connection...');
        
        // 1. Force disconnect any existing connections
        if (window.socket) {
          window.socket.disconnect();
        }
        
        // 2. Create a completely new connection with specific settings
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';
        
        // Use a timestamp to bypass caching issues
        const urlWithTimestamp = `${serverUrl}?t=${Date.now()}`;
        
        // Create connection with polling only
        const socket = io(urlWithTimestamp, {
          transports: ['polling'],
          timeout: 60000,
          reconnectionAttempts: 10,
          reconnectionDelay: 3000,
          autoConnect: true,
          forceNew: true,
          withCredentials: false,
          extraHeaders: {
            'Cache-Control': 'no-cache',
            'X-Client-Fallback': 'true'
          }
        });
        
        // Store in window for debugging
        window.fallbackSocket = socket;
        
        // Check if connection succeeds
        socket.on('connect', () => {
          console.log('FallbackConnection: Fallback connection established!');
          setActivated(true);
          setAttempting(false);
          
          // Try to re-initialize the main connection after success
          setTimeout(() => {
            reconnectToServer();
          }, 2000);
        });
        
        // Handle any errors
        socket.on('connect_error', (error) => {
          console.error('FallbackConnection: Fallback connection error:', error.message);
          setAttempting(false);
          
          // Show direct advice to the user via console
          console.log('%c=========== WEBSOCKET CONNECTION TROUBLESHOOTING ===========', 'font-size: 14px; color: red; font-weight: bold');
          console.log('%cTry these steps:', 'font-size: 12px; font-weight: bold');
          console.log('1. Check if the server is running');
          console.log('2. Ensure CORS is properly configured on the server');
          console.log('3. Try with a different browser');
          console.log('4. Try connecting from a different network');
          console.log('5. Check your browser console for any security errors');
          console.log('%c===========================================================', 'font-size: 14px; color: red; font-weight: bold');
        });
        
        // Clean up function
        return () => {
          if (socket) {
            socket.disconnect();
          }
        };
      } catch (error) {
        console.error('FallbackConnection: Error creating fallback connection:', error);
        setAttempting(false);
      }
    };
    
    attemptFallback();
  }, [attempting, reconnectToServer]);
  
  // Don't render anything visible
  return null;
};

export default FallbackConnection; 