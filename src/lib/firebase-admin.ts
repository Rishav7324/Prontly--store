import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Production-grade Firebase Admin SDK Initialization.
 * Supports individual variables (preferred for stability) or a single JSON string.
 */

function getAdminApp(): App {
  // Check for existing named instance to prevent duplicate app errors in Next.js HMR
  const existingApp = getApps().find(app => app.name === 'admin-app');
  if (existingApp) return existingApp;

  // 1. Try Individual Environment Variables (Most Stable)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    }, 'admin-app');
  }

  // 2. Fallback to Full JSON String (FIREBASE_SERVICE_ACCOUNT)
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (serviceAccountRaw) {
    try {
      // Clean string: handle surrounding quotes and hidden newlines
      let sanitized = serviceAccountRaw;
      if ((sanitized.startsWith("'") && sanitized.endsWith("'")) || 
          (sanitized.startsWith('"') && sanitized.endsWith('"'))) {
        sanitized = sanitized.substring(1, sanitized.length - 1);
      }
      
      const serviceAccount = JSON.parse(sanitized);
      
      // Fix private key formatting within the parsed object
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').trim();
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      }, 'admin-app');
    } catch (e: any) {
      console.error('[FIREBASE_ADMIN_JSON_ERROR]: Failed to parse service account JSON string.');
      console.error('[DEBUG]: String starts with:', serviceAccountRaw.substring(0, 10));
      throw new Error(`Invalid Service Account JSON: ${e.message}`);
    }
  }

  throw new Error('Firebase Admin credentials missing. Set individual FIREBASE_* variables or FIREBASE_SERVICE_ACCOUNT.');
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
