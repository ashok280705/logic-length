import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DeploymentHandler = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('unknown');

  useEffect(() => {
    // Detect current environment
    const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isProduction = window.location.hostname.includes('vercel') || window.location.hostname.includes('netlify');
    const deployedEnvironment = isProduction ? 'production' : (isLocalDevelopment ? 'development' : 'unknown');
    
    console.log('======= DEPLOYMENT HANDLER =======');
    console.log('Environment:', deployedEnvironment);
    console.log('Hostname:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);
    
    // Set server URL based on environment
    const serverUrl = isLocalDevelopment ? 'http://localhost:5002' : 'https://logic-length.onrender.com';
    console.log('API Server URL:', serverUrl);
    
    // Set axios defaults with simple configuration
    axios.defaults.baseURL = serverUrl;
    axios.defaults.timeout = 30000; // 30 second timeout 
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // For API calls that need the full URL
    window.API_BASE_URL = serverUrl;
    
    // MUST be false for cross-domain requests
    axios.defaults.withCredentials = false;
    
    // Add request interceptor to log all requests
    axios.interceptors.request.use(
      config => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data);
        
        // Ensure we're sending to absolute URLs
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

    // Try to check backend connection in production
    const checkBackendConnection = async () => {
      try {
        console.log('Checking backend connection...');
        const response = await axios.get('/api/health', { timeout: 5000 });
        
        if (response.data?.status === 'ok') {
          console.log('✅ Backend is available');
          setApiStatus('connected');
        } else {
          console.warn('⚠️ Backend responded but status is not OK');
          setApiStatus('warning');
        }
      } catch (error) {
        console.error('❌ Could not connect to backend:', error.message);
        setApiStatus('disconnected');
      } finally {
        // Proceed regardless of connection status
        setIsLoading(false);
      }
    };
    
    // Check Firebase config
    const checkFirebaseConfig = () => {
      try {
        const firebaseConfig = window.firebase?.options || null;
        if (firebaseConfig) {
          console.log('✅ Firebase config is available:', {
            projectId: firebaseConfig.projectId,
            authDomain: firebaseConfig.authDomain
          });
        } else {
          console.warn('⚠️ Firebase config not found in window object');
        }
      } catch (error) {
        console.error('❌ Error checking Firebase config:', error);
      }
    };

    // Run checks and finish loading
    const runChecks = async () => {
      // In production, actually check backend
      if (isProduction) {
        checkFirebaseConfig();
        await checkBackendConnection();
      } else {
        // In development, just check quickly
        console.log('Skipping detailed health checks in development');
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };
    
    // Run the checks
    runChecks();
    
    console.log('====================================');
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a001a] to-[#1a0050]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-[#6320dd] rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Logic Length Games</h2>
          <p className="text-[#b69fff] mt-2">Loading game...</p>
        </div>
      </div>
    );
  }

  // Show warning if backend is disconnected but still continue
  if (apiStatus === 'disconnected') {
    console.warn('Continuing without backend connection...');
    // We could show a warning toast here but we'll proceed anyway
  }

  return <>{children}</>;
};

export default DeploymentHandler; 