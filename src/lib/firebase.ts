import { initializeApp, getApps, getApp } from 'firebase/app';

// We'll dynamically import auth/firestore/storage to keep the initial bundle small.
const firebaseConfig: Record<string, string> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBFw0Qbyq9zTFTd-tUY6dkmvuFiYMuO2U8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Validate Firebase configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig.filter(key => !(firebaseConfig[key]) || (firebaseConfig[key] || '').includes('your-project'));

if (missingConfig.length > 0) {
  console.error('Missing Firebase configuration:', missingConfig);
  console.error('Please set the following environment variables in Netlify:');
  console.error('VITE_FIREBASE_API_KEY');
  console.error('VITE_FIREBASE_AUTH_DOMAIN');
  console.error('VITE_FIREBASE_PROJECT_ID');
  console.error('VITE_FIREBASE_STORAGE_BUCKET');
  console.error('VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.error('VITE_FIREBASE_APP_ID');
}

let app: any = null;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create a fallback app to prevent complete failure
  app = null;
}
// Export mutable references (may be populated asynchronously)
export let db: any = null;
export let auth: any = null;
export let storage: any = null;

export const isFirebaseInitialized = !!app;

// Immediately but asynchronously load auth, firestore and storage so their bundles
// are fetched separately and don't bloat the initial bundle.
if (app) {
  // auth
  import('firebase/auth').then((m) => {
    try {
      auth = m.getAuth(app);
    } catch (err) {
      console.error('Error initializing firebase auth:', err);
    }
  }).catch((err) => {
    console.error('Failed to dynamically import firebase/auth:', err);
  });

  // firestore
  import('firebase/firestore').then((m) => {
    try {
      db = m.getFirestore(app);
    } catch (err) {
      console.error('Error initializing firestore:', err);
    }
  }).catch((err) => {
    console.error('Failed to dynamically import firebase/firestore:', err);
  });

  // storage
  import('firebase/storage').then((m) => {
    try {
      storage = m.getStorage(app);
    } catch (err) {
      console.error('Error initializing storage:', err);
    }
  }).catch((err) => {
    console.error('Failed to dynamically import firebase/storage:', err);
  });
}

// Async getters for code that wants the service and can await it.
export async function getAuthAsync() {
  if (auth) return auth;
  if (!app) return null;
  const m = await import('firebase/auth');
  auth = m.getAuth(app);
  return auth;
}

export async function getDbAsync() {
  if (db) return db;
  if (!app) return null;
  const m = await import('firebase/firestore');
  db = m.getFirestore(app);
  return db;
}

export async function getStorageAsync() {
  if (storage) return storage;
  if (!app) return null;
  const m = await import('firebase/storage');
  storage = m.getStorage(app);
  return storage;
}