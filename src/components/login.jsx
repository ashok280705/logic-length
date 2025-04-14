import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../config/firebaseConfig";
import axios from 'axios';

const Login = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // Debug useEffect to track isLogin changes
  useEffect(() => {
    console.log("isLogin state changed to:", isLogin);
  }, [isLogin]);

  // Debug useEffect to track formData changes
  useEffect(() => {
    console.log("formData state changed:", formData);
  }, [formData]);

  // Page loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000); // Reduced from 1500ms to 1000ms for faster loading
    
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  // Get the appropriate server URL based on environment
  const getServerUrl = () => {
    const isLocalDevelopment = window.location.hostname === 'localhost';
    const prodUrl = 'https://logic-length.onrender.com';
    
    console.log(`Using ${isLocalDevelopment ? 'local development' : 'production'} server URL`);
    return isLocalDevelopment ? 'http://localhost:5002' : prodUrl;
  };

  // Configure a pre-configured axios instance with longer timeout for Render
  const getAxiosInstance = (timeoutMs = 30000) => {
    const serverUrl = getServerUrl();
    console.log('Creating axios instance with server URL:', serverUrl);
    
    const instance = axios.create({
      baseURL: serverUrl,
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    // Log all requests
    instance.interceptors.request.use(
      config => {
        console.log(`${config.method.toUpperCase()} request to ${config.url}`);
        // Ensure URL has correct format
        if (!config.url.startsWith('/api/')) {
          config.url = '/api' + (config.url.startsWith('/') ? config.url : '/' + config.url);
        }
        console.log('Final request URL:', serverUrl + config.url);
        return config;
      },
      error => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );
    
    return instance;
  };

  // Handle Login with retry
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    console.log(`Login attempt for user: ${formData.username}`);
    
    const maxRetries = 2;
    let retryCount = 0;
    let success = false;
    
    while (retryCount <= maxRetries && !success) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}/${maxRetries} for login...`);
          setError(`Connection attempt ${retryCount}/${maxRetries}... Please wait.`);
          // Add a small delay between retries
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const axiosInstance = getAxiosInstance(30000); // 30 second timeout
        const response = await axiosInstance.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        
        console.log("Login response:", response.data);
        
        if (response.data && response.data.user) {
          // Success!
          localStorage.setItem("user", JSON.stringify(response.data));
          setUser(response.data);
          success = true;
          navigate("/home");
          return; // Exit the function on success
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (error) {
        retryCount++;
        console.error(`Login attempt ${retryCount} failed:`, error);
        
        // Only set error message on last retry or non-network errors
        if (retryCount > maxRetries || (error.response && error.response.status !== 0)) {
          if (error.response) {
            setError(error.response.data?.message || "Login failed! Please check your credentials.");
          } else if (error.request) {
            setError("Server connection issue. Please try again in a few seconds.");
          } else {
            setError("Login failed: " + error.message);
          }
        }
      }
    }
    
    setIsLoading(false);
  };

  // Handle Registration with retry
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Enhanced form validation
    if (!formData.username || formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      setIsLoading(false);
      return;
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    
    console.log(`Registration attempt for user: ${formData.username}`);
    
    const maxRetries = 2;
    let retryCount = 0;
    let success = false;
    
    while (retryCount <= maxRetries && !success) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}/${maxRetries} for registration...`);
          setError(`Connection attempt ${retryCount}/${maxRetries}... Please wait.`);
          // Add a small delay between retries
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const axiosInstance = getAxiosInstance(40000); // 40 second timeout for registration
        const response = await axiosInstance.post('/auth/register', formData);
        
        console.log("Registration response:", response.data);
        setError("");
        
        // Show success message and auto-fill login form
        alert("Registration successful! You can now login with your credentials.");
        setIsLogin(true);
        setFormData({ 
          ...formData,
          password: "" // Clear password but keep username for easy login
        });
        
        success = true;
        break;
      } catch (error) {
        retryCount++;
        console.error(`Registration attempt ${retryCount} failed:`, error);
        
        // Only set error message on last retry or non-network errors
        if (retryCount > maxRetries || (error.response && error.response.status !== 0)) {
          if (error.response) {
            console.error("Error response:", error.response.data);
            setError(error.response.data?.message || "Registration failed! Please try again.");
          } else if (error.request) {
            setError("Server connection issue. Please try again in a few seconds.");
          } else {
            setError("Registration failed: " + error.message);
          }
        }
      }
    }
    
    setIsLoading(false);
  };

  // Google Sign-In Handler with simpler approach
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Initiating Google Sign-In...");
      const googleUser = await signInWithGoogle();
      
      if (!googleUser) {
        throw new Error("Google Sign-In failed. Please try again.");
      }

      console.log("Google Sign-In successful!");
      
      // Create a user object to ensure navigation works
      const user = {
        ...googleUser,
        user: {
          id: googleUser.uid || googleUser.id,
          username: googleUser.displayName,
          email: googleUser.email,
          coins: 50,
          level: 1,
          xp: 0,
          transactions: []
        },
        token: googleUser.accessToken || "google-auth-token"
      };
      
      // Store user data and navigate
      console.log("Setting user data:", user);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      
      // Navigate to home page
      navigate("/home", { replace: true });
      
      // Try to sync with backend in background
      setTimeout(async () => {
        try {
          const axiosInstance = getAxiosInstance(20000);
          console.log("Syncing Google user with backend...");
          const response = await axiosInstance.post('/api/auth/google-signin', {
            email: googleUser.email,
            displayName: googleUser.displayName,
            googleId: googleUser.uid || googleUser.id,
            photoURL: googleUser.photoURL
          });
          
          console.log("Backend sync successful:", response.data);
          
          // Update user data if needed
          if (response.data && response.data.user) {
            const updatedUser = {
              ...user,
              user: {
                ...user.user,
                ...response.data.user
              }
            };
            
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        } catch (error) {
          console.error("Backend sync failed (continuing anyway):", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError("Failed to sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  // If the user is already logged in, redirect to home page
  useEffect(() => {
    if (localStorage.getItem("user")) {
      navigate("/home");
    }
  }, [navigate]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a001a] to-[#1a0050]">
        <div className="text-center">
          <div className="w-20 h-20 border-t-4 border-r-4 border-[#6320dd] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white super-neon">Logic Length Games</h2>
          <p className="text-[#b69fff] mt-2 loading-dots">Preparing amazing experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a001a] to-[#1a0050] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(99,32,221,0.1)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(99,32,221,0.1)_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(139,92,246,0.3)_0%,_transparent_70%)]"></div>
        
        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#6320dd] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#8b5cf6] rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 left-1/3 w-24 h-24 bg-[#4e1ebb] rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated particles */}
        <div className="particles-bg">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="particle-elem"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                opacity: Math.random() * 0.3,
                animationDuration: `${Math.random() * 20 + 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gradient-to-b from-[#1a0050] to-[#09001a] rounded-xl shadow-2xl transform transition-all duration-300 scale-100 opacity-100 animate-glow futuristic-border p-8 relative overflow-hidden">
          {/* Diagonal glowing line */}
          <div 
            className="absolute w-[200%] h-[50px] bg-gradient-to-r from-transparent via-[#6320dd]/20 to-transparent -rotate-45 -translate-x-full animate-slide-right"
            style={{
              top: '40%',
              animationDuration: '3s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out'
            }}
          ></div>
          
          {/* Logo */}
          <div className="flex justify-center mb-6 perspective-container">
            <img src="logo.png" alt="LogicLength Logo" className="h-16 animate-float perspective-element" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2 super-neon">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[#b69fff] text-center mb-6">
            {isLogin ? "Login to access your account" : "Join our gaming community"}
          </p>
          
          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/50 text-red-300 rounded-lg border border-red-500 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-red-900/30 transform -skew-x-12 animate-pulse"></div>
              <div className="relative z-10 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b69fff]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-3 pl-10 bg-[#2a2a4d]/50 text-white placeholder-[#b69fff]/50 rounded-lg border border-[#6320dd]/50 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all duration-300"
                required
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#6320dd]/20 to-transparent pointer-events-none"></div>
            </div>
            
            {!isLogin && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b69fff]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 pl-10 bg-[#2a2a4d]/50 text-white placeholder-[#b69fff]/50 rounded-lg border border-[#6320dd]/50 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all duration-300"
                  required
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#6320dd]/20 to-transparent pointer-events-none"></div>
              </div>
            )}
            
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b69fff]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-3 pl-10 bg-[#2a2a4d]/50 text-white placeholder-[#b69fff]/50 rounded-lg border border-[#6320dd]/50 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition-all duration-300"
                required
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#6320dd]/20 to-transparent pointer-events-none"></div>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-[#4e1ebb] to-[#8b5cf6] text-white rounded-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#6320dd]/50 relative overflow-hidden border border-transparent hover:border-[#b69fff]/30 transform flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {error && error.includes("Connection attempt") ? "Connecting..." : "Processing..."}
                </>
              ) : (
                <>{isLogin ? 'Sign In' : 'Sign Up'}</>
              )}
              <div className="absolute inset-0 w-full h-full transition-all duration-300">
                <div className="absolute left-0 top-0 h-full bg-white/10 w-8 transform -skew-x-12 animate-shimmer"></div>
              </div>
            </button>
            
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute left-0 right-0 h-[1px] bg-[#6320dd]/30"></div>
              <div className="px-4 bg-[#09001a] text-[#b69fff] text-sm relative z-10">OR</div>
            </div>
            
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-transparent text-white rounded-lg font-medium transition-all duration-300 hover:bg-white/5 flex items-center justify-center border border-[#6320dd]/50 hover:border-[#b69fff]/50 relative overflow-hidden"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
                />
                <path
                  fill="#34A853"
                  d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
                />
                <path
                  fill="#4A90E2"
                  d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
                />
              </svg>
              {isLoading ? "Please wait..." : "Continue with Google"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-[#b69fff] mb-3">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            
            <button 
              type="button"
              onClick={() => {
                // Direct function call with no preventDefault or event handling
                console.log("TOGGLE BUTTON CLICKED - DIRECT FUNCTION CALL");
                // Force toggle the state directly
                setIsLogin(isLogin === true ? false : true);
                // Clear error messages
                setError("");
                // Reset form
                setFormData({
                  username: "",
                  password: "",
                  email: ""
                });
              }}
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-900"
            >
              {isLogin ? "Create New Account" : "Back to Login"}
            </button>
          </div>
          
          {/* Glowing corners */}
          <div className="absolute w-[10px] h-[10px] top-0 left-0 border-t-2 border-l-2 border-[#6320dd] animate-pulse"></div>
          <div className="absolute w-[10px] h-[10px] top-0 right-0 border-t-2 border-r-2 border-[#6320dd] animate-pulse"></div>
          <div className="absolute w-[10px] h-[10px] bottom-0 left-0 border-b-2 border-l-2 border-[#6320dd] animate-pulse"></div>
          <div className="absolute w-[10px] h-[10px] bottom-0 right-0 border-b-2 border-r-2 border-[#6320dd] animate-pulse"></div>
        </div>
        
        {/* Connection status indicator - Shows when retrying connection */}
        {error && error.includes("Connection attempt") && (
          <div className="mt-4 text-center text-sm text-[#b69fff] bg-[#1a0050]/50 p-2 rounded-lg border border-[#6320dd]/30 animate-pulse">
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#8b5cf6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Attempting to reach server... Please wait
            </div>
          </div>
        )}
      </div>
      
      {/* Credit text */}
      <div className="absolute bottom-4 text-center w-full text-xs text-[#b69fff]/50">
        <p>Made with ❤️ by LogicLength • © {new Date().getFullYear()}</p>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px 0px rgba(99, 32, 221, 0.3); }
          50% { box-shadow: 0 0 20px 5px rgba(99, 32, 221, 0.5); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes slide-right {
          0% { transform: translateX(-100%) rotate(-45deg); }
          100% { transform: translateX(200%) rotate(-45deg); }
        }
        
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          25% { opacity: 1; }
          50% { transform: translateY(-100px) translateX(100px); opacity: 0.5; }
          75% { opacity: 0.2; }
          100% { transform: translateY(-200px) translateX(200px); opacity: 0; }
        }
        
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-slide-right {
          animation: slide-right 3s infinite;
        }
        
        .super-neon {
          text-shadow: 0 0 5px rgba(99, 32, 221, 0.5), 0 0 10px rgba(99, 32, 221, 0.3);
        }
        
        .futuristic-border {
          border: 1px solid rgba(99, 32, 221, 0.3);
          box-shadow: 0 0 15px rgba(99, 32, 221, 0.3), inset 0 0 10px rgba(99, 32, 221, 0.1);
        }
        
        .perspective-container {
          perspective: 1000px;
        }
        
        .perspective-element {
          transform-style: preserve-3d;
        }
        
        .particle-elem {
          position: absolute;
          background-color: rgba(99, 32, 221, 0.5);
          border-radius: 50%;
          animation: particle-float linear infinite;
        }
        
        .particles-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .loading-dots::after {
          content: '...';
          display: inline-block;
          animation: dotAnimation 1.5s infinite;
          width: 24px;
          text-align: left;
        }
        
        @keyframes dotAnimation {
          0% { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
          100% { content: '.'; }
        }
      `}</style>
    </div>
  );
};

export default Login;
