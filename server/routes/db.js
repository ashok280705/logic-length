import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/db/status
 * @desc    Get MongoDB connection status
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    // Check MongoDB connection state
    const isConnected = mongoose.connection.readyState === 1;
    
    // Get start time to measure latency
    const startTime = Date.now();
    
    let dbInfo = {
      status: isConnected ? 'connected' : 'disconnected',
      database: mongoose.connection.name || 'Unknown',
      host: mongoose.connection.host || 'Unknown',
      readyState: mongoose.connection.readyState,
      connected: isConnected
    };
    
    // If connected, try to ping the database to get actual response time
    if (isConnected) {
      try {
        // Simple command to ping database
        await mongoose.connection.db.admin().ping();
        
        // Calculate latency
        const latency = Date.now() - startTime;
        dbInfo.latency = latency;
        
        // Get MongoDB version
        const serverInfo = await mongoose.connection.db.admin().serverInfo();
        dbInfo.version = serverInfo.version;
        
        // Get more stats if needed
        const dbStats = await mongoose.connection.db.stats();
        dbInfo.collections = dbStats.collections;
        dbInfo.objects = dbStats.objects;
        dbInfo.avgObjSize = dbStats.avgObjSize;
        dbInfo.dataSize = dbStats.dataSize;
        
      } catch (pingError) {
        console.error('Error pinging MongoDB:', pingError);
        dbInfo.pingError = pingError.message;
        dbInfo.status = 'error';
      }
    }
    
    return res.json(dbInfo);
    
  } catch (error) {
    console.error('Error checking database status:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to check database status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/db/collections
 * @desc    Get list of collections
 * @access  Public
 */
router.get('/collections', async (req, res) => {
  try {
    // Check if connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database not connected', 
        readyState: mongoose.connection.readyState 
      });
    }
    
    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return res.json({ 
      collections: collections.map(c => c.name),
      count: collections.length
    });
    
  } catch (error) {
    console.error('Error getting collections:', error);
    return res.status(500).json({ 
      message: 'Failed to get collections',
      error: error.message
    });
  }
});

export default router; 