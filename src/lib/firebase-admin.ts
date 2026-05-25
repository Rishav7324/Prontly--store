import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Hardened Firebase Admin SDK Initialization.
 * Implements aggressive cleaning of private keys to prevent "UNAUTHENTICATED" errors.
 */

function getAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing critical Firebase Admin environment variables.');
  }

  // Check if we already have an initialized app with this name
  const existingApp = getApps().find(app => app.name === 'admin-app');
  if (existingApp) return existingApp;

  try {
    /**
     * AGGRESSIVE KEY CLEANING
     * 1. Remove surrounding quotes that might be added by env loaders
     * 2. Remove leading/trailing whitespace
     * 3. Handle both \n and \\n escaping
     */
    let cleanedKey = privateKey.trim();
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
      cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
    }
    const formattedPrivateKey = cleanedKey.replace(/\\n/g, '\n');

    console.log(`[FIREBASE_ADMIN_INIT]: Initializing for project ${projectId} with service account ${clientEmail}`);

    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
      projectId,
    }, 'admin-app');
  } catch (e: any) {
    console.error('[FIREBASE_ADMIN_CRITICAL_FAILURE]:', e.message);
    throw new Error(`Authentication bridge failed: ${e.message}`);
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
