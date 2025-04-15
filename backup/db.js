import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Atlas connection string from .env
// Format: mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
const defaultMongoURI = 'mongodb+srv://anujmayekar001:cGFcVsaYqhSlkYpR@cluster0.q8tufbn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  // Log connection strings for debugging
  console.log('=== MongoDB Connection Debugging ===');
  console.log('Default MongoDB URI domain:', defaultMongoURI.includes('@') ? defaultMongoURI.split('@')[1].split('/')[0] : 'unknown');
  console.log('Environment MONGODB_URI domain:', process.env.MONGODB_URI ? (process.env.MONGODB_URI.includes('@') ? process.env.MONGODB_URI.split('@')[1].split('/')[0] : 'not present') : 'not defined');
  console.log('Environment MONGODB_DIRECT_URI set:', !!process.env.MONGODB_DIRECT_URI);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('==================================');

  // Common mongoose options - simplified to avoid unsupported options
  const connectionOptions = {
    serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds instead of 10
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
    maxPoolSize: 50, // Maintain up to 50 socket connections
    minPoolSize: 5,  // Keep at least 5 connections open
    // Remove any options that could cause compatibility issues
    autoIndex: false // Don't build indexes automatically in production
  };

  // First, try the direct connection string if available
  if (process.env.MONGODB_DIRECT_URI) {
    try {
      console.log('Trying direct MongoDB connection...');
      const conn = await mongoose.connect(process.env.MONGODB_DIRECT_URI, connectionOptions);
      console.log(`MongoDB Connected directly: ${conn.connection.host}`);
      setupEventListeners(process.env.MONGODB_DIRECT_URI);
      return conn;
    } catch (directError) {
      console.error('Direct connection failed:', directError.message);
      console.log('Falling back to SRV connection...');
      // Fall through to try the SRV connection below
    }
  }

  // Try the standard SRV connection string
  try {
    // CHANGE: Always try direct connection first on Render
    if (process.env.NODE_ENV === 'production' && process.env.MONGODB_DIRECT_URI) {
      console.log('Production environment detected, using direct MongoDB connection...');
      
      // Use direct connection since we're on Render (likely having DNS SRV issues)
      const conn = await mongoose.connect(process.env.MONGODB_DIRECT_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000
      });
      
      console.log(`MongoDB Connected directly (production): ${conn.connection.host}`);
      setupEventListeners(process.env.MONGODB_DIRECT_URI);
      return conn;
    }
    
    // If not on production or no direct URI is set, try SRV connection
    const mongoURI = process.env.MONGODB_URI || defaultMongoURI;
    
    console.log('Connecting to MongoDB via SRV...');
    
    // Connect using SRV format with minimal options to avoid compatibility issues
    const conn = await mongoose.connect(mongoURI, connectionOptions);
    
    console.log(`MongoDB Connected via SRV: ${conn.connection.host}`);
    
    setupEventListeners(mongoURI);
    
    // Return the connection for awaiting
    return conn;
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    // Special handling for DNS errors
    if (error.message.includes('querySrv ENOTFOUND') || 
        error.message.includes('ENOTFOUND') ||
        error.message.includes('DNS lookup failed')) {
      
      console.error('DNS resolution failed for SRV record. This is common on some hosting providers.');
      console.error('Trying direct connection to MongoDB without SRV...');
      
      // Check if we have a direct URI as fallback
      if (process.env.MONGODB_DIRECT_URI) {
        try {
          console.log('Attempting connection with direct URI (no SRV)...');
          // Use direct connection with minimal options
          const basicOptions = {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
          };
          
          const conn = await mongoose.connect(process.env.MONGODB_DIRECT_URI, basicOptions);
          console.log(`MongoDB Connected via direct URI after DNS failure: ${conn.connection.host}`);
          setupEventListeners(process.env.MONGODB_DIRECT_URI);
          return conn;
        } catch (directError) {
          console.error('Direct connection also failed:', directError.message);
          
          // LAST RESORT: Try hardcoded direct connection string as final fallback
          try {
            console.log('Attempting connection with hardcoded direct URI as last resort...');
            // Hardcoded direct connection string as absolute last resort
            const hardcodedURI = 'mongodb://anujmayekar001:cGFcVsaYqhSlkYpR@ac-msknuzl-shard-00-00.q8tufbn.mongodb.net:27017,ac-msknuzl-shard-00-01.q8tufbn.mongodb.net:27017,ac-msknuzl-shard-00-02.q8tufbn.mongodb.net:27017/?ssl=true&replicaSet=atlas-cnrzsm-shard-0&authSource=admin&retryWrites=true&w=majority';
            
            const conn = await mongoose.connect(hardcodedURI, {
              serverSelectionTimeoutMS: 30000,
              socketTimeoutMS: 45000
            });
            
            console.log(`MongoDB Connected via hardcoded URI: ${conn.connection.host}`);
            setupEventListeners(hardcodedURI);
            return conn;
          } catch (lastError) {
            console.error('All connection attempts failed:', lastError.message);
            throw lastError;
          }
        }
      } else {
        console.error('No MONGODB_DIRECT_URI provided in environment variables for fallback.');
        console.error('Attempting connection with hardcoded direct URI as last resort...');
        
        // LAST RESORT: Try hardcoded direct connection string if no env variable
        try {
          // Hardcoded direct connection string as absolute last resort
          const hardcodedURI = 'mongodb://anujmayekar001:cGFcVsaYqhSlkYpR@ac-msknuzl-shard-00-00.q8tufbn.mongodb.net:27017,ac-msknuzl-shard-00-01.q8tufbn.mongodb.net:27017,ac-msknuzl-shard-00-02.q8tufbn.mongodb.net:27017/?ssl=true&replicaSet=atlas-cnrzsm-shard-0&authSource=admin&retryWrites=true&w=majority';
          
          const conn = await mongoose.connect(hardcodedURI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
          });
          
          console.log(`MongoDB Connected via hardcoded URI: ${conn.connection.host}`);
          setupEventListeners(hardcodedURI);
          return conn;
        } catch (lastError) {
          console.error('All connection attempts failed:', lastError.message);
          throw lastError;
        }
      }
    }
    
    console.error('Please check your MongoDB Atlas credentials in .env file');
    console.error('If using Render or cloud hosting, ensure IP whitelist includes 0.0.0.0/0');
    // Throw the error to be caught by the caller
    throw error;
  }
};

// Function to optimize MongoDB for Atlas connection
function setupIndexes() {
  setTimeout(async () => {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log('Cannot set up indexes, database not connected');
        return;
      }
      
      console.log('Creating optimal indexes for MongoDB Atlas...');
      
      // Import user model
      const User = mongoose.model('User');
      
      // Verify existing indexes
      const userIndexes = await User.collection.indexes();
      console.log('Current User indexes:', userIndexes.map(idx => idx.name));
      
      // Create compound index on fields commonly queried together
      if (!userIndexes.some(idx => idx.name === 'username_email_compound')) {
        await User.collection.createIndex(
          { username: 1, email: 1 },
          { name: 'username_email_compound', background: true }
        );
        console.log('Created compound index on username and email');
      }
      
      // Create index on frequently queried fields
      if (!userIndexes.some(idx => idx.name === 'coins_level_index')) {
        await User.collection.createIndex(
          { coins: -1, level: -1 },
          { name: 'coins_level_index', background: true }
        );
        console.log('Created index on coins and level');
      }
      
      // Create text index for search functionality
      if (!userIndexes.some(idx => idx.name === 'username_text')) {
        await User.collection.createIndex(
          { username: 'text' },
          { 
            name: 'username_text',
            weights: { username: 10 },
            background: true 
          }
        );
        console.log('Created text index on username');
      }
      
      console.log('MongoDB Atlas indexes setup complete');
    } catch (error) {
      console.error('Error setting up indexes:', error);
    }
  }, 5000); // Delay index creation to ensure models are loaded
}

// Setup MongoDB connection event listeners
function setupEventListeners(mongoURI) {
  mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
    setTimeout(() => {
      console.log('Attempting to reconnect to MongoDB...');
      mongoose.connect(mongoURI);
    }, 5000); // Try to reconnect after 5 seconds
  });
  
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(() => {
      mongoose.connect(mongoURI);
    }, 3000); // Try to reconnect after 3 seconds
  });
  
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
    setupIndexes();
  });
  
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
}

export default connectDB; 