import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DeploymentHandler = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Configure axios for deployment - use production URL when not in development
    const isLocalDevelopment = window.location.hostname === 'localhost';
    const serverUrl = isLocalDevelopment ? 'http://localhost:5002' : 'https://logic-length.onrender.com';
    
    console.log('Connecting to server at:', serverUrl);
    
    // Set axios defaults with more reliable configuration
    axios.defaults.baseURL = serverUrl;
    axios.defaults.timeout = 15000; // 15 second timeout
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // For API calls that need the full URL
    window.API_BASE_URL = serverUrl;
    
    // Fix CORS issues - need to be false for cross-domain requests
    axios.defaults.withCredentials = false;
    
    // Add request interceptor to log all requests and handle errors
    axios.interceptors.request.use(
      config => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, 
          config.data ? JSON.stringify(config.data).substring(0, 200) : '');
        
        // Ensure we're sending to absolute URLs for cross-domain
        if (!config.url.startsWith('http')) {
          config.url = serverUrl + (config.url.startsWith('/') ? config.url : '/' + config.url);
        }
        
        return config;
      },
      error => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor to log all responses
    axios.interceptors.response.use(
      response => {
        console.log(`API Response: ${response.status} from ${response.config.url}`, 
          response.data ? JSON.stringify(response.data).substring(0, 200) : '');
        return response;
      },
      error => {
        console.error('API Response Error:', error.response || error);
        setConnectionStatus('failed');
        return Promise.reject(error);
      }
    );
    
    // Health check to ensure API connection
    const checkConnection = async () => {
      try {
        // Add a small delay to ensure everything is initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to ping the server
        console.log('Performing health check to server:', serverUrl);
        try {
          // Try the root endpoint which should always be available
          const response = await axios.get('/', { timeout: 10000 });
          console.log('Health check successful:', response.data);
          setConnectionStatus('connected');
        } catch (healthError) {
          console.warn('Health check failed:', healthError);
          setConnectionStatus('degraded');
          // Try a few more times with increasing delays
          retryConnection(1);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Deployment setup error:', error);
        setError(error.message);
        setConnectionStatus('failed');
        setIsLoading(false);
      }
    };
    
    // Retry connection with backoff
    const retryConnection = async (attempt) => {
      if (attempt > 3) {
        console.error('Max retry attempts reached');
        setIsLoading(false);
        return;
      }
      
      const delay = attempt * 2000; // Increasing delay
      console.log(`Retrying connection in ${delay/1000} seconds (attempt ${attempt}/3)...`);
      
      setTimeout(async () => {
        try {
          const response = await axios.get('/', { timeout: 10000 });
          console.log('Retry successful:', response.data);
          setConnectionStatus('connected');
          setIsLoading(false);
        } catch (error) {
          console.error(`Retry ${attempt} failed:`, error);
          retryConnection(attempt + 1);
        }
      }, delay);
    };

    checkConnection();
    
    // Clean up any pending requests on unmount
    return () => {
      // Cancel any pending requests if needed
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

  if (connectionStatus === 'failed') {
    console.warn('Server connection failed, but continuing anyway');
  }

  // Return children even if there was an error to allow offline functionality
  return (
    <>
      {connectionStatus !== 'connected' && 
        <div className="fixed bottom-4 right-4 bg-red-800 text-white p-2 rounded-lg z-50 shadow-lg">
          ⚠️ Server connection issues. Some features may not work.
        </div>
      }
      {children}
    </>
  );
};

export default DeploymentHandler; 