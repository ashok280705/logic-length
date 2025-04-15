import React, { useState, useEffect } from 'react';
import { useAuth } from '../config/AuthContext';
import { updateUserProfile } from '../services/userService';
import { logoutUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // Initialize form data when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        bio: userProfile.bio || ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!currentUser) throw new Error("You must be logged in");
      
      await updateUserProfile(currentUser.uid, {
        username: formData.username,
        bio: formData.bio,
        updatedAt: new Date()
      });
      
      setSuccessMessage("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out");
    }
  };

  if (loading) {
    return <div className="loading">Loading user data...</div>;
  }

  if (!currentUser || !userProfile) {
    return (
      <div className="not-logged-in">
        <h2>Not logged in</h2>
        <p>Please log in to view your profile</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {userProfile.username ? userProfile.username[0].toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <h3>{userProfile.username || 'User'}</h3>
            <p className="email">{currentUser.email}</p>
          </div>
        </div>
        
        {!editMode ? (
          <div className="profile-details">
            <div className="detail-item">
              <span className="label">Username:</span>
              <span className="value">{userProfile.username || 'Not set'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Bio:</span>
              <span className="value">{userProfile.bio || 'No bio provided'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Balance:</span>
              <span className="value">{userProfile.balance || 0} coins</span>
            </div>
            <div className="detail-item">
              <span className="label">Games Played:</span>
              <span className="value">{userProfile.gamesPlayed || 0}</span>
            </div>
            <div className="detail-item">
              <span className="label">Account Created:</span>
              <span className="value">
                {userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            
            <div className="profile-actions">
              <button 
                className="edit-button" 
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
              <button 
                className="logout-button" 
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                maxLength={200}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setEditMode(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-button"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 