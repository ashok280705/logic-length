import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, signInWithGoogle } from "../services/authService";
import './login.css';

const Login = ({ setUser, isLogin: initialIsLogin }) => {
  // State management
  const [isLogin, setIsLogin] = useState(initialIsLogin !== false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  
  // Refs for animations
  const navigate = useNavigate();
  const bgParticlesRef = useRef(null);
  const canvasContextRef = useRef(null);
  const particlesArrayRef = useRef([]);
  const formRef = useRef(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      navigate("/home");
    }
  }, [navigate]);

  // Simulate loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
      setTimeout(() => setAnimateForm(true), 150);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);
  
  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (navigator.onLine) {
        try {
          // Try multiple endpoints to verify connection
          const endpoints = [
            "https://www.google.com/generate_204",
            "https://www.cloudflare.com/cdn-cgi/trace",
            "https://logic-3c2d8.firebaseio.com/.json?shallow=true"
          ];
          
          // Consider online if any endpoint responds
          let isOnline = false;
          
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint, { 
                method: 'HEAD',
                timeout: 2000,
                mode: 'no-cors' // This allows requests without CORS headers
              });
              
              // If we get here, we have some kind of response (even opaque)
              isOnline = true;
              break;
            } catch (endpointError) {
              console.log(`Connection check to ${endpoint} failed:`, endpointError);
              // Continue to next endpoint
            }
          }
          
          // Set status based on results
          setConnectionStatus(isOnline ? "online" : "offline");
          
          // If online but Firebase specifically failed, still proceed 
          // but might show warnings for Firebase-specific features
        } catch (error) {
          console.log("Connection check failed:", error);
          // Default to online if navigator says we're online but fetch failed
          // This handles cases where the network is working but endpoints are blocked
          setConnectionStatus("online");
        }
      } else {
        setConnectionStatus("offline");
      }
    };
    
    // Run initial check
    checkConnection();
    
    // Set up listeners for online/offline events
    const handleOnline = () => {
      console.log("Browser reports online status");
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log("Browser reports offline status");
      setConnectionStatus("offline");
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Set a periodic check every 30 seconds
    const intervalId = setInterval(checkConnection, 30000);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  // Background particles animation
  useEffect(() => {
    if (!pageLoading && bgParticlesRef.current) {
      const canvas = bgParticlesRef.current;
      const ctx = canvas.getContext('2d');
      canvasContextRef.current = ctx;
      
      // Set canvas size to match window
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Create particles
      class Particle {
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 3 + 1;
          this.speed = Math.random() * 0.5 + 0.2;
          this.angle = Math.random() * Math.PI * 2;
          this.opacity = Math.random() * 0.5 + 0.1;
          this.color = [
            'rgba(155, 77, 255, ' + this.opacity + ')',
            'rgba(0, 196, 255, ' + this.opacity + ')',
            'rgba(98, 0, 238, ' + this.opacity + ')'
          ][Math.floor(Math.random() * 3)];
        }
        
        update() {
          this.x += Math.cos(this.angle) * this.speed;
          this.y += Math.sin(this.angle) * this.speed;
          
          // Boundary check
          if (this.x < 0) this.x = canvas.width;
          if (this.x > canvas.width) this.x = 0;
          if (this.y < 0) this.y = canvas.height;
          if (this.y > canvas.height) this.y = 0;
          
          // Randomly change direction occasionally
          if (Math.random() < 0.005) {
            this.angle += Math.random() * 0.4 - 0.2;
          }
        }
        
        draw() {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Initialize particles
      const initParticles = () => {
        particlesArrayRef.current = [];
        const numberOfParticles = (canvas.width * canvas.height) / 15000;
        for (let i = 0; i < numberOfParticles; i++) {
          particlesArrayRef.current.push(new Particle());
        }
      };
      
      initParticles();
      
      // Connect particles with lines
      const connectParticles = () => {
        const particles = particlesArrayRef.current;
        for (let a = 0; a < particles.length; a++) {
          for (let b = a; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
              const opacity = 1 - (distance / 100);
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particles[a].x, particles[a].y);
              ctx.lineTo(particles[b].x, particles[b].y);
              ctx.stroke();
            }
          }
        }
      };
      
      // Animation loop
      const animate = () => {
        if (!canvasContextRef.current) return;
        
        canvasContextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        
        particlesArrayRef.current.forEach(particle => {
          particle.update();
          particle.draw();
        });
        
        connectParticles();
        
        requestAnimationFrame(animate);
      };
      
      animate();
      
      // Clean up on component unmount
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvasContextRef.current = null;
      };
    }
  }, [pageLoading]);

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    
    // Clear general error on any input change
    if (error) setError("");
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    // Email validation - only check if this is registration or if email field is present
    if (!isLogin || (formData.email !== undefined)) {
      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    // Confirm password validation - only for registration
    if (!isLogin && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      // Warn but proceed even if connection status is offline
      if (connectionStatus === "offline") {
        console.warn("Attempting login while connection appears offline");
      }
      
      // Attempt login with Firebase
      const userData = await loginUser(formData.email, formData.password);
      
      // Success - store user data and redirect
      localStorage.setItem("user", JSON.stringify(userData));
      if (setUser) setUser(userData);
      
      setSuccess("Login successful!");
      setTimeout(() => navigate("/home"), 500);
    } catch (error) {
      console.error("Login failed:", error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("Invalid email or password");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email format");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Please try again later");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection");
      } else {
        setError(error.message || "Login failed. Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration submission
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      // Warn but proceed even if connection status is offline
      if (connectionStatus === "offline") {
        console.warn("Attempting registration while connection appears offline");
      }
      
      // Register with Firebase
      const userData = await registerUser(formData.email, formData.password, formData.username);
      
      // Success - store user data and redirect
      localStorage.setItem("user", JSON.stringify(userData));
      if (setUser) setUser(userData);
      
      setSuccess("Account created successfully!");
      setTimeout(() => navigate("/home"), 800);
    } catch (error) {
      console.error("Registration failed:", error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please try logging in instead.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address");
      } else if (error.code === 'auth/weak-password') {
        setError("Please choose a stronger password");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again");
      } else {
        setError(error.message || "Registration failed. Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Warn but proceed even if connection status is offline
      if (connectionStatus === "offline") {
        console.warn("Attempting Google sign-in while connection appears offline");
      }
      
      // Attempt Google sign-in
      const userData = await signInWithGoogle();
      
      // Success - store user data and redirect
      localStorage.setItem("user", JSON.stringify(userData));
      if (setUser) setUser(userData);
      
      setSuccess("Google sign-in successful!");
      setTimeout(() => navigate("/home"), 500);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked. Please allow popups for this website.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setError("This website is not authorized for Google Sign-In.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again");
      } else {
        setError(error.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen UI
  if (pageLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="logo-container">
            <div className="logo-pulse"></div>
            <img src="/logo.png" alt="Logic Length Logo" className="logo-image" />
          </div>
          <h2 className="loading-text">LOGIC<span>LENGTH</span></h2>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      {/* Animated background particles */}
      <canvas ref={bgParticlesRef} className="background-particles"></canvas>
      
      {/* Main login container */}
      <div className={`login-container ${animateForm ? 'form-visible' : ''}`}>
        {/* Glowing elements */}
        <div className="glow-container">
          <div className="glow-circle"></div>
          <div className="glow-triangle"></div>
          <div className="glow-square"></div>
        </div>
        
        {/* Glass panel */}
        <div className="glass-panel">
          <div className="panel-content">
            {/* Brand section */}
            <div className="brand-section">
              <img src="logo.png" alt="Logic Length Logo" className="login-logo" />
              <h1 className="site-title">LOGIC<span>LENGTH</span></h1>
              <p className="site-subtitle">Challenge Your Mind, Expand Your Limits</p>
            </div>
            
            {/* Tabs */}
            <div className="auth-tabs">
              <button 
                type="button"
                className={`tab-btn ${isLogin ? 'active' : ''}`} 
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={`tab-btn ${!isLogin ? 'active' : ''}`} 
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
              <div 
                className="tab-indicator" 
                style={{ 
                  left: isLogin ? '0' : '50%',
                  width: '50%'
                }}
              ></div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="error-message">
                <div className="error-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
                  </svg>
                </div>
                <span>{error}</span>
              </div>
            )}
            
            {/* Success message */}
            {success && (
              <div className="success-message">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.119 3.121a1 1 0 001.414 0l5.952-5.95-1.062-1.062-5.6 5.6z"/>
                  </svg>
                </div>
                <span>{success}</span>
              </div>
            )}
            
            {/* Form */}
            <form 
              ref={formRef}
              onSubmit={isLogin ? handleLogin : handleRegister} 
              className="auth-form"
              noValidate
            >
              {/* Username field */}
              <div className={`form-group ${validationErrors.username ? 'has-error' : ''}`}>
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 12a5 5 0 110-10 5 5 0 010 10zm0 2a8 8 0 018 8H4a8 8 0 018-8z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Username"
                  aria-label="Username"
                  required
                />
                <div className="input-highlight"></div>
                {validationErrors.username && (
                  <div className="input-error">{validationErrors.username}</div>
                )}
              </div>
              
              {/* Email field - show for registration or login */}
              <div className={`form-group ${validationErrors.email ? 'has-error' : ''}`}>
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Email Address"
                  aria-label="Email Address"
                  required
                />
                <div className="input-highlight"></div>
                {validationErrors.email && (
                  <div className="input-error">{validationErrors.email}</div>
                )}
              </div>
              
              {/* Password field */}
              <div className={`form-group ${validationErrors.password ? 'has-error' : ''}`}>
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M19 10h1a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V11a1 1 0 011-1h1V9a7 7 0 0114 0v1zm-2 0V9A5 5 0 007 9v1h10zm-6 4v4h2v-4h-2z"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Password"
                  aria-label="Password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    {showPassword ? (
                      <path fill="currentColor" d="M17.882 19.297A10.949 10.949 0 0112 21c-5.392 0-9.878-3.88-10.819-9a10.982 10.982 0 013.34-6.066L1.392 2.808l1.415-1.415 19.799 19.8-1.415 1.414-3.31-3.31zM5.935 7.35A8.965 8.965 0 003.223 12a9.005 9.005 0 0013.201 5.838l-2.028-2.028A4.5 4.5 0 018.19 9.604L5.935 7.35zm6.979 6.978l-3.242-3.242a2.5 2.5 0 003.241 3.241zm7.893 2.264l-1.431-1.43A8.935 8.935 0 0020.777 12 9.005 9.005 0 009.552 5.338L7.974 3.76C9.221 3.27 10.58 3 12 3c5.392 0 9.878 3.88 10.819 9a10.947 10.947 0 01-2.012 4.592zm-9.084-9.084l1.974 1.974a2.5 2.5 0 00-1.974-1.974z"/>
                    ) : (
                      <path fill="currentColor" d="M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9-5.392 0-9.878-3.88-10.819-9C2.121 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 008.777-7 9.005 9.005 0 00-17.554 0A9.005 9.005 0 0012 19zm0-2.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-2a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                    )}
                  </svg>
                </button>
                <div className="input-highlight"></div>
                {validationErrors.password && (
                  <div className="input-error">{validationErrors.password}</div>
                )}
              </div>
              
              {/* Confirm Password field - only for registration */}
              {!isLogin && (
                <div className={`form-group ${validationErrors.confirmPassword ? 'has-error' : ''}`}>
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M19 10h1a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V11a1 1 0 011-1h1V9a7 7 0 0114 0v1zm-2 0V9A5 5 0 007 9v1h10zm-6 4v4h2v-4h-2z"/>
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Confirm Password"
                    aria-label="Confirm Password"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      {showConfirmPassword ? (
                        <path fill="currentColor" d="M17.882 19.297A10.949 10.949 0 0112 21c-5.392 0-9.878-3.88-10.819-9a10.982 10.982 0 013.34-6.066L1.392 2.808l1.415-1.415 19.799 19.8-1.415 1.414-3.31-3.31zM5.935 7.35A8.965 8.965 0 003.223 12a9.005 9.005 0 0013.201 5.838l-2.028-2.028A4.5 4.5 0 018.19 9.604L5.935 7.35zm6.979 6.978l-3.242-3.242a2.5 2.5 0 003.241 3.241zm7.893 2.264l-1.431-1.43A8.935 8.935 0 0020.777 12 9.005 9.005 0 009.552 5.338L7.974 3.76C9.221 3.27 10.58 3 12 3c5.392 0 9.878 3.88 10.819 9a10.947 10.947 0 01-2.012 4.592zm-9.084-9.084l1.974 1.974a2.5 2.5 0 00-1.974-1.974z"/>
                      ) : (
                        <path fill="currentColor" d="M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9-5.392 0-9.878-3.88-10.819-9C2.121 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 008.777-7 9.005 9.005 0 00-17.554 0A9.005 9.005 0 0012 19zm0-2.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-2a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      )}
                    </svg>
                  </button>
                  <div className="input-highlight"></div>
                  {validationErrors.confirmPassword && (
                    <div className="input-error">{validationErrors.confirmPassword}</div>
                  )}
                </div>
              )}
              
              {/* Forgot password - only for login */}
              {isLogin && (
                <div className="forgot-password">
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    alert("Password reset functionality will be implemented soon!");
                  }}>Forgot Password?</a>
                </div>
              )}
              
              {/* Submit button */}
              <button 
                type="submit" 
                className={`submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                <span className="btn-text">
                  {isLogin ? "Sign In" : "Create Account"}
                </span>
                <span className="btn-loader"></span>
              </button>
              
              {/* Divider */}
              <div className="auth-divider">
                <span>or continue with</span>
              </div>
              
              {/* Google sign-in button */}
              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="google-btn"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
                  <path
                    fill="#EA4335"
                    d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
                  />
                </svg>
                {isLoading ? "Please wait..." : "Continue with Google"}
              </button>
            </form>
            
            {/* Footer */}
            <div className="auth-footer">
              <p>
                {isLogin ? "New to LogicLength?" : "Already have an account?"}
                <button 
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setSuccess("");
                    setValidationErrors({});
                  }}
                  className="switch-auth-btn"
                >
                  {isLogin ? "Create an Account" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>
        
        {/* Animated background shapes */}
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      {/* Connection status indicator */}
      <div className={`connection-indicator ${connectionStatus}`}>
        <div className="spinner-icon">
          <div className="spinner-track"></div>
          <div className="spinner-progress"></div>
        </div>
        <span>
          {connectionStatus === "checking" && "Checking connection..."}
          {connectionStatus === "online" && "Connected"}
          {connectionStatus === "offline" && "Offline"}
        </span>
      </div>
    </div>
  );
};

export default Login;
