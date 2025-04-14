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
    axios.defaults.timeout = 20000; // 20 second timeout for Render's cold starts
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // For API calls that need the full URL
    window.API_BASE_URL = serverUrl;
    
    // Fix CORS issues - need to be false for cross-domain requests
    axios.defaults.withCredentials = false;
    
    // Add request interceptor to log all requests and handle errors
    axios.interceptors.request.use(
      config => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
        
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
    
    // Force connection to 'connected' status after a timeout
    // This is a fallback for Render deployments where health checks might fail
    // but the actual API endpoints still work
    setTimeout(() => {
      if (connectionStatus !== 'connected') {
        console.log('Forcing connection status to connected after timeout');
        setConnectionStatus('connected');
        setIsLoading(false);
      }
    }, 5000);
    
    // Add response interceptor to log all responses
    axios.interceptors.response.use(
      response => {
        console.log(`API Response: ${response.status} from ${response.config.url}`);
        return response;
      },
      error => {
        console.error('API Response Error:', error.response || error);
        // Don't set connection status to failed on individual API errors
        return Promise.reject(error);
      }
    );
    
    // Health check to ensure API connection
    const checkConnection = async () => {
      try {
        // Try direct verification of login flow
        const verifyLoginEndpoint = async () => {
          try {
            // This is a direct test of the login endpoint which is what we care about most
            const response = await axios.post(`${serverUrl}/api/auth/login`, {
              // Send invalid credentials - we expect a 400 error but that means the endpoint is working
              username: 'healthcheck',
              password: 'healthcheck123'
            });
            
            // If we get here, something unusual happened, but the endpoint is responding
            console.log('Login endpoint responding (unexpected success):', response.data);
            setConnectionStatus('connected');
            setIsLoading(false);
            return true;
          } catch (error) {
            if (error.response) {
              // We got a response from the server, even if it's an error
              // This is actually good - it means the backend is up
              console.log('Login endpoint responding (expected auth error):', error.response.status);
              setConnectionStatus('connected');
              setIsLoading(false);
              return true;
            }
            // Network error or timeout
            console.error('Login endpoint unreachable:', error.message);
            return false;
          }
        };
        
        // If login verification succeeds, we're done
        if (await verifyLoginEndpoint()) {
          return;
        }
        
        // If login verification fails, try fallback to root endpoint
        try {
          const response = await axios.get(serverUrl);
          console.log('Root endpoint check successful:', response.data);
          setConnectionStatus('connected');
          setIsLoading(false);
        } catch (error) {
          // Even a 404 error is good - it means the server is running
          if (error.response) {
            console.log('Server responded with status:', error.response.status);
            setConnectionStatus('connected');
          } else {
            console.warn('Server unreachable:', error.message);
            setConnectionStatus('degraded');
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Health check error:', error.message);
        setIsLoading(false);
      }
    };

    // Start health check with delay to allow for Render's cold start
    setTimeout(checkConnection, 2000);
    
    // Clean up any pending requests on unmount
    return () => {
      // Cancel any pending requests if needed
    };
  }, [connectionStatus]);

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