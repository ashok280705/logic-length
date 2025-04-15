import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

// Collection references
const FRIENDS_COLLECTION = 'friends';
const FRIEND_REQUESTS_COLLECTION = 'friendRequests';

// Send friend request
export const sendFriendRequest = async (senderId, receiverId) => {
  try {
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, `${senderId}_${receiverId}`);
    await setDoc(requestRef, {
      senderId,
      receiverId,
      status: 'pending',
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

// Accept friend request
export const acceptFriendRequest = async (requestId, senderId, receiverId) => {
  try {
    // Create friend connections for both users
    const friend1Ref = doc(db, FRIENDS_COLLECTION, `${senderId}_${receiverId}`);
    const friend2Ref = doc(db, FRIENDS_COLLECTION, `${receiverId}_${senderId}`);
    
    await setDoc(friend1Ref, {
      userId: senderId,
      friendId: receiverId,
      timestamp: serverTimestamp()
    });
    
    await setDoc(friend2Ref, {
      userId: receiverId,
      friendId: senderId,
      timestamp: serverTimestamp()
    });
    
    // Delete the friend request
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    await deleteDoc(requestRef);
    
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

// Reject/Cancel friend request
export const rejectFriendRequest = async (requestId) => {
  try {
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    await deleteDoc(requestRef);
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

// Remove friend
export const removeFriend = async (userId, friendId) => {
  try {
    const friend1Ref = doc(db, FRIENDS_COLLECTION, `${userId}_${friendId}`);
    const friend2Ref = doc(db, FRIENDS_COLLECTION, `${friendId}_${userId}`);
    
    await deleteDoc(friend1Ref);
    await deleteDoc(friend2Ref);
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

// Get all friends for a user
export const getFriends = async (userId) => {
  try {
    const friendsQuery = query(
      collection(db, FRIENDS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(friendsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

// Get all pending friend requests for a user
export const getPendingRequests = async (userId) => {
  try {
    const requestsQuery = query(
      collection(db, FRIEND_REQUESTS_COLLECTION),
      where('receiverId', '==', userId)
    );
    
    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw error;
  }
};

// Subscribe to friend requests (real-time)
export const subscribeToPendingRequests = (userId, callback) => {
  const requestsQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('receiverId', '==', userId)
  );
  
  return onSnapshot(requestsQuery, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
};

// Subscribe to friends list (real-time)
export const subscribeToFriends = (userId, callback) => {
  const friendsQuery = query(
    collection(db, FRIENDS_COLLECTION),
    where('userId', '==', userId)
  );
  
  return onSnapshot(friendsQuery, (snapshot) => {
    const friends = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(friends);
  });
}; 