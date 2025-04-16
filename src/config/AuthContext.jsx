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
  const [authInitialized, setAuthInitialized] = useState(false);

  // Check for cached user data on mount
  useEffect(() => {
    try {
      // Check for cached user data in localStorage
      const cachedUserData = localStorage.getItem('user');
      
      if (cachedUserData) {
        const userData = JSON.parse(cachedUserData);
        console.log('Found cached user data:', userData);
        
        // Set initial user profile from cache while waiting for Firebase
        setUserProfile(userData);
      }
    } catch (err) {
      console.error('Error loading cached user data:', err);
    }
  }, []);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthInitialized(true);
      
      try {
        if (user) {
          // User is signed in
          console.log('Firebase user authenticated:', user.uid);
          setCurrentUser(user);
          
          try {
            // Get user profile from Firestore
            const profile = await getUserProfile(user.uid);
            console.log('Retrieved user profile from Firestore');
            
            // Merge any existing fields from localStorage if present
            const cachedUserStr = localStorage.getItem('user');
            const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : {};
            
            const mergedProfile = {
              ...cachedUser,
              ...profile,
              userId: user.uid,
              email: user.email,
              username: profile.username || user.displayName || user.email.split('@')[0],
            };
            
            setUserProfile(mergedProfile);
            
            // Store in localStorage for persistence
            localStorage.setItem('user', JSON.stringify(mergedProfile));
          } catch (profileError) {
            console.error("Error loading user profile:", profileError);
            
            // Check if we have a cached profile to use
            const cachedUserStr = localStorage.getItem('user');
            
            if (cachedUserStr) {
              const cachedUser = JSON.parse(cachedUserStr);
              console.log('Using cached user profile as fallback');
              setUserProfile(cachedUser);
            } else {
              // Create a basic profile if nothing exists
              const basicProfile = {
                userId: user.uid,
                username: user.displayName || user.email.split('@')[0],
                email: user.email,
                coins: 100,
                level: 1,
                xp: 30
              };
              
              console.log('Created basic user profile as fallback');
              setUserProfile(basicProfile);
              localStorage.setItem('user', JSON.stringify(basicProfile));
            }
          }
        } else {
          // User is signed out in Firebase
          console.log('No authenticated user in Firebase');
          
          // Check if we have cached user data before clearing everything
          const cachedUserStr = localStorage.getItem('user');
          
          if (cachedUserStr && !authInitialized) {
            // On first load, if we have cached user but Firebase hasn't initialized yet,
            // don't clear the user data immediately
            console.log('Keeping cached user data until auth fully initializes');
          } else {
            // Otherwise clear the user data
            console.log('Clearing user data');
            setCurrentUser(null);
            setUserProfile(null);
            localStorage.removeItem('user');
          }
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
  }, [authInitialized]);

  // Value to be provided
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    authInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 