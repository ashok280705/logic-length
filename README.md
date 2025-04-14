# Multiplayer Game Platform

A gaming platform with various games including a real-time multiplayer Tic Tac Toe using Socket.io.

## Deployment Instructions

### Server Deployment on Render

1. Create an account on [Render](https://render.com/)
2. Create a new Web Service
3. Connect to your GitHub repository
4. Configure the service:
   - Name: `multiplayer-game-server` (or any name)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
   
5. Add environment variables:
   - `PORT`: `10000` (Render will use this internally)
   - `NODE_ENV`: `production`

6. After deployment, note your service URL (something like `https://multiplayer-game-server.onrender.com`)

### Frontend Configuration

1. Update the `.env` file:
   ```
   VITE_SERVER_URL=https://your-render-service-url.onrender.com
   ```

2. Rebuild the frontend with `npm run build`

3. Deploy the frontend (you can also use Render's Static Site service for this)

## Local Development

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Start the backend server: `npm run server`

## Technologies Used

- React
- Socket.io for real-time multiplayer
- Express.js backend
- Tailwind CSS for UI
- MongoDB Atlas for user data storage

## User Authentication

The platform offers multiple authentication options:

1. **Username-Password Registration**:
   - Users can create an account using just a username and password
   - Email is optional but can be added for account recovery
   - Registration grants 50 coins as a welcome bonus

2. **Google Sign-In**:
   - Users can sign in with their Google account
   - Auto-generates a username based on the Google display name

## Database Connection

The application uses MongoDB Atlas for data storage:
- Connection strings are stored in `.env` file
- Supports both SRV and direct connection formats
- Automatic fallback mechanism for better reliability
