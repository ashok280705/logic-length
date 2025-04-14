import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Atlas connection string - you will need to replace this with your own
// Format: mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
const defaultMongoURI = 'mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/logiclength?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    // Use environment variable if available, otherwise use the default connection string
    const mongoURI = process.env.MONGODB_URI || defaultMongoURI;
    
    console.log('Connecting to MongoDB...');
    
    // Enhanced mongoose options for cloud deployment
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds instead of 10
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
      maxPoolSize: 50, // Maintain up to 50 socket connections
      minPoolSize: 5,  // Keep at least 5 connections open
      heartbeatFrequencyMS: 15000, // Check connection every 15 seconds
      autoIndex: false, // Don't build indexes automatically in production
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add event listeners for connection issues
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
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    // Return the connection for awaiting
    return conn;
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please check your MongoDB Atlas credentials in .env file');
    console.error('If using Render or cloud hosting, ensure IP whitelist includes 0.0.0.0/0');
    // Throw the error to be caught by the caller
    throw error;
  }
};

export default connectDB; 