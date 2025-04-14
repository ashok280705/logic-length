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

  // Page loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1500);
    
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
    return isLocalDevelopment ? 'http://localhost:5002' : 'https://logic-length.onrender.com';
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Use dynamic server URL
      const serverUrl = getServerUrl();
      const response = await axios.post(`${serverUrl}/api/auth/login`, {
        username: formData.username,
        password: formData.password
      });
      
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        setError(error.response.data.message || "Login failed! Please check your credentials.");
      } else if (error.request) {
        setError("Server is not responding. Please check if it's running at " + serverUrl);
      } else {
        setError("Login failed! " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
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
    
    try {
      console.log("Submitting registration data:", formData);
      
      // Use dynamic server URL
      const serverUrl = getServerUrl();
      const response = await axios.post(`${serverUrl}/api/auth/register`, formData);
      
      console.log("Registration response:", response.data);
      setError("");
      
      // Show success message and auto-fill login form
      alert("Registration successful! You can now login with your credentials.");
      setIsLogin(true);
      setFormData({ 
        ...formData,
        password: "" // Clear password but keep username for easy login
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        setError(error.response.data.message || "Registration failed! Please try again.");
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
        setError("Server is not responding. Please check if it's running at " + serverUrl);
      } else {
        // Something happened in setting up the request
        console.error("Error message:", error.message);
        setError("Registration failed! " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Initiating Google Sign-In from login component...");
      const googleUser = await signInWithGoogle();
      
      if (!googleUser) {
        throw new Error("Google Sign-In failed. Please try again.");
      }

      console.log("Google Sign-In successful, processing user data:", googleUser);
      
      // Create a minimal user object to ensure navigation works
      const minimalUser = {
        ...googleUser,
        coins: 50,
        level: 1,
        xp: 0,
        transactions: []
      };
      
      // Set user in localStorage and state immediately to ensure navigation works
      console.log("Setting minimal user data:", minimalUser);
      localStorage.setItem("user", JSON.stringify(minimalUser));
      setUser(minimalUser);
      
      // Navigate immediately (before API calls that might fail)
      console.log("Navigating to home page with minimal user...");
      navigate("/home", { replace: true });
      
      // Then try API operations in the background
      try {
        // Log the data we're sending to the server
        const googleAuthData = {
          email: googleUser.email,
          displayName: googleUser.username || googleUser.displayName,
          googleId: googleUser.id || googleUser.uid,
          photoURL: googleUser.photoURL
        };
        
        console.log("Sending Google auth data to server:", googleAuthData);
        
        // Try to update user data in the background
        setTimeout(async () => {
          try {
            // Use dynamic server URL
            const serverUrl = getServerUrl();
            const response = await axios.post(`${serverUrl}/api/auth/google-signin`, googleAuthData);
            console.log("Background API call successful:", response?.data);
            
            if (response?.data?.success) {
              // Update user data with server data
              const existingUser = response.data.user;
              const mergedUser = {
                ...googleUser,
                id: existingUser.id || googleUser.id || googleUser.uid,
                username: existingUser.username || googleUser.username || googleUser.displayName,
                coins: existingUser.coins || 0,
                transactions: existingUser.transactions || [],
                level: existingUser.level || 1,
                xp: existingUser.xp || 0
              };
              
              console.log("Updating user data in background:", mergedUser);
              localStorage.setItem("user", JSON.stringify(mergedUser));
              setUser(mergedUser);
            }
          } catch (backgroundError) {
            console.error("Background API call failed:", backgroundError);
            // User is already navigated to home, so no need to handle this error
          }
        }, 1000);
        
      } catch (apiError) {
        console.error("API error during Google sign-in:", apiError);
        // User is already navigated, so no need to handle this error
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError(error.message || "Failed to sign in with Google. Please try again.");
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
                  Processing...
                </>
              ) : (
                <>{isLogin ? 'Sign In' : 'Sign Up'}</>
              )}
            </button>
            
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute left-0 right-0 h-[1px] bg-[#6320dd]/30"></div>
              <span className="relative px-4 bg-gradient-to-b from-[#1a0050] to-[#09001a] text-[#b69fff]">or continue with</span>
            </div>
            
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-white text-[#4285F4] rounded-lg font-semibold transition-all duration-300 hover:bg-gray-100 hover:shadow-md hover:shadow-[#6320dd]/30 border border-gray-300 flex items-center justify-center relative overflow-hidden"
              disabled={isLoading}
            >
              <span className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-white">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              </span>
              <span className="ml-4">{isLoading ? 'Processing...' : 'Sign in with Google'}</span>
            </button>
          </form>
          
          {/* Toggle between login and signup */}
          <div className="text-center mt-6 relative z-20">
            <p className="text-[#b69fff] mb-3">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              type="button"
              className="px-6 py-2 bg-[#6320dd] text-white rounded-lg font-medium hover:bg-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] transition-colors z-20 relative"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
          
          {/* Cyberpunk style corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#6320dd]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#6320dd]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#6320dd]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#6320dd]"></div>
        </div>
      </div>

      {/* Add a keyframes animation for the sliding effect */}
      <style jsx>{`
        @keyframes slide-right {
          0%, 100% { transform: translateX(-100%) rotate(-45deg); }
          50% { transform: translateX(100%) rotate(-45deg); }
        }
        .animate-slide-right {
          animation: slide-right 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
