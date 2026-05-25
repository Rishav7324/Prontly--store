import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Production-grade Firebase Admin SDK Initialization.
 * Supports individual variables or a single JSON string for high-reliability backend operations.
 */

function getAdminApp(): App {
  const existingApp = getApps().find(app => app.name === 'admin-app');
  if (existingApp) return existingApp;

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

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (serviceAccountRaw) {
    try {
      let sanitized = serviceAccountRaw;
      if ((sanitized.startsWith("'") && sanitized.endsWith("'")) || 
          (sanitized.startsWith('"') && sanitized.endsWith('"'))) {
        sanitized = sanitized.substring(1, sanitized.length - 1);
      }
      
      const serviceAccount = JSON.parse(sanitized);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').trim();
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      }, 'admin-app');
    } catch (e: any) {
      console.error('[FIREBASE_ADMIN_INIT_ERROR]:', e.message);
      throw new Error(`Invalid Service Account configuration.`);
    }
  }

  throw new Error('Firebase Admin credentials missing.');
}

export const getAdminAuth = (): Auth => getAuth(getAdminApp());
export const getAdminDb = (): Firestore => getFirestore(getAdminApp());
