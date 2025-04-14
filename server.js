// Root level server starter with explicit module resolution
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// Create a require function
const require = createRequire(import.meta.url);

// Use require to load socket.io which has CommonJS issues in ESM
global.SocketIO = require('socket.io');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log for debugging
console.log('Loading with NODE_PATH:', process.env.NODE_PATH);
console.log('Current directory:', __dirname);
console.log('Socket.io version:', global.SocketIO.version);

// Now import the server which will use the global SocketIO
import './src/server/index.js';

// This file exists just to help with proper module resolution
// when running on Render 