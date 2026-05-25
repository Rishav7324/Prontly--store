import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Refactored Firebase Admin SDK Initialization.
 * Uses individual environment variables to prevent JSON parsing errors
 * caused by newline characters in private keys.
 */

function getAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin environment variables are missing (Project ID, Client Email, or Private Key).');
  }

  // Check if we already have an initialized app with this name
  const existingApp = getApps().find(app => app.name === 'admin-app');
  if (existingApp) return existingApp;

  try {
    // Correctly format the private key to restore newline characters
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
      projectId,
    }, 'admin-app');
  } catch (e: any) {
    console.error('CRITICAL: Firebase Admin Initialization Failed:', e.message);
    throw new Error('Internal Server Error: Secure Service Layer unavailable.');
  }
}

/**
 * Singleton getter for Admin Auth.
 */
export const getAdminAuth = (): Auth => {
  return getAuth(getAdminApp());
};

/**
 * Singleton getter for Admin Firestore.
 */
export const getAdminDb = (): Firestore => {
  return getFirestore(getAdminApp());
};
