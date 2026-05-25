import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Hardened Firebase Admin SDK Initialization.
 * Implements aggressive cleaning of private keys to prevent "UNAUTHENTICATED" errors.
 */

function getAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[FIREBASE_ADMIN_ERROR]: Missing environment variables', { 
      hasProjectId: !!projectId, 
      hasEmail: !!clientEmail, 
      hasKey: !!privateKey 
    });
    throw new Error('Missing critical Firebase Admin environment variables.');
  }

  // Check if we already have an initialized app with this name
  const existingApp = getApps().find(app => app.name === 'admin-app');
  if (existingApp) return existingApp;

  try {
    /**
     * ADVANCED KEY CLEANING
     * Handles wrapping quotes, literal newlines, and escaped newlines.
     */
    let cleanedKey = privateKey;
    
    // Remove surrounding quotes if present
    if ((cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) || 
        (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))) {
      cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
    }
    
    // Convert escaped \n or \\n into actual newline characters
    const formattedPrivateKey = cleanedKey.replace(/\\n/g, '\n');

    // Basic validity check for RSA key
    if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Private key format appears invalid (missing header).');
    }

    console.log(`[FIREBASE_ADMIN_INIT]: Initializing for project: ${projectId}`);

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
