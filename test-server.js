// Simple test file to verify socket.io loading
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

try {
  const socketio = require('socket.io');
  console.log('Socket.io loaded successfully, version:', socketio.version);
  
  const express = require('express');
  console.log('Express loaded successfully, version:', express.version);
  
  // Create a simple HTTP server
  const app = express();
  const http = require('http').createServer(app);
  const io = new socketio.Server(http);
  
  app.get('/', (req, res) => {
    res.send('Test server running!');
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected');
  });
  
  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });
  
} catch (error) {
  console.error('Error loading modules:', error);
} 