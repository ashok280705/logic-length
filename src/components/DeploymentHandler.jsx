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
          // Try the root API endpoint instead of "/"
          const response = await axios.get(`${serverUrl}/api/auth/test`, { timeout: 10000 });
          console.log('Health check successful:', response.data);
          setConnectionStatus('connected');
        } catch (firstError) {
          console.warn('First health check failed, trying root endpoint...', firstError);
          
          // Fallback to trying the root endpoint
          try {
            const rootResponse = await axios.get(serverUrl, { timeout: 10000 });
            console.log('Root endpoint check successful:', rootResponse.data);
            setConnectionStatus('connected');
          } catch (healthError) {
            console.warn('Health check failed:', healthError);
            setConnectionStatus('degraded');
            // Try a few more times with increasing delays
            retryConnection(1);
          }
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
          // Try multiple endpoints in sequence
          try {
            // First try auth test endpoint
            const response = await axios.get(`${serverUrl}/api/auth/test`, { timeout: 10000 });
            console.log('Auth test endpoint retry successful:', response.data);
            setConnectionStatus('connected');
            setIsLoading(false);
            return;
          } catch (authError) {
            console.log('Auth endpoint retry failed, trying root endpoint...');
            // Then try root endpoint
            const rootResponse = await axios.get(serverUrl, { timeout: 10000 });
            console.log('Root endpoint retry successful:', rootResponse.data);
            setConnectionStatus('connected');
            setIsLoading(false);
            return;
          }
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
        <div className="fixed bottom-4 right-4 bg-yellow-700 text-white p-3 rounded-lg z-50 shadow-lg max-w-xs">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Server connection limited</p>
              <p className="text-sm text-yellow-200">Please refresh the page if login/signup doesn't work.</p>
            </div>
          </div>
        </div>
      }
      {children}
    </>
  );
};

export default DeploymentHandler; 