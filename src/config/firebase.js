import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// Replace these with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyC8USUlOREDnH2Q5qmWbEUgDpPJ_dSro4s", // Using the API key from your env file
  authDomain: "logic-3c2d8.firebaseapp.com", // From your existing FIREBASE_AUTH_DOMAIN
  projectId: "logic-3c2d8", // From your existing FIREBASE_PROJECT_ID
  storageBucket: "logic-3c2d8.appspot.com",
  messagingSenderId: "614855858131", // From your existing FIREBASE_MESSAGING_SENDER_ID
  appId: "1:614855858131:web:c3b095a71721157569c126" // From your existing FIREBASE_APP_ID
};

// Initialize Firebase with proper error handling
let app;
let auth;
let db;

try {
  console.log("Initializing Firebase...");
  app = initializeApp(firebaseConfig);
  
  console.log("Initializing Firebase Auth...");
  auth = getAuth(app);
  
  console.log("Initializing Firestore...");
  db = getFirestore(app);
  
  console.log("Firebase services initialized successfully");
} catch (error) {
  console.error("CRITICAL ERROR: Failed to initialize Firebase:", error);
  
  // Create dummy implementations for graceful degradation
  app = {};
  
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      console.warn("Using dummy auth.onAuthStateChanged");
      // Call the callback with null to indicate no user
      setTimeout(() => callback(null), 1000);
      // Return a dummy unsubscribe function
      return () => {};
    },
    signOut: async () => {
      console.warn("Using dummy auth.signOut");
      localStorage.removeItem('user');
      return Promise.resolve();
    }
  };
  
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => Promise.resolve({
          exists: () => false,
          data: () => null
        }),
        set: async () => Promise.resolve()
      })
    })
  };
}

export { app, auth, db }; 