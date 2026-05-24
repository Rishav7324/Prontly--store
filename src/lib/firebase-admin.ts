import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * @fileOverview Hardened Firebase Admin SDK Initialization.
 * Robustly parses Service Account credentials from environment variables.
 */

function getAdminApp(): App {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  }

  if (getApps().length === 0) {
    try {
      // Clean potential quotes and handle multiline artifacts from .env
      let cleanedStr = serviceAccountStr.trim();
      
      // Remove surrounding quotes if they exist (common in some env loaders)
      if ((cleanedStr.startsWith("'") && cleanedStr.endsWith("'")) || 
          (cleanedStr.startsWith('"') && cleanedStr.endsWith('"'))) {
        cleanedStr = cleanedStr.substring(1, cleanedStr.length - 1);
      }

      // Handle literal newlines that might have been escaped as characters
      const serviceAccount = JSON.parse(cleanedStr);

      // Critical: Sanitize the Private Key newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (e: any) {
      console.error('Firebase Admin Initialization Failure:', e.message);
      // Fallback or rethrow with better context
      throw new Error(`Failed to parse Service Account JSON: ${e.message}`);
    }
  }
  
  return getApps()[0];
}

/**
 * Singleton getter for Admin Auth instance.
 */
export const getAdminAuth = (): Auth => {
  return getAuth(getAdminApp());
};
