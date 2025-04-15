import React, { useState, useEffect } from 'react';
import { useAuth } from '../config/AuthContext';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  subscribeToPendingRequests,
  subscribeToFriends
} from '../services/friendsService';
import { getUserProfile } from '../services/userService';

const Friends = () => {
  const { userProfile } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile?.userId) return;

    // Subscribe to friends list updates
    const unsubscribeFriends = subscribeToFriends(userProfile.userId, async (friendsList) => {
      const friendsWithProfiles = await Promise.all(
        friendsList.map(async (friend) => {
          const profile = await getUserProfile(friend.friendId);
          return { ...friend, profile };
        })
      );
      setFriends(friendsWithProfiles);
    });

    // Subscribe to friend requests updates
    const unsubscribeRequests = subscribeToPendingRequests(userProfile.userId, async (requests) => {
      const requestsWithProfiles = await Promise.all(
        requests.map(async (request) => {
          const profile = await getUserProfile(request.senderId);
          return { ...request, profile };
        })
      );
      setPendingRequests(requestsWithProfiles);
    });

    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [userProfile?.userId]);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setSearchResult(null);

    try {
      // Get all users and find by email (in a real app, you'd want a proper users search API)
      const snapshot = await getDocs(collection(db, 'users'));
      const user = snapshot.docs.find(doc => doc.data().email === searchEmail);

      if (user) {
        setSearchResult({ id: user.id, ...user.data() });
      } else {
        setError('User not found');
      }
    } catch (err) {
      setError('Error searching for user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (receiverId) => {
    try {
      await sendFriendRequest(userProfile.userId, receiverId);
      setSearchResult(null);
      setSearchEmail('');
    } catch (err) {
      setError('Error sending friend request');
      console.error(err);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      await acceptFriendRequest(request.id, request.senderId, userProfile.userId);
    } catch (err) {
      setError('Error accepting friend request');
      console.error(err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
    } catch (err) {
      setError('Error rejecting friend request');
      console.error(err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(userProfile.userId, friendId);
    } catch (err) {
      setError('Error removing friend');
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Friends</h2>
      
      {/* Search for friends */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Add Friend</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter friend's email"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {searchResult && (
          <div className="mt-2 p-3 border rounded">
            <p>{searchResult.username || searchResult.email}</p>
            <button
              onClick={() => handleSendRequest(searchResult.id)}
              className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Send Friend Request
            </button>
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Friend Requests</h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded">
                <span>{request.profile?.username || 'Unknown User'}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-lg font-semibold mb-2">My Friends</h3>
        {friends.length === 0 ? (
          <p className="text-gray-500">No friends yet</p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 border rounded">
                <span>{friend.profile?.username || 'Unknown User'}</span>
                <button
                  onClick={() => handleRemoveFriend(friend.friendId)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends; 