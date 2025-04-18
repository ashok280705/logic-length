import { useEffect, useState, useCallback } from 'react';
import { useMultiplayer } from './MultiplayerContext';

/**
 * FallbackClient implements a long-polling fallback when Socket.IO fails.
 * It communicates with the custom fallback API endpoints instead of using Socket.IO.
 */
const FallbackClient = () => {
  const { connectionError, isConnected, socket } = useMultiplayer();
  const [clientId, setClientId] = useState(null);
  const [active, setActive] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  
  // Get the server URL
  const getServerUrl = useCallback(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';
    return serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  }, []);
  
  // Register with the fallback system
  const register = useCallback(async () => {
    try {
      console.log('[FallbackClient] Registering with fallback system...');
      const serverUrl = getServerUrl();
      
      const response = await fetch(`${serverUrl}/api/fallback/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setClientId(data.clientId);
        setActive(true);
        console.log(`[FallbackClient] Registered successfully with ID: ${data.clientId}`);
        return data.clientId;
      } else {
        console.error('[FallbackClient] Registration failed:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('[FallbackClient] Registration error:', error);
      return null;
    }
  }, [getServerUrl]);
  
  // Start long-polling loop
  const startPolling = useCallback(async (id) => {
    if (!id) return;
    
    const pollId = id;
    setPollingActive(true);
    
    const poll = async () => {
      if (!pollId || !active) return;
      
      try {
        const serverUrl = getServerUrl();
        const timeout = 30000; // 30 seconds poll
        
        const response = await fetch(`${serverUrl}/api/fallback/poll/${pollId}?timeout=${timeout}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'If-None-Match': Date.now().toString()
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'messages' && data.messages && data.messages.length > 0) {
            console.log('[FallbackClient] Received messages:', data.messages);
            
            // Process each message
            data.messages.forEach(msg => {
              const event = new CustomEvent('fallback-message', {
                detail: {
                  event: msg.event,
                  data: msg.data
                }
              });
              window.dispatchEvent(event);
            });
          }
          
          // Continue polling if still active
          if (active) {
            // Small delay to prevent rapid polling
            setTimeout(() => poll(), 500);
          }
        } else {
          console.error('[FallbackClient] Polling failed:', await response.text());
          
          // Retry after 5 seconds
          setTimeout(() => {
            if (active) poll();
          }, 5000);
        }
      } catch (error) {
        console.error('[FallbackClient] Polling error:', error);
        
        // Retry after 5 seconds
        setTimeout(() => {
          if (active) poll();
        }, 5000);
      }
    };
    
    // Start initial poll
    poll();
  }, [active, getServerUrl]);
  
  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(async (id) => {
    if (!id || !active) return;
    
    try {
      const serverUrl = getServerUrl();
      
      await fetch(`${serverUrl}/api/fallback/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          clientId: id,
          timestamp: Date.now()
        })
      });
      
      console.log('[FallbackClient] Heartbeat sent');
    } catch (error) {
      console.error('[FallbackClient] Heartbeat error:', error);
    }
  }, [active, getServerUrl]);
  
  // Send a message through the fallback system
  const sendMessage = useCallback(async (event, message) => {
    if (!clientId || !active) return null;
    
    try {
      const serverUrl = getServerUrl();
      
      const response = await fetch(`${serverUrl}/api/fallback/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          clientId,
          event,
          message,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[FallbackClient] Message sent with ID: ${data.messageId}`);
        return data.messageId;
      } else {
        console.error('[FallbackClient] Failed to send message:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('[FallbackClient] Error sending message:', error);
      return null;
    }
  }, [clientId, active, getServerUrl]);
  
  // Initialize fallback system when Socket.IO fails
  useEffect(() => {
    if (connectionError && connectionError.includes('xhr poll error') && !isConnected && !active) {
      console.log('[FallbackClient] Socket.IO connection failed, activating fallback...');
      
      // Register and start polling
      (async () => {
        const newClientId = await register();
        if (newClientId) {
          // Make sendMessage available globally for debugging
          window.sendFallbackMessage = (event, message) => sendMessage(event, message);
          
          // Start polling
          startPolling(newClientId);
          
          // Set up heartbeat
          const heartbeatInterval = setInterval(() => {
            if (active) sendHeartbeat(newClientId);
          }, 25000); // Send heartbeat every 25 seconds
          
          return () => {
            clearInterval(heartbeatInterval);
          };
        }
      })();
    }
  }, [connectionError, isConnected, active, register, startPolling, sendHeartbeat, sendMessage]);
  
  // Clean up when Socket.IO reconnects
  useEffect(() => {
    if (isConnected && active) {
      console.log('[FallbackClient] Socket.IO reconnected, deactivating fallback...');
      setActive(false);
      setPollingActive(false);
    }
  }, [isConnected, active]);
  
  // Expose fallback status for debugging
  useEffect(() => {
    window.fallbackStatus = {
      active,
      clientId,
      pollingActive
    };
  }, [active, clientId, pollingActive]);
  
  return null; // No UI needed, this is a background service
};

export default FallbackClient; 