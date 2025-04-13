// firebaseConfig.js

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8USUlOREDnH2Q5qmWbEUgDpPJ_dSro4s",
  authDomain: "logic-3c2d8.firebaseapp.com",
  projectId: "logic-3c2d8",
  storageBucket: "logic-3c2d8.firebasestorage.app",
  messagingSenderId: "614855858131",
  appId: "1:614855858131:web:c3b095a71721157569c126",
  measurementId: "G-9DEWLF5SRF"
};

// Initialize Firebase with a name to prevent duplicate apps
let app;
try {
  app = initializeApp(firebaseConfig, "logic-length-app");
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error", error);
  // If already initialized, use the existing app
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Add multiple scopes for Google authentication
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({
  'prompt': 'select_account',
  'login_hint': '', // This can be set to a default email if needed
  'access_type': 'offline', // Get refresh token for offline access
});

// Function to handle Google Sign-In
export const signInWithGoogle = () => {
  console.log("Starting Google Sign-In process...");
  console.log("Auth provider:", provider);
  
  return signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      
      console.log("Google Sign-In successful for:", user.displayName);
      console.log("User email:", user.email);
      console.log("User ID:", user.uid);
      console.log("Access token:", token?.substring(0, 10) + "..." || "No token");
      
      // Create a custom user object with needed fields
      const customUser = {
        id: user.uid,
        username: user.displayName || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        coins: 50, // Default coins for new Google users
        level: 1,
        xp: 0
      };
      
      return customUser;
    })
    .catch((error) => {
      // Handle Errors here
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      
      console.error("Google Sign-In Error:", errorCode, errorMessage);
      console.error("Error details:", {
        errorCode,
        errorMessage,
        email,
        credential: credential ? "Available" : "Not available"
      });
      
      if (errorCode === 'auth/popup-closed-by-user') {
        console.error("Sign-in popup was closed by the user before completing the sign-in process.");
      } else if (errorCode === 'auth/popup-blocked') {
        console.error("The sign-in popup was blocked by the browser (probably by a popup blocker).");
        alert("Please allow popups for this website to use Google Sign-In.");
      } else if (errorCode === 'auth/cancelled-popup-request') {
        console.error("Another popup is already open.");
      } else if (errorCode === 'auth/network-request-failed') {
        console.error("Network error occurred during authentication.");
        alert("Network error. Please check your internet connection and try again.");
      } else if (errorCode === 'auth/internal-error') {
        console.error("Internal error occurred during authentication.");
      }
      
      return null;
    });
};
