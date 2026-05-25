import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Production-grade Firebase Admin SDK Initialization.
 * Strictly uses the FIREBASE_SERVICE_ACCOUNT JSON string for atomic credential management.
 */

function getAdminApp(): App {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();

  if (!serviceAccountRaw) {
    console.error('[FIREBASE_ADMIN_ERROR]: FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
    throw new Error('Server configuration error: Missing service account credentials.');
  }

  // Check if we already have an initialized app with this name
  const existingApp = getApps().find(app => app.name === 'admin-app');
  if (existingApp) return existingApp;

  try {
    /**
     * CLEANING LOGIC:
     * 1. Remove potential wrapping quotes from the env var (common in some CI/CD environments).
     * 2. Parse the JSON.
     */
    let sanitized = serviceAccountRaw;
    
    // Handle cases where the string is wrapped in single or double quotes
    if ((sanitized.startsWith("'") && sanitized.endsWith("'")) || 
        (sanitized.startsWith('"') && sanitized.endsWith('"'))) {
      sanitized = sanitized.substring(1, sanitized.length - 1);
    }

    const serviceAccount = JSON.parse(sanitized);
    
    /**
     * Handle the private key formatting. 
     * In the JSON source, newlines are usually escaped as '\n'.
     * We ensure they are restored to actual newline characters for the RSA parser.
     */
    if (serviceAccount.private_key) {
      // replace(/\\n/g, '\n') handles cases where the string is double-escaped
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    console.log(`[FIREBASE_ADMIN_INIT]: Attempting authentication for project: ${serviceAccount.project_id}`);

    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
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
