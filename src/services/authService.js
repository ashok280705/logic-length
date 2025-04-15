import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Register new user
export const registerUser = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      username: username,
      email: email,
      createdAt: new Date(),
      balance: 0,
      gamesPlayed: 0
    });
    
    return {
      userId: user.uid,
      username,
      email: user.email
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        userId: user.uid,
        username: userData.username,
        email: user.email
      };
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in database
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document if first time login
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        username: user.displayName || `user_${Date.now().toString().slice(-4)}`,
        email: user.email,
        createdAt: new Date(),
        balance: 0,
        gamesPlayed: 0
      });
    }
    
    const userData = userDoc.exists() ? userDoc.data() : {
      userId: user.uid,
      username: user.displayName,
      email: user.email
    };
    
    return userData;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Get current authenticated user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Check if user is logged in
export const isUserLoggedIn = () => {
  return !!auth.currentUser;
}; 