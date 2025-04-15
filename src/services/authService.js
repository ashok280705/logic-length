import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, collection } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Register new user
export const registerUser = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a new user document in Firestore
    const userData = {
      userId: user.uid,
      email: user.email,
      username: username || email.split('@')[0],
      coins: 1000, // Starting coins for new users
      transactions: [{
        amount: 1000,
        type: 'welcome_bonus',
        date: new Date().toISOString()
      }],
      gameHistory: [],
      created: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), userData);
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('currentUser', email);
    
    return {
      success: true,
      user: userData
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch user data from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let userData;
    
    if (userDoc.exists()) {
      // Get the existing user data
      userData = userDoc.data();
    } else {
      // Create a new user record if it doesn't exist
      userData = {
        userId: user.uid,
        email: user.email,
        username: user.displayName || email.split('@')[0],
        coins: 0,
        transactions: [],
        gameHistory: [],
        created: new Date().toISOString()
      };
      
      await setDoc(userDocRef, userData);
    }
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify({
      ...userData,
      userId: user.uid,
      email: user.email
    }));
    
    localStorage.setItem('currentUser', email);
    
    return {
      success: true,
      user: userData
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if the user already exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let userData;
    
    if (userDoc.exists()) {
      // Get the existing user data
      userData = userDoc.data();
    } else {
      // Create a new user record if it doesn't exist
      userData = {
        userId: user.uid,
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        coins: 1000, // Starting coins for new users
        transactions: [{
          amount: 1000,
          type: 'welcome_bonus',
          date: new Date().toISOString()
        }],
        gameHistory: [],
        created: new Date().toISOString()
      };
      
      await setDoc(userDocRef, userData);
    }
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify({
      ...userData,
      userId: user.uid,
      email: user.email
    }));
    
    localStorage.setItem('currentUser', user.email);
    
    return {
      success: true,
      user: userData
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    return {
      success: true
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: error.message
    };
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

// Update user coin balance in Firebase
export const updateUserCoins = async (amount, transactionType = 'update', gameType = null) => {
  try {
    console.log("Starting coin update process with amount:", amount);
    
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error("No user data found in localStorage");
      return { success: false, error: "User not found" };
    }
    
    // Try to parse user data
    let userData;
    try {
      userData = JSON.parse(userStr);
    } catch (e) {
      console.error("Error parsing user data:", e);
      return { success: false, error: "Invalid user data format" };
    }
    
    // Validate minimum required user data
    if (!userData || !userData.userId) {
      console.error("Invalid user data structure:", userData);
      
      // Handle special case - add coins directly to localStorage if Firebase fails
      console.log("Attempting localStorage-only fallback...");
      
      try {
        // Calculate new coin balance
        const currentCoins = userData?.coins || 0;
        const newCoins = Math.max(0, currentCoins + amount);
        
        // Create transaction record
        const transaction = {
          amount: amount,
          type: transactionType,
          date: new Date().toISOString()
        };
        
        if (gameType) {
          transaction.gameType = gameType;
        }
        
        // Update localStorage with new data
        const updatedUserData = {
          ...userData,
          coins: newCoins,
          transactions: [...(userData?.transactions || []), transaction]
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('coinBalanceUpdated', {
          detail: {
            newBalance: newCoins,
            userData: updatedUserData
          }
        }));
        
        console.log("localStorage fallback successful with new balance:", newCoins);
        
        return {
          success: true,
          coins: newCoins,
          userData: updatedUserData
        };
      } catch (fallbackError) {
        console.error("localStorage fallback failed:", fallbackError);
        return { success: false, error: "Invalid user data" };
      }
    }
    
    const userId = userData.userId;
    
    // Attempt to connect to Firebase
    try {
      // Get latest user data from Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error("User document not found in Firestore");
        return { success: false, error: "User not found in database" };
      }
      
      const firestoreUserData = userDoc.data();
      const currentCoins = firestoreUserData.coins || 0;
      const newCoins = Math.max(0, currentCoins + amount);
      
      // Create transaction record
      const transaction = {
        amount: amount,
        type: transactionType,
        date: new Date().toISOString()
      };
      
      if (gameType) {
        transaction.gameType = gameType;
      }
      
      // Update Firestore
      await updateDoc(userDocRef, {
        coins: newCoins,
        transactions: [...(firestoreUserData.transactions || []), transaction]
      });
      
      // Update localStorage with latest data from Firestore
      const updatedUserData = {
        ...firestoreUserData,
        coins: newCoins,
        transactions: [...(firestoreUserData.transactions || []), transaction]
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('coinBalanceUpdated', {
        detail: {
          newBalance: newCoins,
          userData: updatedUserData
        }
      }));
      
      console.log("Firebase update successful with new balance:", newCoins);
      
      return {
        success: true,
        coins: newCoins,
        userData: updatedUserData
      };
    } catch (firebaseError) {
      console.error("Firebase update failed:", firebaseError);
      
      // Fall back to localStorage only if Firebase fails
      console.log("Firebase failed, attempting localStorage-only fallback...");
      
      try {
        // Calculate new coin balance
        const currentCoins = userData.coins || 0;
        const newCoins = Math.max(0, currentCoins + amount);
        
        // Create transaction record
        const transaction = {
          amount: amount,
          type: transactionType,
          date: new Date().toISOString()
        };
        
        if (gameType) {
          transaction.gameType = gameType;
        }
        
        // Update localStorage with new data
        const updatedUserData = {
          ...userData,
          coins: newCoins,
          transactions: [...(userData.transactions || []), transaction]
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('coinBalanceUpdated', {
          detail: {
            newBalance: newCoins,
            userData: updatedUserData
          }
        }));
        
        console.log("localStorage fallback successful with new balance:", newCoins);
        
        return {
          success: true,
          coins: newCoins,
          userData: updatedUserData
        };
      } catch (fallbackError) {
        console.error("Both Firebase and localStorage fallback failed:", fallbackError);
        return { success: false, error: "Failed to update coins" };
      }
    }
  } catch (error) {
    console.error("Error in updateUserCoins:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get latest user data from Firebase
export const getUserDataFromFirebase = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return { success: false, error: "No user data in localStorage" };
    }
    
    const userData = JSON.parse(userStr);
    const userId = userData.userId;
    
    if (!userId) {
      return { success: false, error: "Invalid user data" };
    }
    
    // Get fresh data from Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found in database" };
    }
    
    const firestoreUserData = userDoc.data();
    
    // Update localStorage with latest Firebase data
    localStorage.setItem('user', JSON.stringify({
      ...firestoreUserData,
      userId: userId,
      email: userData.email
    }));
    
    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent('coinBalanceUpdated', {
      detail: {
        newBalance: firestoreUserData.coins,
        userData: firestoreUserData
      }
    }));
    
    return {
      success: true,
      userData: firestoreUserData
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}; 