import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '../services/userService';

// Create auth context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          // User is signed in
          setCurrentUser(user);
          
          try {
            // Get user profile from Firestore
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);
            
            // Store in localStorage for persistence
            localStorage.setItem('user', JSON.stringify({
              userId: user.uid,
              username: profile.username,
              email: user.email
            }));
          } catch (profileError) {
            console.error("Error loading user profile:", profileError);
            // Still set basic user info even if profile failed
            setUserProfile({
              userId: user.uid,
              username: user.displayName || user.email.split('@')[0],
              email: user.email
            });
          }
        } else {
          // User is signed out
          setCurrentUser(null);
          setUserProfile(null);
          localStorage.removeItem('user');
        }
        setError(null);
      } catch (authError) {
        console.error("Auth state change error:", authError);
        setError(authError.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Value to be provided
  const value = {
    currentUser,
    userProfile,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 