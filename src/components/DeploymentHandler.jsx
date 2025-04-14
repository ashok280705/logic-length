import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DeploymentHandler = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Configure axios for deployment
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
    console.log('Connecting to server at:', serverUrl);
    
    axios.defaults.baseURL = serverUrl;
    axios.defaults.withCredentials = true;
    
    // Health check to ensure API connection
    const checkConnection = async () => {
      try {
        // Add a small delay to ensure everything is initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to ping the server
        await axios.get('/api/health-check', { timeout: 5000 })
          .catch(error => {
            console.warn('Health check failed, using fallback mode:', error);
            // Continue anyway even if health check fails
          });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Deployment setup error:', error);
        setError(error.message);
        // Continue rendering the app even with errors
        setIsLoading(false);
      }
    };

    checkConnection();
    
    // Clean up any pending requests on unmount
    return () => {
      // Cancel any pending requests
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a001a] to-[#1a0050]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-[#6320dd] rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Logic Length Games</h2>
          <p className="text-[#b69fff] mt-2">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn('Rendering app despite error:', error);
  }

  // Return children even if there was an error to allow offline functionality
  return <>{children}</>;
};

export default DeploymentHandler; 