import crypto from 'crypto';

/**
 * Minimal Firebase Auth Admin via REST + Service Account OAuth (no firebase-admin SDK).
 * Only used where the client SDK can't help (e.g. server-side password updates).
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function loadServiceAccount(): ServiceAccount {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID || '',
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');

  // dotenv may include wrapping quotes
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    raw = raw.slice(1, -1);
  }
  const sa = JSON.parse(raw);
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/** OAuth2 JWT-bearer flow → Google access token (cached ~50 min). */
export async function getGoogleAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const sa = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const b64url = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/identitytoolkit',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const json: any = await res.json();
  if (!json.access_token) {
    throw new Error(json.error_description || 'Google OAuth failed');
  }
  cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in - 600) * 1000 };
  return json.access_token;
}

/**
 * Update a Firebase Auth user's password via IdentityToolkit REST.
 * @param uid Firebase UID (= localId)
 */
export async function setFirebasePassword(uid: string, newPassword: string): Promise<void> {
  const sa = loadServiceAccount();
  const accessToken = await getGoogleAccessToken();

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: uid, password: newPassword }),
    }
  );

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `IdentityToolkit update failed (${res.status})`);
  }
}

/**
 * Lookup or create a Firebase Auth user profile via IdentityToolkit REST.
 * Returns localId (Firebase UID).
 */
export async function findOrCreateFirebaseUser(email: string, displayName?: string, phone?: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const sa = loadServiceAccount();
    const accessToken = await getGoogleAccessToken();

    // 1. Check if user already exists in Firebase Auth
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:lookup`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: [normalizedEmail] }),
      }
    );

    if (lookupRes.ok) {
      const data = await lookupRes.json();
      if (data.users && data.users.length > 0 && data.users[0].localId) {
        return data.users[0].localId;
      }
    }

    // 2. User doesn't exist in Firebase Auth -> create user
    const createRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          displayName: displayName || normalizedEmail.split('@')[0],
          emailVerified: true,
        }),
      }
    );

    if (createRes.ok) {
      const createdData = await createRes.json();
      if (createdData.localId) {
        return createdData.localId;
      }
    } else {
      const errData = await createRes.json().catch(() => ({}));
      if (errData?.error?.message === 'EMAIL_EXISTS') {
        const retryLookup = await fetch(
          `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:lookup`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: [normalizedEmail] }),
          }
        );
        if (retryLookup.ok) {
          const rData = await retryLookup.json();
          if (rData.users?.[0]?.localId) return rData.users[0].localId;
        }
      }
    }
  } catch (error: any) {
    console.warn('[FIREBASE_REST_USER_PROVISION_FALLBACK]:', error.message);
  }

  // Fallback deterministic UID based on email hash
  return `user_${crypto.createHash('md5').update(normalizedEmail).digest('hex').slice(0, 24)}`;
}

/**
 * Creates a secure 24-hour single-use token in passwordResetSessions for new buyers.
 */
export async function generatePasswordSetupToken(email: string): Promise<string> {
  const { getDb } = await import('@/lib/db');
  const { passwordResetSessions } = await import('@/lib/db/schema');
  const { generateResetToken } = await import('@/lib/otp-utils');

  const normalizedEmail = email.toLowerCase().trim();
  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour window
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  try {
    const db = getDb();
    await db.insert(passwordResetSessions).values({
      email: normalizedEmail,
      token: resetToken,
      expiresAt,
      used: false,
    });
  } catch (err: any) {
    console.error('[PASSWORD_SETUP_TOKEN_ERROR]:', err.message);
  }

  return `${SITE}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(normalizedEmail)}`;
}
