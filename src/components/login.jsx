import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithGoogle } from "../config/firebaseConfig";
import axios from 'axios';

const Login = ({ setUser, isLogin: initialIsLogin }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin !== false);
  const [formData, setFormData] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // Update isLogin when the prop changes
  useEffect(() => {
    setIsLogin(initialIsLogin !== false);
  }, [initialIsLogin]);

  // Debug useEffects
  useEffect(() => { console.log("isLogin state:", isLogin); }, [isLogin]);
  useEffect(() => { console.log("formData state:", formData); }, [formData]);

  // Page loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  // Server and API functions remain the same
  const getServerUrl = () => {
    const isLocal = window.location.hostname === 'localhost';
    return isLocal ? 'http://localhost:5002' : 'https://logic-length.onrender.com';
  };

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
    
    instance.interceptors.request.use(
      config => {
        console.log(`${config.method.toUpperCase()} request to ${config.url}`);
        if (config.url.includes('/auth')) {
          console.log('Using direct MongoDB Atlas connection for auth');
          config.headers['X-Use-Atlas-Direct'] = 'true';
        }
        
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

  // Handle Login function remains the same
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
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const axiosInstance = getAxiosInstance(30000);
        const response = await axiosInstance.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        
        console.log("Login response:", response.data);
        
        if (response.data && response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data));
          setUser(response.data);
          success = true;
          navigate("/home");
          return;
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (error) {
        retryCount++;
        console.error(`Login attempt ${retryCount} failed:`, error);
        
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

  // Handle Registration function remains the same
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
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
    
    const newUser = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      coins: 50,
      level: 1,
      xp: 0,
      transactions: [{
        amount: 50,
        type: 'bonus',
        date: new Date(),
        orderId: `welcome-${Date.now()}`,
        paymentId: `welcome-${Date.now()}`
      }]
    };
    
    while (retryCount <= maxRetries && !success) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}/${maxRetries} for registration...`);
          setError(`Connection attempt ${retryCount}/${maxRetries}... Please wait.`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (retryCount === maxRetries) {
          console.log("Attempting direct Atlas connection as last resort");
        }
        
        const axiosInstance = getAxiosInstance(40000);
        const response = await axiosInstance.post('/auth/register', newUser);
        
        console.log("Registration response:", response.data);
        
        alert("Registration successful! You can now login with your credentials.");
        setIsLogin(true);
        setFormData({ 
          ...formData,
          password: ""
        });
        
        success = true;
        
        if (window.location.pathname.includes('register')) {
          window.location.href = window.location.origin + '/login';
        }
        
        break;
      } catch (error) {
        retryCount++;
        console.error(`Registration attempt ${retryCount} failed:`, error);
        
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

  // Google Sign-In Handler remains the same
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
      
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      
      navigate("/home", { replace: true });
      
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-white">Loading</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900">
      {/* Left Panel - Image/Branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md text-center md:text-left">
          <img src="logo.png" alt="LogicLength Logo" className="h-20 mb-8 mx-auto md:mx-0" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Logic Length Games
          </h1>
          <p className="text-lg text-indigo-200 mb-8">
            Play games, compete with friends, and win exciting rewards. Join our gaming community today!
          </p>
          <div className="hidden md:block">
            <div className="flex gap-4 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-700/50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-indigo-200">Multiplayer Games</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-700/50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-indigo-200">Win Rewards</span>
              </div>
            </div>
          </div>
          <p className="text-indigo-300/80 text-sm hidden md:block">
            © {new Date().getFullYear()} Logic Length Games. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Right Panel - Login/Register Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h2>
            <p className="text-gray-400 mt-2">
              {isLogin ? "Login to access your games" : "Join our gaming community"}
            </p>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/30 text-red-400 rounded-lg border border-red-700/50 text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-400">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {error && error.includes("Connection attempt") ? "Connecting..." : "Processing..."}
                </div>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </button>
            
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute left-0 right-0 h-[1px] bg-gray-700"></div>
              <div className="relative px-4 bg-gray-900 text-gray-500 text-sm">OR</div>
            </div>
            
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-gray-700 transition duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  console.log(`Switching to ${isLogin ? 'registration' : 'login'} view`);
                  if (isLogin) {
                    window.location.href = "/register.html";
                  } else {
                    window.location.href = "/";
                  }
                }}
                className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
          
          {/* Mobile footer */}
          <div className="mt-12 text-center block md:hidden">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Logic Length Games
            </p>
          </div>
        </div>
      </div>
      
      {/* Connection status indicator */}
      {error && error.includes("Connection attempt") && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-indigo-900/80 text-indigo-200 text-sm rounded-lg border border-indigo-700/50 flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Attempting to reach server... Please wait
        </div>
      )}
    </div>
  );
};

export default Login;
