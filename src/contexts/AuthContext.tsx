import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from '../lib/firebase';

export type UserRole = 'user' | 'host' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: any;
  updatedAt: any;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  firebaseError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // initializing indicates the auth/profile background setup is in progress
  const [initializing, setInitializing] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [profileUnsubscribe, setProfileUnsubscribe] = useState<(() => void) | null>(null);

  const createUserProfile = useCallback(async (user: User, isNewUser: boolean = false): Promise<UserProfile> => {
    if (!db) throw new Error('Database not initialized');
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists() || isNewUser) {
      // Create new user profile with default role
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        displayName: user.displayName || '',
        photoURL: '',
        phoneNumber: '',
        mfaEnabled: false,
        mfaSecret: ''
      };
      
      await setDoc(userRef, newProfile, { merge: true });
      return newProfile;
    } else {
      // For existing users, preserve their custom photoURL from Firestore
      const existingProfile = userSnap.data() as UserProfile;
      const updatedProfile = {
        ...existingProfile,
        email: user.email || existingProfile.email,
        displayName: existingProfile.displayName || user.displayName || '',
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, updatedProfile, { merge: true });
      return updatedProfile;
    }
  }, []);

  useEffect(() => {
    // Check if Firebase is properly initialized
    if (!isFirebaseInitialized || !auth || !db) {
      setFirebaseError('Firebase is not properly configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Clean up previous profile listener
      if (profileUnsubscribe) {
        profileUnsubscribe();
        setProfileUnsubscribe(null);
      }

      // Set user immediately so UI can render as soon as possible
      setUser(user);

      if (user) {
        // Initialize profile & onSnapshot listener in background so we don't block rendering
        (async () => {
          try {
            if (!db) {
              console.error('Firestore `db` is not available during auth profile initialization.');
              setUserProfile(null);
              return;
            }

            const userRef = doc(db, 'users', user.uid);
            await createUserProfile(user);

            const unsubscribeProfile = onSnapshot(userRef, (doc) => {
              if (doc.exists()) {
                const profileData = doc.data() as UserProfile;
                setUserProfile(profileData);
              } else {
                setUserProfile(null);
              }
            }, (error) => {
              console.error('Error listening to user profile:', error);
              setUserProfile(null);
            });

            setProfileUnsubscribe(() => unsubscribeProfile);
          } catch (error) {
            console.error('Error setting up user profile listener:', error);
            setUserProfile(null);
          }
        })();
      } else {
        setUserProfile(null);
      }

      // Mark that initial auth check ran; do not block rendering on this
      setLoading(false);
      setInitializing(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, [createUserProfile]);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not initialized');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not initialized');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Auth not initialized');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!auth) throw new Error('Auth not initialized');
    
    try {
      // Clean up profile listener before signing out
      if (profileUnsubscribe) {
        profileUnsubscribe();
        setProfileUnsubscribe(null);
      }
      
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw the error, just log it
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return userProfile?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return userProfile ? roles.includes(userProfile.role) : false;
  };

  const value = {
    user,
    userProfile,
    loading,
    initializing,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    hasRole,
    hasAnyRole,
    firebaseError
  };

  // Small skeleton overlay shown while auth is initializing to improve perceived performance
  const AuthSkeleton = () => (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] pointer-events-none">
      <div className="animate-pulse bg-white/60 dark:bg-gray-900/60 rounded-xl p-6 shadow-lg">Initializing...</div>
    </div>
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {initializing && <AuthSkeleton />}
    </AuthContext.Provider>
  );
};