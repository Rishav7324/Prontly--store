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

  // Check if we already have an initialized app with this name
  const existingApp = getApps().find(app => app.name === 'admin-app');
  if (existingApp) return existingApp;

  try {
    // 1. Clean the string: handle potential double-quoting from env loaders
    let cleanedStr = serviceAccountStr.trim();
    
    // Remove potential surrounding quotes added by env loaders (single or double)
    // We do this in a loop to handle multiple layers of wrapping if they exist
    while (
      (cleanedStr.startsWith('"') && cleanedStr.endsWith('"')) || 
      (cleanedStr.startsWith("'") && cleanedStr.endsWith("'"))
    ) {
      cleanedStr = cleanedStr.slice(1, -1).trim();
    }

    // 2. Resolve escaped characters (common when pasting multi-line JSON into single-line env fields)
    // Replace literal '\n' strings with actual newline characters
    cleanedStr = cleanedStr.replace(/\\n/g, '\n');

    // 3. Parse the service account JSON
    const serviceAccount = JSON.parse(cleanedStr);

    // 4. Ensure the private_key is correctly formatted (it must have real newlines)
    if (serviceAccount.private_key) {
      // Sometimes the private key itself within the JSON still has escaped \n
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    }, 'admin-app');
  } catch (e: any) {
    console.error('CRITICAL: Firebase Admin Initialization Failed:', e.message);
    // Provide a descriptive error for the UI
    throw new Error(`Invalid Service Account Configuration: ${e.message}`);
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
