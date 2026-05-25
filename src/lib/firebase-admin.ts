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
    // 1. Clean the string: handle potential double-quoting or escaping from env loaders
    let cleanedStr = serviceAccountStr.trim();
    
    // Remove potential surrounding quotes (single or double) that some env loaders add
    if ((cleanedStr.startsWith('"') && cleanedStr.endsWith('"')) || 
        (cleanedStr.startsWith("'") && cleanedStr.endsWith("'"))) {
      cleanedStr = cleanedStr.slice(1, -1).trim();
    }

    // 2. Parse the service account JSON
    // CRITICAL: We DO NOT replace \\n with \n BEFORE parsing, as literal newlines break JSON.parse.
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(cleanedStr);
    } catch (parseErr) {
      // If parsing failed, it might be double-escaped or contain literal newlines that need escaping
      try {
        // Try to escape literal newlines if they exist
        const escapedStr = cleanedStr.replace(/\n/g, '\\n');
        serviceAccount = JSON.parse(escapedStr);
      } catch (innerErr) {
        // Last resort: try to handle double-stringified input
        try {
          cleanedStr = JSON.parse(`"${cleanedStr}"`);
          serviceAccount = JSON.parse(cleanedStr);
        } catch (finalErr: any) {
          throw new Error(`JSON Parse Error: ${finalErr.message}`);
        }
      }
    }

    if (!serviceAccount.private_key || !serviceAccount.project_id) {
      throw new Error('Service account JSON is missing required fields (private_key or project_id).');
    }

    // 3. Format the private_key correctly (MUST have real newlines for the RSA parser)
    if (typeof serviceAccount.private_key === 'string') {
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
