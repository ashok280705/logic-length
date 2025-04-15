import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { getUserProfile } from './userService';

const USERS_COLLECTION = 'users';

export const sendFriendRequest = async (senderId, receiverEmail) => {
    try {
        // Find receiver by email
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where("email", "==", receiverEmail));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('User not found with this email');
        }

        const receiverDoc = querySnapshot.docs[0];
        const receiverId = receiverDoc.id;
        const receiverData = receiverDoc.data();

        // Check if users are already friends
        if (receiverData.friends?.includes(senderId)) {
            throw new Error('You are already friends with this user');
        }

        // Check if request already exists
        if (receiverData.friendRequests?.some(req => req.senderId === senderId)) {
            throw new Error('Friend request already sent');
        }

        // Add friend request to receiver's profile
        const receiverRef = doc(db, USERS_COLLECTION, receiverId);
        await updateDoc(receiverRef, {
            friendRequests: arrayUnion({
                senderId,
                timestamp: new Date().toISOString()
            })
        });

        return { success: true, message: 'Friend request sent successfully' };
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
};

export const acceptFriendRequest = async (userId, senderId) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const senderRef = doc(db, USERS_COLLECTION, senderId);

        // Get current user's data
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        
        // Check if request exists
        if (!userData.friendRequests?.some(req => req.senderId === senderId)) {
            throw new Error('Friend request not found');
        }

        // Add each user to other's friends list and remove request
        await updateDoc(userRef, {
            friends: arrayUnion(senderId),
            friendRequests: arrayRemove(userData.friendRequests.find(req => req.senderId === senderId))
        });

        await updateDoc(senderRef, {
            friends: arrayUnion(userId)
        });

        return { success: true, message: 'Friend request accepted' };
    } catch (error) {
        console.error('Error accepting friend request:', error);
        throw error;
    }
};

export const rejectFriendRequest = async (userId, senderId) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const request = userData.friendRequests?.find(req => req.senderId === senderId);
        
        if (!request) {
            throw new Error('Friend request not found');
        }

        // Remove the friend request
        await updateDoc(userRef, {
            friendRequests: arrayRemove(request)
        });

        return { success: true, message: 'Friend request rejected' };
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        throw error;
    }
};

export const removeFriend = async (userId, friendId) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const friendRef = doc(db, USERS_COLLECTION, friendId);

        // Remove friend from both users' friends lists
        await updateDoc(userRef, {
            friends: arrayRemove(friendId)
        });

        await updateDoc(friendRef, {
            friends: arrayRemove(userId)
        });

        return { success: true, message: 'Friend removed successfully' };
    } catch (error) {
        console.error('Error removing friend:', error);
        throw error;
    }
}; 