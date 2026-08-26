'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Firebase is used for AUTH ONLY.
 * All data lives in Neon Postgres via /api routes (src/lib/db).
 */
export function initializeFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  return { app, auth };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export { errorEmitter } from './error-emitter';
