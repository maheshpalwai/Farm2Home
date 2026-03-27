import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '../utils/logger';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          let userDoc = await getDoc(userDocRef);

          // Race condition: signup writes the Firestore doc AFTER Firebase Auth
          // fires onAuthStateChanged. Retry once after a short delay so we always
          // get the full profile (with role) instead of falling back to basic data.
          if (!userDoc.exists()) {
            await new Promise((r) => setTimeout(r, 1500));
            userDoc = await getDoc(userDocRef);
          }

          if (userDoc.exists()) {
            const fullUserData = { uid: user.uid, email: user.email, displayName: user.displayName, ...userDoc.data() };
            setCurrentUser(user);
            setUserData(fullUserData);
            localStorage.setItem('currentUser', JSON.stringify(fullUserData));
          } else {
            logger.warn('User found in Auth but not in Firestore');
            const basicData = { uid: user.uid, email: user.email, displayName: user.displayName };
            setCurrentUser(user);
            setUserData(basicData);
            localStorage.setItem('currentUser', JSON.stringify(basicData));
          }
        } catch (error) {
          logger.error('Error fetching user data:', error);
          const basicData = { uid: user.uid, email: user.email, displayName: user.displayName };
          setCurrentUser(user);
          setUserData(basicData);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        localStorage.removeItem('currentUser');
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserData(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
