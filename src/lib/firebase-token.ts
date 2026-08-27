import crypto from 'crypto';

/**
 * Pure-crypto Firebase ID token verification — NO firebase-admin dependency.
 * Verifies RS256 signature against Google's public x509 certs and checks
 * aud/iss/exp/sub claims per https://firebase.google.com/docs/reference/admin/node/authentication
 */

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}
let cache: CertCache | null = null;

async function getPublicCerts(): Promise<Record<string, string>> {
  if (cache && Date.now() < cache.expiresAt) return cache.certs;

  const res = await fetch(CERT_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch Firebase public certs (${res.status})`);

  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  cache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export interface DecodedIdToken {
  uid: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  auth_time: number;
  [key: string]: any;
}

/**
 * Verify a Firebase ID token (RS256) without firebase-admin.
 * Throws Error with readable message on any failure.
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== 'string' || idToken.length < 20) {
    throw new Error('Malformed ID token');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Malformed ID token');

  const [rawHeader, rawPayload, rawSignature] = parts;

  // Decode header
  let header: { alg?: string; kid?: string };
  try {
    header = JSON.parse(base64UrlDecode(rawHeader).toString('utf8'));
  } catch {
    throw new Error('Invalid token header');
  }
  if (header.alg !== 'RS256') throw new Error(`Unsupported algorithm ${header.alg}`);
  if (!header.kid) throw new Error('Token missing kid');

  // Fetch certs and pick matching kid
  const certs = await getPublicCerts();
  const publicKeyPem = certs[header.kid];
  if (!publicKeyPem) throw new Error('Unknown token kid — cert not found');

  // Verify RS256 signature
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${rawHeader}.${rawPayload}`);
  const signature = base64UrlDecode(rawSignature);
  const valid = verifier.verify(publicKeyPem, signature);
  if (!valid) throw new Error('Invalid token signature');

  // Decode & validate claims
  let payload: DecodedIdToken;
  try {
    payload = JSON.parse(base64UrlDecode(rawPayload).toString('utf8'));
  } catch {
    throw new Error('Invalid token payload');
  }

  const projectId = PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID missing');
  if (payload.aud !== projectId) throw new Error('Token audience mismatch');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Token issuer mismatch');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new Error('Token expired');
  if (typeof payload.auth_time !== 'number' || payload.auth_time > now + 300) {
    throw new Error('Token auth_time in future');
  }
  if (!payload.sub || typeof payload.sub !== 'string') throw new Error('Token missing subject');

  return { ...payload, uid: payload.sub };
}
