// Simple User model for handling payments and transactions
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../src/firebase/firebase.js';

class User {
  static async findById(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return new User(userId, userData);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }
  
  constructor(userId, data = {}) {
    this.userId = userId;
    this.email = data.email || '';
    this.username = data.username || '';
    this.coins = data.coins || 0;
    this.transactions = data.transactions || [];
  }
  
  async addCoins(amount) {
    try {
      const userRef = doc(db, 'users', this.userId);
      
      // Update the coins in Firestore
      await updateDoc(userRef, {
        coins: (this.coins || 0) + amount
      });
      
      // Update the local instance
      this.coins = (this.coins || 0) + amount;
      
      return true;
    } catch (error) {
      console.error('Error adding coins:', error);
      return false;
    }
  }
  
  async save() {
    try {
      const userRef = doc(db, 'users', this.userId);
      
      // Update the user in Firestore
      await updateDoc(userRef, {
        coins: this.coins,
        transactions: this.transactions
      });
      
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  }
}

export default User; 