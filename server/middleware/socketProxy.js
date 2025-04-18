/**
 * Socket.IO Proxy Middleware
 * This middleware helps handle CORS and caching issues with Socket.IO XHR polling
 */

export default function socketProxyMiddleware(req, res, next) {
  // Only apply to socket.io requests
  if (req.url.includes('/socket.io/')) {
    // Add CORS headers for all socket.io requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Client-Version, If-None-Match, Pragma');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Add cache control headers to prevent caching issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add diagnostic header to help debug
    res.setHeader('X-Socket-Proxy', 'active');
    
    // Log diagnostic info for XHR poll requests
    if (req.url.includes('polling')) {
      console.log(`[Socket Proxy] XHR polling request: ${req.method} ${req.url}`);
      console.log('[Socket Proxy] Request headers:', req.headers);
      console.log('[Socket Proxy] Client IP:', req.ip || req.connection.remoteAddress);
    }
    
    // Immediately respond to OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  next();
}

// Helper function to install the middleware
export function setupSocketProxy(app) {
  // Install middleware
  app.use(socketProxyMiddleware);
  
  // Add special handler for Socket.IO polling errors
  app.use((err, req, res, next) => {
    if (req.url.includes('/socket.io/') && req.url.includes('polling')) {
      console.error('[Socket Proxy] Error handling polling request:', err);
      
      // Try to send a custom error response instead of the default error
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({
          error: 'polling_error',
          message: err.message || 'Unknown polling error',
          code: 400
        });
      }
    }
    
    // Pass to next error handler if not a socket.io polling request
    next(err);
  });
  
  console.log('[Socket Proxy] Socket.IO proxy middleware installed');
  
  return app;
} 