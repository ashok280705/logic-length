import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './config/AuthContext';

// Add error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent the app from crashing completely
  event.preventDefault();
  
  // Log detailed error information
  console.group('Detailed Error Information');
  console.error('Error Message:', event.error?.message || 'Unknown error');
  console.error('Stack Trace:', event.error?.stack || 'No stack trace available');
  console.error('Error Location:', `${event.filename || 'Unknown file'}, Line: ${event.lineno || 'Unknown'}, Column: ${event.colno || 'Unknown'}`);
  console.groupEnd();
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
});

// Add manual app initialization status tracking
window.appInitialized = false;

// Create root and render app
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found in the DOM');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </React.StrictMode>
  );
  
  // Set flag to indicate successful initialization
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.appInitialized = true;
      console.log('React application successfully initialized');
    }, 1000);
  });
} catch (error) {
  console.error('Failed to initialize React application:', error);
  // Show a fallback error message in the DOM
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: white; text-align: center; padding: 20px;">
        <h2>Application Error</h2>
        <p>We encountered a problem while loading the application.</p>
        <p style="color: #ff4757; margin: 10px 0;">Error: ${error.message || 'Unknown error'}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #6320dd; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
          Reload Application
        </button>
      </div>
    `;
  }
}
