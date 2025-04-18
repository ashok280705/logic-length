# Deploying to Render with WebSocket Support

This guide explains how to deploy your application to Render.com with proper WebSocket support to avoid connection issues.

## Key Configuration Steps

### 1. Server Configuration

The server has been updated with several important changes:

- Increased timeouts for WebSocket connections
- Added session recovery mechanisms
- Improved reconnection handling
- Added ping/pong heartbeat mechanism

### 2. Environment Variables

Make sure these environment variables are set in your Render dashboard:

- `NODE_ENV=production`
- `PORT=10000` (or whatever port you prefer)
- `RENDER=true`
- `RENDER_EXTERNAL_URL=https://your-app-url.onrender.com`

### 3. Client Configuration 

The client code has been updated to:

- Store session information for recovery
- Handle reconnections gracefully
- Detect network changes
- Monitor connection health

## Deployment Instructions

1. **Push your changes to GitHub**

2. **Set up your Render service**:
   - Create a new Web Service
   - Connect your GitHub repository
   - Use the following settings:
     - Build Command: `npm install`
     - Start Command: `node server/index.js`
     - Set the environment variables listed above

3. **Configure WebSocket Headers**:
   - Go to your service settings
   - Under "Headers", add:
     - `Connection: keep-alive`
     - `Access-Control-Allow-Origin: *` (or your specific domain)
     - `Access-Control-Allow-Methods: GET, POST, OPTIONS`

4. **Set appropriate timeouts**:
   - In your Render dashboard, go to your service settings
   - Look for advanced configuration options
   - Set HTTP timeout to at least 60 seconds

## Troubleshooting WebSocket Issues

If you still experience WebSocket issues:

1. **Check the server logs** for connection errors
2. **Verify client reconnection** is working properly
3. **Test with WebSocket debugging tools** like [WebSocket King](https://websocketking.com/)
4. **Ensure your frontend URL** is correctly included in the CORS configuration

### Common Issues

- **30s disconnect**: Render has a 30-second timeout for inactive connections. The ping/pong mechanism should prevent this.
- **CORS errors**: Make sure your client origin is properly listed in the CORS configuration.
- **Connection refused**: Check if your Render service is running correctly.

## Monitoring

Monitor your application's WebSocket connections by:

1. Checking the Render logs for connection/disconnection events
2. Using the browser console to view socket.io connection status
3. Setting up alerts for failed reconnection attempts

## Render.yaml Configuration

A `render.yaml` file has been added to the repository with the correct configuration for WebSocket support. This ensures consistent deployment settings. 