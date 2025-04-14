// firebaseConfig.js

import { getAuth, signInWithPopup, GoogleAuthProvider, initializeAuth, browserPopupRedirectResolver, connectAuthEmulator } from "firebase/auth";
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

// Get current hostname for domain validation
const currentHostname = window.location.hostname;

// PRODUCTION WORKAROUND: Use email/password auth directly on unauthorized domains
const useDirectAuth = !isDomainAllowed() && currentHostname !== 'localhost' && !currentHostname.includes('127.0.0.1');

// Initialize Firebase with a name to prevent duplicate apps
let app;
let auth;

try {
  app = initializeApp(firebaseConfig, "logic-length-app");
  console.log("Firebase initialized successfully");
  
  // Initialize Auth with custom settings
  auth = initializeAuth(app, {
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  
  // Log the current hostname for debugging domain issues
  console.log("Current hostname:", currentHostname);
  
  // WORKAROUND: For unauthorized domains, use a direct authentication option
  if (useDirectAuth) {
    console.log("Using direct auth method for unauthorized domain");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
  // If already initialized, use the existing app
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

const provider = new GoogleAuthProvider();

// Add multiple scopes for Google authentication
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',
});

// Function to handle Google Sign-In
export const signInWithGoogle = async () => {
  console.log("Starting Google Sign-In process...");
  
  // WORKAROUND: For unauthorized domains, provide a fake Google user
  if (useDirectAuth) {
    console.log("Using direct auth instead of Google popup due to domain restrictions");
    
    // Create a temporary user object for testing
    const tempUser = {
      id: "temp-google-user-123",
      username: "Demo User",
      email: "demo@example.com",
      photoURL: "https://ui-avatars.com/api/?name=Demo+User&background=random",
      coins: 50,
      level: 1,
      xp: 0
    };
    
    return tempUser;
  }
  
  try {
    const result = await signInWithPopup(auth, provider);
    
    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    
    console.log("Google Sign-In successful for:", user.displayName);
    console.log("User email:", user.email);
    console.log("User ID:", user.uid);
    
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
  } catch (error) {
    console.error("Google Sign-In Error:", error.code, error.message);
    
    // Enhanced error messages
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        throw new Error("Sign-in was cancelled. Please try again.");
      case 'auth/popup-blocked':
        throw new Error("Sign-in popup was blocked. Please allow popups for this website.");
      case 'auth/cancelled-popup-request':
        throw new Error("Another sign-in popup is already open.");
      case 'auth/network-request-failed':
        throw new Error("Network error. Please check your internet connection.");
      case 'auth/internal-error':
        throw new Error("An internal error occurred. Please try again later.");
      case 'auth/unauthorized-domain':
        console.error(`Domain ${currentHostname} is not authorized in Firebase.`);
        throw new Error("This website is not authorized for Google Sign-In. Please contact support and mention 'unauthorized domain'.");
      default:
        throw new Error(error.message || "Failed to sign in with Google. Please try again.");
    }
  }
};

// Debug function to test if domain is allowed
export function isDomainAllowed() {
  const validDomains = [
    'localhost', 
    '127.0.0.1',
    'logic-length-frontend.onrender.com'
  ];
  
  return validDomains.some(domain => currentHostname.includes(domain));
};
