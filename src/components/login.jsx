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
            'rgba(255, 102, 0, ' + this.opacity + ')',  // Orange
            'rgba(0, 191, 255, ' + this.opacity + ')',  // Cyan
            'rgba(255, 51, 153, ' + this.opacity + ')'  // Pink
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
      <div className="new-loading-screen">
        <div className="loading-content">
          <div className="loading-logo-container">
            <div className="loading-logo-glow"></div>
            <img src="/logo.png" alt="Logic Length Logo" className="loading-logo-image" />
          </div>
          <h2 className="loading-title">LOGIC<span>LENGTH</span></h2>
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div className="loading-progress-fill"></div>
            </div>
            <div className="loading-progress-text">Initializing game environment...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-login-wrapper">
      {/* Background elements */}
      <div className="login-bg-gradient"></div>
      <canvas ref={bgParticlesRef} className="login-bg-particles"></canvas>
      <div className="login-bg-grid"></div>
      
      {/* Animated background elements */}
      <div className="animated-shapes">
        <div className="shape shape-hexagon"></div>
        <div className="shape shape-triangle"></div>
        <div className="shape shape-circle"></div>
        <div className="shape shape-square"></div>
      </div>
      
      {/* Main container */}
      <div className={`new-login-container ${animateForm ? 'visible' : ''}`}>
        <div className="login-card">
          {/* Header section */}
          <div className="login-header">
            <div className="login-logo-wrapper">
              <img src="/logo.png" alt="Logic Length Logo" className="login-logo" />
              <div className="login-logo-glow"></div>
            </div>
            <h1 className="login-title">
              LOGIC<span>LENGTH</span>
            </h1>
            <p className="login-subtitle">Challenge Your Mind. Compete. Win.</p>
            
            {/* Game stats banner */}
            <div className="game-stats">
              <div className="stat-item">
                <div className="stat-icon players"></div>
                <div className="stat-info">
                  <div className="stat-value">8.5k+</div>
                  <div className="stat-label">Players</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon games"></div>
                <div className="stat-info">
                  <div className="stat-value">12+</div>
                  <div className="stat-label">Games</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon rewards"></div>
                <div className="stat-info">
                  <div className="stat-value">₹50k+</div>
                  <div className="stat-label">Rewards</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content section */}
          <div className="login-content">
            {/* Auth tabs */}
            <div className="login-tabs">
              <button 
                type="button"
                className={`login-tab ${isLogin ? 'active' : ''}`} 
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={`login-tab ${!isLogin ? 'active' : ''}`} 
                onClick={() => setIsLogin(false)}
              >
                Create Account
              </button>
            </div>
            
            {/* Error and success messages */}
            {error && (
              <div className="login-message error">
                <svg viewBox="0 0 24 24" className="message-icon">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
                </svg>
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="login-message success">
                <svg viewBox="0 0 24 24" className="message-icon">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.119 3.121a1 1 0 001.414 0l5.952-5.95-1.062-1.062-5.6 5.6z"/>
                </svg>
                <p>{success}</p>
              </div>
            )}
            
            {/* Form */}
            <form 
              ref={formRef}
              onSubmit={isLogin ? handleLogin : handleRegister} 
              className="login-form"
              noValidate
            >
              {/* Username field */}
              <div className={`form-field ${validationErrors.username ? 'error' : ''}`}>
                <label htmlFor="username" className="field-label">Username</label>
                <div className="field-wrapper">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="field-input"
                    placeholder="Enter your username"
                    required
                  />
                  <svg className="field-icon" viewBox="0 0 24 24">
                    <path d="M12 12a5 5 0 110-10 5 5 0 010 10zm0 2a8 8 0 018 8H4a8 8 0 018-8z"/>
                  </svg>
                </div>
                {validationErrors.username && (
                  <div className="field-error">{validationErrors.username}</div>
                )}
              </div>
              
              {/* Email field */}
              <div className={`form-field ${validationErrors.email ? 'error' : ''}`}>
                <label htmlFor="email" className="field-label">Email Address</label>
                <div className="field-wrapper">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="field-input"
                    placeholder="Enter your email address"
                    required
                  />
                  <svg className="field-icon" viewBox="0 0 24 24">
                    <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z"/>
                  </svg>
                </div>
                {validationErrors.email && (
                  <div className="field-error">{validationErrors.email}</div>
                )}
              </div>
              
              {/* Password field */}
              <div className={`form-field ${validationErrors.password ? 'error' : ''}`}>
                <label htmlFor="password" className="field-label">Password</label>
                <div className="field-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="field-input"
                    placeholder="Enter your password"
                    required
                  />
                  <svg className="field-icon" viewBox="0 0 24 24">
                    <path d="M19 10h1a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V11a1 1 0 011-1h1V9a7 7 0 0114 0v1zm-2 0V9A5 5 0 007 9v1h10zm-6 4v4h2v-4h-2z"/>
                  </svg>
                  <button 
                    type="button" 
                    className="password-toggle-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M17.882 19.297A10.949 10.949 0 0112 21c-5.392 0-9.878-3.88-10.819-9a10.982 10.982 0 013.34-6.066L1.392 2.808l1.415-1.415 19.799 19.8-1.415 1.414-3.31-3.31zM5.935 7.35A8.965 8.965 0 003.223 12a9.005 9.005 0 0013.201 5.838l-2.028-2.028A4.5 4.5 0 018.19 9.604L5.935 7.35zm6.979 6.978l-3.242-3.242a2.5 2.5 0 003.241 3.241zm7.893 2.264l-1.431-1.43A8.935 8.935 0 0020.777 12 9.005 9.005 0 009.552 5.338L7.974 3.76C9.221 3.27 10.58 3 12 3c5.392 0 9.878 3.88 10.819 9a10.947 10.947 0 01-2.012 4.592zm-9.084-9.084l1.974 1.974a2.5 2.5 0 00-1.974-1.974z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9-5.392 0-9.878-3.88-10.819-9C2.121 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 008.777-7 9.005 9.005 0 00-17.554 0A9.005 9.005 0 0012 19zm0-2.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-2a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <div className="field-error">{validationErrors.password}</div>
                )}
              </div>
              
              {/* Confirm Password field - only for registration */}
              {!isLogin && (
                <div className={`form-field ${validationErrors.confirmPassword ? 'error' : ''}`}>
                  <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
                  <div className="field-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="field-input"
                      placeholder="Confirm your password"
                      required
                    />
                    <svg className="field-icon" viewBox="0 0 24 24">
                      <path d="M19 10h1a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V11a1 1 0 011-1h1V9a7 7 0 0114 0v1zm-2 0V9A5 5 0 007 9v1h10zm-6 4v4h2v-4h-2z"/>
                    </svg>
                    <button 
                      type="button" 
                      className="password-toggle-btn" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg viewBox="0 0 24 24">
                          <path d="M17.882 19.297A10.949 10.949 0 0112 21c-5.392 0-9.878-3.88-10.819-9a10.982 10.982 0 013.34-6.066L1.392 2.808l1.415-1.415 19.799 19.8-1.415 1.414-3.31-3.31zM5.935 7.35A8.965 8.965 0 003.223 12a9.005 9.005 0 0013.201 5.838l-2.028-2.028A4.5 4.5 0 018.19 9.604L5.935 7.35zm6.979 6.978l-3.242-3.242a2.5 2.5 0 003.241 3.241zm7.893 2.264l-1.431-1.43A8.935 8.935 0 0020.777 12 9.005 9.005 0 009.552 5.338L7.974 3.76C9.221 3.27 10.58 3 12 3c5.392 0 9.878 3.88 10.819 9a10.947 10.947 0 01-2.012 4.592zm-9.084-9.084l1.974 1.974a2.5 2.5 0 00-1.974-1.974z"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path d="M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9-5.392 0-9.878-3.88-10.819-9C2.121 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 008.777-7 9.005 9.005 0 00-17.554 0A9.005 9.005 0 0012 19zm0-2.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-2a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <div className="field-error">{validationErrors.confirmPassword}</div>
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
                className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                <span className="btn-text">
                  {isLogin ? "Sign In" : "Create Account"}
                </span>
                {isLoading && <span className="btn-loading-spinner"></span>}
                <span className="btn-glow"></span>
              </button>
            </form>
            
            {/* Social login section */}
            <div className="social-login">
              <div className="divider">
                <span>or continue with</span>
              </div>
              
              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="google-login-btn"
              >
                <svg viewBox="0 0 24 24" className="google-icon">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="google-btn-text">Continue with Google</span>
              </button>
            </div>
            
            {/* Switch between login/register */}
            <div className="login-footer">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
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
                  {isLogin ? "Create Account" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection status indicator */}
      <div className={`connection-status ${connectionStatus}`}>
        <div className="status-icon"></div>
        <span className="status-text">
          {connectionStatus === "checking" && "Checking connection..."}
          {connectionStatus === "online" && "Online"}
          {connectionStatus === "offline" && "Offline Mode"}
        </span>
      </div>
    </div>
  );
};

export default Login;
