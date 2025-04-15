import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';

const router = express.Router();

// Test auth route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('Registration attempt:', { username, email: email ? email.substring(0, 3) + '***' : 'none' });
    
    // Enhanced validation
    if (!username || username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    if (email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    
    try {
      // Check if user already exists
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      
      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ message: 'Email is already registered' });
        }
      }
  
      // Create new user with default values
      const user = new User({
        username,
        email: email || '',
        password,
        coins: 50,       // Default starting coins
        level: 1,        // Starting level
        xp: 0,           // Starting XP
        transactions: [  // Initial bonus transaction
          {
            amount: 50,
            type: 'bonus',
            date: new Date(),
            orderId: `welcome-${Date.now()}`,
            paymentId: `welcome-${Date.now()}`
          }
        ]
      });
  
      console.log('Saving new user to database...');
      await user.save();
      
      // Return success with user info but WITHOUT password
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        level: user.level,
        xp: user.xp
      };
      
      console.log('User registered successfully:', username);
      return res.status(201).json({ 
        message: 'Registration successful! You can now log in.',
        success: true,
        user: userData
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      if (dbError.name === 'MongoServerError' && dbError.code === 11000) {
        // Duplicate key error
        return res.status(400).json({ message: 'Username or email already exists' });
      } else if (dbError.name === 'ValidationError') {
        // Mongoose validation error
        const errors = Object.values(dbError.errors).map(err => err.message);
        return res.status(400).json({ message: errors.join(', ') });
      }
      throw dbError; // Re-throw for the outer catch
    }
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', username);
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ 
      $or: [
        { username: username },
        { email: username } // Allow login with email too
      ]
    });
    
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Check password using the method defined in the User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Login failed: Invalid password');
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Send user data (excluding password)
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins || 0,
      transactions: user.transactions || [],
      level: user.level || 1,
      xp: user.xp || 0,
      photoURL: user.photoURL || null
    };

    console.log('User logged in successfully:', username);
    console.log('User coins balance:', user.coins);
    
    return res.status(200).json({
      message: 'Login successful',
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Server error during login', 
      error: error.message,
      success: false
    });
  }
});

// Google sign-in handler endpoint
router.post('/google-signin', async (req, res) => {
  try {
    const { email, displayName, googleId, photoURL } = req.body;
    
    console.log('Google sign-in attempt for:', email);
    
    // Try to find user by email first
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists, update Google-related fields if needed
      console.log('Existing user found:', user.username);
      
      // Optionally update user details if provided and different
      if (displayName && user.username !== displayName) {
        // Don't immediately update username as it might collide with existing usernames
        console.log('Username differs from Google display name');
      }
      
      // Send user data
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins || 0,
        transactions: user.transactions || [],
        level: user.level || 1,
        xp: user.xp || 0,
        googleId: googleId
      };
      
      return res.json({ success: true, user: userData });
    } else {
      // No user with this email, create a new one
      console.log('Creating new user from Google sign-in');
      
      // Generate a unique username based on displayName
      let username = displayName.replace(/\s+/g, '').toLowerCase();
      const baseUsername = username;
      let counter = 1;
      
      // Check if username exists and generate unique one
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Create a random password for the user
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      // Create new user with Google data
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        coins: 50, // Default coins for new users
        googleId,
        photoURL
      });
      
      await newUser.save();
      console.log('New user created from Google sign-in:', username);
      
      // Send new user data
      const userData = {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        coins: newUser.coins || 0,
        transactions: newUser.transactions || [],
        level: 1,
        xp: 0,
        googleId
      };
      
      return res.json({ success: true, user: userData });
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error processing Google sign-in',
      error: error.message 
    });
  }
});

// Update user data endpoint (for saving data when logging out)
router.post('/update-user', async (req, res) => {
  try {
    const { userId, coins, level, xp, transactions } = req.body;
    
    console.log('Updating user data for ID:', userId);
    console.log('New coins balance:', coins);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (coins !== undefined) user.coins = coins;
    if (level !== undefined) user.level = level;
    if (xp !== undefined) user.xp = xp;
    
    // If transactions array is provided, append new ones
    if (transactions && Array.isArray(transactions) && transactions.length > 0) {
      // Only add transactions that don't already exist (based on paymentId)
      const existingPaymentIds = user.transactions.map(t => t.paymentId);
      
      transactions.forEach(transaction => {
        if (!transaction.paymentId || !existingPaymentIds.includes(transaction.paymentId)) {
          user.transactions.push(transaction);
        }
      });
    }
    
    // Save the updated user
    await user.save();
    
    console.log('User data updated successfully');
    return res.json({ 
      success: true, 
      message: 'User data updated successfully' 
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error updating user data',
      error: error.message 
    });
  }
});

export default router; 