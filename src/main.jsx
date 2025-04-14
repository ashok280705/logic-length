import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DeploymentHandler from './components/DeploymentHandler.jsx'

// Add error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent the app from crashing completely
  event.preventDefault();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DeploymentHandler>
      <App />
    </DeploymentHandler>
  </StrictMode>,
)
