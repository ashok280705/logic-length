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
      console.log('AuthProvider: Checking for cached user data');
      // Check for cached user data in localStorage
      const cachedUserData = localStorage.getItem('user');
      
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          console.log('Found cached user data:', {
            userId: userData.userId,
            username: userData.username,
            hasEmail: !!userData.email,
            coins: userData.coins
          });
          
          // Validate minimum required fields
          if (userData && userData.userId) {
            // Set initial user profile from cache while waiting for Firebase
            setUserProfile(userData);
            console.log('Set user profile from cached data');
          } else {
            console.warn('Cached user data is invalid, missing userId');
            localStorage.removeItem('user');
          }
        } catch (parseError) {
          console.error('Invalid JSON in localStorage user data:', parseError);
          localStorage.removeItem('user');
        }
      } else {
        console.log('No cached user data found in localStorage');
      }
    } catch (err) {
      console.error('Error loading cached user data:', err);
    }
  }, []);

  useEffect(() => {
    console.log('AuthProvider: Setting up Firebase auth listener');
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
            console.log('User profile set with merged data');
            
            // Store in localStorage for persistence
            localStorage.setItem('user', JSON.stringify(mergedProfile));
          } catch (profileError) {
            console.error("Error loading user profile:", profileError);
            
            // Check if we have a cached profile to use
            const cachedUserStr = localStorage.getItem('user');
            
            if (cachedUserStr) {
              try {
                const cachedUser = JSON.parse(cachedUserStr);
                console.log('Using cached user profile as fallback');
                setUserProfile(cachedUser);
              } catch (parseError) {
                console.error('Invalid JSON in localStorage fallback:', parseError);
                createBasicProfile(user);
              }
            } else {
              createBasicProfile(user);
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
            
            try {
              // Validate the cached data
              const cachedUser = JSON.parse(cachedUserStr);
              if (cachedUser && cachedUser.userId) {
                console.log('Using valid cached user data temporarily');
              } else {
                console.warn('Cached user data is invalid');
                clearUserData();
              }
            } catch (e) {
              console.error('Error parsing cached user data:', e);
              clearUserData();
            }
          } else {
            // Otherwise clear the user data
            clearUserData();
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

  // Helper function to create a basic profile
  const createBasicProfile = (user) => {
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
  };
  
  // Helper function to clear user data
  const clearUserData = () => {
    console.log('Clearing user data');
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('user');
  };

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