import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Robust Firebase Admin SDK Initialization.
 * Handles malformed Service Account JSON and provides singleton instances.
 */

function getAdminApp(): App {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  }

  if (getApps().length === 0) {
    try {
      // 1. Clean the string: remove surrounding quotes and extra whitespace
      let cleanedStr = serviceAccountStr.trim();
      if (cleanedStr.startsWith("'") || cleanedStr.startsWith('"')) {
        cleanedStr = cleanedStr.substring(1, cleanedStr.length - 1);
      }

      // 2. Parse JSON
      const serviceAccount = JSON.parse(cleanedStr);

      // 3. Fix the private key newlines if they are double-escaped
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (e: any) {
      console.error('CRITICAL: Firebase Admin Initialization Failed:', e.message);
      throw new Error(`Invalid Service Account Configuration: ${e.message}`);
    }
  }
  
  return getApps()[0];
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
