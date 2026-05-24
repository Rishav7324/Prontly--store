
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * @fileOverview Production-grade Firebase Admin SDK Initialization.
 * Ensures a single instance is maintained and handles private key formatting.
 */

function getAdminApp(): App {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  }

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(serviceAccountStr);

    // Fix for malformed private keys in environment variables
    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
  
  return getApps()[0];
}

export const adminAuth: Auth = getAuth(getAdminApp());
