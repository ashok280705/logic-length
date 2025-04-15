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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 