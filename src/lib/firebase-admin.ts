import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Robust Firebase Admin SDK Initialization.
 * Handles complex environment variable formats and provides singleton instances.
 */

function getAdminApp(): App {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  }

  if (getApps().length === 0) {
    try {
      // 1. Clean the string: remove surrounding quotes, extra whitespace, and handle escaped newlines
      let cleanedStr = serviceAccountStr.trim();
      
      // Remove surrounding single or double quotes if they exist
      if ((cleanedStr.startsWith("'") && cleanedStr.endsWith("'")) || 
          (cleanedStr.startsWith('"') && cleanedStr.endsWith('"'))) {
        cleanedStr = cleanedStr.substring(1, cleanedStr.length - 1);
      }

      // Handle literal escaped newlines that might be in the env string
      cleanedStr = cleanedStr.replace(/\\n/g, '\n');

      // 2. Parse JSON
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(cleanedStr);
      } catch (jsonError) {
        // Fallback for cases where the string might still have double-escaped characters
        console.error('Initial JSON parse failed, attempting secondary cleanup...');
        serviceAccount = JSON.parse(JSON.stringify(cleanedStr).replace(/\\\\n/g, '\\n'));
      }

      // 3. Fix the private key newlines specifically if they are still double-escaped
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      }, 'admin-app');
    } catch (e: any) {
      console.error('CRITICAL: Firebase Admin Initialization Failed:', e.message);
      throw new Error(`Invalid Service Account Configuration: ${e.message}`);
    }
  }
  
  return getApps().find(app => app.name === 'admin-app') || getApps()[0];
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
