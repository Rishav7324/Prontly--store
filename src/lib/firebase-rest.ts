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
