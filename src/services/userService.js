import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Update user balance
export const updateUserBalance = async (userId, amount) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const currentBalance = userDoc.data().balance || 0;
    const newBalance = currentBalance + amount;
    
    await updateDoc(userRef, {
      balance: newBalance
    });
    
    return newBalance;
  } catch (error) {
    console.error("Error updating user balance:", error);
    throw error;
  }
};

// Record game result
export const recordGameResult = async (userId, gameData) => {
  try {
    // Add game to game history
    await addDoc(collection(db, "games"), {
      userId,
      ...gameData,
      timestamp: new Date()
    });
    
    // Update user games played count
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const gamesPlayed = userDoc.data().gamesPlayed || 0;
      await updateDoc(userRef, {
        gamesPlayed: gamesPlayed + 1
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error recording game result:", error);
    throw error;
  }
};

// Get user game history
export const getUserGameHistory = async (userId) => {
  try {
    const gamesQuery = query(collection(db, "games"), where("userId", "==", userId));
    const querySnapshot = await getDocs(gamesQuery);
    
    const games = [];
    querySnapshot.forEach((doc) => {
      games.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() // Convert Firestore timestamp to Date
      });
    });
    
    return games;
  } catch (error) {
    console.error("Error getting game history:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, profileData);
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}; 