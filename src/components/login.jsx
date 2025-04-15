import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, registerUser, signInWithGoogle } from "../services/authService";
import './login.css'; // We'll create this new CSS file

const Login = ({ setUser, isLogin: initialIsLogin }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin !== false);
  const [formData, setFormData] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const navigate = useNavigate();
  
  // Refs for animation elements
  const bgParticlesRef = useRef(null);
  const glowingCircleRef = useRef(null);
  
  // Update isLogin when the prop changes
  useEffect(() => {
    setIsLogin(initialIsLogin !== false);
  }, [initialIsLogin]);

  // Debug useEffects
  useEffect(() => { console.log("isLogin state:", isLogin); }, [isLogin]);
  useEffect(() => { console.log("formData state:", formData); }, [formData]);

  // Page loading animation with enhanced visuals
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
      setTimeout(() => setAnimateForm(true), 100); // Start form animation after page load
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Background particles animation
  useEffect(() => {
    if (bgParticlesRef.current && !pageLoading) {
      initParticles();
    }
    
    function initParticles() {
      const canvas = bgParticlesRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      let particles = [];
      const particleCount = 100;
      
      // Create particles
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          color: `rgba(${Math.floor(Math.random() * 150) + 100}, ${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 255)}, ${Math.random() * 0.6 + 0.1})`,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 - 0.5
        });
      }
      
      function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          
          // Move particles
          p.x += p.speedX;
          p.y += p.speedY;
          
          // Wrap around edges
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        });
      }
      
      animate();
    }
    
    // Handle resize
    function handleResize() {
      if (bgParticlesRef.current) {
        bgParticlesRef.current.width = window.innerWidth;
        bgParticlesRef.current.height = window.innerHeight;
        initParticles();
      }
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pageLoading]);
  
  // Glowing circle animation
  useEffect(() => {
    if (glowingCircleRef.current && !pageLoading) {
      const circle = glowingCircleRef.current;
      let scale = 1;
      let growing = true;
      
      const animate = () => {
        if (growing) {
          scale += 0.003;
          if (scale >= 1.1) growing = false;
        } else {
          scale -= 0.003;
          if (scale <= 0.9) growing = true;
        }
        
        if (circle) {
          circle.style.transform = `scale(${scale})`;
        }
        requestAnimationFrame(animate);
      };
      
      const animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [pageLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle login with Firebase
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    console.log(`Login attempt for user: ${formData.username}`);
    
    try {
      // Use Firebase email/password authentication
      const userData = await loginUser(formData.email, formData.password);
      
      console.log("Login response:", userData);
      
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        if (setUser) setUser(userData);
        navigate("/home");
      } else {
        throw new Error("Invalid response from authentication");
      }
    } catch (error) {
      console.error("Login failed:", error);
      
      // Handle Firebase specific errors
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

  // Handle registration with Firebase
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Validation
    if (!formData.email || !formData.password || !formData.username) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    
    try {
      // Use Firebase registration
      const userData = await registerUser(formData.email, formData.password, formData.username);
      
      console.log("Registration successful:", userData);
      
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        if (setUser) setUser(userData);
        navigate("/home");
      } else {
        throw new Error("Invalid response from registration");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      
      // Handle Firebase specific errors
      if (error.code === 'auth/email-already-in-use') {
        setError("Email is already registered");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email format");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Use at least 6 characters");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection");
      } else {
        setError(error.message || "Registration failed. Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign In with Firebase
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const userData = await signInWithGoogle();
      
      console.log("Google sign-in successful:", userData);
      
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        if (setUser) setUser(userData);
        navigate("/home");
      } else {
        throw new Error("Invalid response from Google sign-in");
      }
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
      {/* Animated background */}
      <canvas ref={bgParticlesRef} className="background-particles"></canvas>
      
      <div className={`login-container ${animateForm ? 'form-visible' : ''}`}>
        {/* Glowing elements */}
        <div className="glow-container">
          <div ref={glowingCircleRef} className="glow-circle"></div>
          <div className="glow-triangle"></div>
          <div className="glow-square"></div>
        </div>
        
        {/* Glass panel */}
        <div className="glass-panel">
          <div className="panel-content">
            {/* Logo and title */}
            <div className="brand-section">
              <img src="/logo.png" alt="Logic Length Logo" className="login-logo" />
              <h1 className="site-title">LOGIC<span>LENGTH</span></h1>
              <p className="site-subtitle">Challenge Your Mind, Expand Your Limits</p>
            </div>
            
            {/* Tabs for login/register */}
            <div className="auth-tabs">
              <button 
                className={`tab-btn ${isLogin ? 'active' : ''}`} 
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button 
                className={`tab-btn ${!isLogin ? 'active' : ''}`} 
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
              <div className="tab-indicator" style={{ left: isLogin ? '0%' : '50%' }}></div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" className="error-icon">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
              <div className="form-group">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Username"
                  required
                />
                <div className="input-highlight"></div>
              </div>
              
              {!isLogin && (
                <div className="form-group">
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" className="icon">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Email Address"
                    required
                  />
                  <div className="input-highlight"></div>
                </div>
              )}
              
              <div className="form-group">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" className="icon">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" className="icon">
                    {showPassword ? (
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4 0-7-2.5-9-7 1.5-3.5 4-6 7-6 .337 0 .672.021 1 .065m3.42 1.068A9.68 9.68 0 0122 12c-1.5 3.5-3.8 6-6.8 7m-1.042-2.17A3 3 0 019.43 8.18m1.139-1.139a3 3 0 13.986 3.987M3 3l18 18" />
                    ) : (
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm3 0a6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6 6 6 0 016 6zM3 12c0 2.667 1.667 5.333 5 8 3.333-2.667 5-5.333 5-8 0-2.667-1.667-5.333-5-8-3.333 2.667-5 5.333-5 8z" />
                    )}
                  </svg>
                </button>
                <div className="input-highlight"></div>
              </div>
              
              {isLogin && (
                <div className="forgot-password">
                  <a href="#">Forgot Password?</a>
                </div>
              )}
              
              <button 
                type="submit" 
                className={`submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                <span className="btn-text">{isLogin ? "Sign In" : "Create Account"}</span>
                <span className="btn-loader"></span>
              </button>
              
              <div className="auth-divider">
                <span>or continue with</span>
              </div>
              
              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="google-btn"
              >
                <svg viewBox="0 0 24 24" className="google-icon">
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
                <span>{isLoading ? "Please wait..." : "Google"}</span>
              </button>
            </form>
            
            <div className="auth-footer">
              <p>{isLogin ? "New to LogicLength?" : "Already have an account?"}</p>
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="switch-auth-btn"
              >
                {isLogin ? "Create an Account" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
        
        {/* Animated shape decorations */}
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      {/* Connection status indicator */}
      {error && error.includes("Connection attempt") && (
        <div className="connection-indicator">
          <svg className="spinner-icon" viewBox="0 0 24 24">
            <circle className="spinner-track" cx="12" cy="12" r="10"></circle>
            <circle className="spinner-progress" cx="12" cy="12" r="10"></circle>
          </svg>
          <span>Connecting to server...</span>
        </div>
      )}
    </div>
  );
};

export default Login;
