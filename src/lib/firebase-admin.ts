
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * @fileOverview Hardened Firebase Admin SDK Initialization.
 * Solves "Missing error payload" by sanitizing private keys and preventing multiple instances.
 */

function getAdminApp(): App {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  }

  if (getApps().length === 0) {
    try {
      // 1. Parse JSON
      const serviceAccount = JSON.parse(serviceAccountStr);

      // 2. Critical: Sanitize the Private Key
      // Handles both literal \n characters and real newlines from different env providers
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key
          .replace(/\\n/g, '\n')
          .replace(/"/g, ''); // Remove potential accidental quotes
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (e: any) {
      console.error('Firebase Admin Init Failure:', e.message);
      throw new Error(`Failed to initialize Firebase Admin: ${e.message}`);
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
