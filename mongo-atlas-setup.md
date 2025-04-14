# MongoDB Atlas Setup Guide for Logic Length

This guide will help you set up MongoDB Atlas for your Logic Length application.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account or log in if you already have one

## Step 2: Create a New Cluster

1. Click "Build a Database"
2. Choose the "FREE" tier option
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region that's closest to your users
5. Click "Create Cluster" (this may take a few minutes)

## Step 3: Set Up Database Access

1. In the left sidebar, click on "Database Access" under SECURITY
2. Click "Add New Database User"
3. Choose "Password" for Authentication Method
4. Enter a username and password (make it strong and save it securely)
5. For User Privileges, select "Atlas admin" role
6. Click "Add User"

## Step 4: Configure Network Access

1. In the left sidebar, click on "Network Access" under SECURITY
2. Click "Add IP Address"
3. For development, you can select "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, it's safer to add specific IP addresses
4. Click "Confirm"

## Step 5: Get Your Connection String

1. Go back to the "Database" section in the left sidebar
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Choose "Node.js" as your driver and the latest version
5. Copy the connection string provided
6. Replace `<password>` with your database user's password
7. Replace `<dbname>` with "logiclength"

## Step 6: Update Your .env File

1. Open the `.env` file in your project
2. Add or update the MONGODB_URI variable with your connection string:

```
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/logiclength?retryWrites=true&w=majority
```

## Step 7: Test Your Connection

1. Run your server application
2. Check the console logs to make sure it connects successfully
3. If you see "MongoDB Connected" followed by your cluster name, you're all set!

## Troubleshooting

- If you see connection errors, make sure the password in your connection string doesn't contain special characters that need URL encoding
- Check that your IP address is allowed in the Network Access settings
- Verify that your database user has the proper permissions

## Database Schema

The application uses these collections:
- `users` - Stores user accounts, balances, and transactions
- `games` - Stores game history and results
- `transactions` - Stores payment transactions

For any issues, check the MongoDB Atlas documentation or contact support. 