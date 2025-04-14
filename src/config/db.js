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
    
    // Enhanced mongoose options
    const conn = await mongoose.connect(mongoURI, {
      // No need to specify useNewUrlParser, useUnifiedTopology etc. in newer versions
      // These are now default in Mongoose 6+
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add event listeners for connection issues
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please check your MongoDB Atlas credentials in .env file');
    process.exit(1);
  }
};

export default connectDB; 