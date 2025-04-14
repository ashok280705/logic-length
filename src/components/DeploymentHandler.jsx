import React, { useEffect, useState, createContext, useContext } from 'react';
import axios from 'axios';

// Create context to share connection state across components
export const ConnectionContext = createContext({
  isConnected: false,
  serverUrl: '',
  connectionAttempts: 0,
  maxRetries: 3,
  retryInProgress: false,
  lastError: null,
  retryConnection: () => {},
});

export const useConnection = () => useContext(ConnectionContext);

const DeploymentHandler = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    serverUrl: '',
    connectionAttempts: 0,
    maxRetries: 3,
    retryInProgress: false,
    lastError: null,
  });

  // Create a function to get server URL
  const getServerUrl = () => {
    const isLocalDevelopment = window.location.hostname === 'localhost';
    const prodUrl = 'https://logic-length.onrender.com';
    return isLocalDevelopment ? 'http://localhost:5002' : prodUrl;
  };

  // Configure a pre-configured axios instance with longer timeout for Render
  const configureAxios = (serverUrl, timeoutMs = 30000) => {
    console.log('Configuring axios with server URL:', serverUrl);
    
    // Set axios defaults with robust configuration
    axios.defaults.baseURL = serverUrl;
    axios.defaults.timeout = timeoutMs;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.common['Cache-Control'] = 'no-cache';
    
    // For API calls that need the full URL
    window.API_BASE_URL = serverUrl;
    
    // MUST be false for cross-domain requests
    axios.defaults.withCredentials = false;
    
    // Add request interceptor to log all requests
    axios.interceptors.request.use(
      config => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data);
        
        // Ensure URLs have the correct format for API calls
        if (!config.url.startsWith('http') && !config.url.startsWith('/api/')) {
          config.url = '/api' + (config.url.startsWith('/') ? config.url : '/' + config.url);
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
        console.log(`API Response: ${response.status} from ${response.config.url}`, response.data);
        return response;
      },
      error => {
        // Log detailed error information for debugging
        if (error.response) {
          // The server responded with a status code outside of 2xx
          console.error('API Error Response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
            url: error.config?.url
          });
        } else if (error.request) {
          // The request was made but no response was received
          console.error('API No Response Error:', {
            request: error.request,
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout
          });
        } else {
          // Something happened in setting up the request
          console.error('API Setup Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  };

  // Function to check server connectivity with retries
  const checkServerConnection = async (attempts = 0) => {
    const serverUrl = getServerUrl();
    configureAxios(serverUrl);
    
    setConnectionState(prev => ({
      ...prev,
      serverUrl,
      connectionAttempts: attempts,
      retryInProgress: true,
    }));
    
    try {
      // Simple health check endpoint - change to match your actual health endpoint
      const response = await axios.get('/api/health', { timeout: 8000 });
      console.log('Server connection successful:', response.data);
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        retryInProgress: false,
        lastError: null,
      }));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error(`Connection attempt ${attempts + 1} failed:`, error);
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        retryInProgress: false,
        lastError: error,
      }));
      
      if (attempts < connectionState.maxRetries) {
        // Wait before retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, attempts), 8000);
        console.log(`Retrying in ${retryDelay}ms...`);
        
        setTimeout(() => {
          checkServerConnection(attempts + 1);
        }, retryDelay);
        return false;
      } else {
        // Max retries reached, continue anyway
        console.log('Max retries reached, continuing without confirmed connection');
        setIsLoading(false);
        return false;
      }
    }
  };

  // Function to manually retry connection
  const retryConnection = () => {
    if (connectionState.retryInProgress) return;
    checkServerConnection(0);
  };

  useEffect(() => {
    const serverUrl = getServerUrl();
    configureAxios(serverUrl);
    
    setConnectionState(prev => ({
      ...prev,
      serverUrl,
    }));
    
    // Start connection check with retry logic
    checkServerConnection(0);
    
    // Cleanup function
    return () => {
      // Cancel any pending requests
      const cancelSource = axios.CancelToken.source();
      cancelSource.cancel('Component unmounted');
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a001a] to-[#1a0050]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-[#6320dd] rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Logic Length Games</h2>
          <p className="text-[#b69fff] mt-2">
            {connectionState.connectionAttempts > 0 
              ? `Connecting to server (Attempt ${connectionState.connectionAttempts}/${connectionState.maxRetries})...` 
              : 'Loading game...'}
          </p>
          {connectionState.connectionAttempts > 0 && (
            <p className="text-[#b69fff]/70 text-sm mt-2">
              Connection might be slow... please wait
            </p>
          )}
        </div>
      </div>
    );
  }

  // Provide connection context to all child components
  return (
    <ConnectionContext.Provider 
      value={{
        ...connectionState,
        retryConnection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export default DeploymentHandler; 