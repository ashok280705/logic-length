import express from 'express';

const router = express.Router();

// Clients stored by client ID
const connectedClients = new Map();
// Messages queue for each client
const messageQueues = new Map();
// Active polls
const activePolls = new Map();

/**
 * This route provides a fallback for when normal Socket.IO connections fail.
 * It implements a simple long-polling mechanism.
 */

// Register a client
router.post('/register', (req, res) => {
  const clientId = req.body.clientId || `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Store client info
  connectedClients.set(clientId, {
    registered: Date.now(),
    lastSeen: Date.now(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  // Initialize message queue
  if (!messageQueues.has(clientId)) {
    messageQueues.set(clientId, []);
  }
  
  console.log(`[Fallback] Client registered: ${clientId}`);
  
  res.json({
    clientId,
    status: 'registered',
    timestamp: Date.now()
  });
});

// Long-polling endpoint
router.get('/poll/:clientId', (req, res) => {
  const { clientId } = req.params;
  const timeout = parseInt(req.query.timeout || '30000', 10);
  
  // Check if client exists
  if (!connectedClients.has(clientId)) {
    return res.status(404).json({
      error: 'Client not registered',
      status: 'error'
    });
  }
  
  // Update last seen timestamp
  connectedClients.get(clientId).lastSeen = Date.now();
  
  // Check if there are already messages to send
  const messageQueue = messageQueues.get(clientId);
  if (messageQueue && messageQueue.length > 0) {
    // Send messages immediately
    const messages = [...messageQueue];
    messageQueues.set(clientId, []);
    
    return res.json({
      status: 'messages',
      messages,
      timestamp: Date.now()
    });
  }
  
  // Store the response object for later
  const pollTimeout = Math.min(timeout, 55000); // Max 55 seconds to prevent timeout issues
  
  // Create timeout to send empty response if no messages arrive
  const timeoutId = setTimeout(() => {
    if (activePolls.has(clientId)) {
      const response = activePolls.get(clientId);
      activePolls.delete(clientId);
      
      response.json({
        status: 'timeout',
        timestamp: Date.now()
      });
    }
  }, pollTimeout);
  
  // Store active poll
  activePolls.set(clientId, res);
  
  // Set up response cleanup
  req.on('close', () => {
    clearTimeout(timeoutId);
    activePolls.delete(clientId);
  });
});

// Send message endpoint
router.post('/send', (req, res) => {
  const { clientId, message, event } = req.body;
  
  if (!clientId || !message) {
    return res.status(400).json({
      error: 'Missing clientId or message',
      status: 'error'
    });
  }
  
  // Check if client exists
  if (!connectedClients.has(clientId)) {
    return res.status(404).json({
      error: 'Client not registered',
      status: 'error'
    });
  }
  
  // Create message object
  const messageObj = {
    data: message,
    event: event || 'message',
    timestamp: Date.now(),
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };
  
  // Check if there's an active poll for this client
  if (activePolls.has(clientId)) {
    // Send message directly to waiting client
    const response = activePolls.get(clientId);
    activePolls.delete(clientId);
    
    response.json({
      status: 'messages',
      messages: [messageObj],
      timestamp: Date.now()
    });
  } else {
    // Queue message for next poll
    const queue = messageQueues.get(clientId) || [];
    queue.push(messageObj);
    messageQueues.set(clientId, queue);
  }
  
  res.json({
    status: 'sent',
    messageId: messageObj.id,
    timestamp: Date.now()
  });
});

// Client heartbeat endpoint
router.post('/heartbeat', (req, res) => {
  const { clientId } = req.body;
  
  if (!clientId) {
    return res.status(400).json({
      error: 'Missing clientId',
      status: 'error'
    });
  }
  
  // Check if client exists
  if (!connectedClients.has(clientId)) {
    return res.status(404).json({
      error: 'Client not registered',
      status: 'error'
    });
  }
  
  // Update last seen timestamp
  connectedClients.get(clientId).lastSeen = Date.now();
  
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

// Clean up stale clients and polls periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean up clients that haven't been seen in 5 minutes
  for (const [clientId, clientInfo] of connectedClients.entries()) {
    if (now - clientInfo.lastSeen > 5 * 60 * 1000) {
      connectedClients.delete(clientId);
      messageQueues.delete(clientId);
      
      if (activePolls.has(clientId)) {
        const response = activePolls.get(clientId);
        activePolls.delete(clientId);
        
        response.json({
          status: 'disconnected',
          reason: 'Client timed out',
          timestamp: now
        });
      }
    }
  }
}, 60000);

export default router; 