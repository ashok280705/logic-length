// This is a helper script to start the server with proper module resolution
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import path from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the server index.js file
const serverPath = path.join(__dirname, '..', 'server', 'index.js');

console.log('Starting server from:', serverPath);

// Start the server process
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit', // This will pipe the child process I/O to the parent
  env: {
    ...process.env,
    NODE_PATH: path.join(__dirname, 'node_modules') + ':' + process.env.NODE_PATH
  }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
}); 